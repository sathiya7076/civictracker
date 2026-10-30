import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

vi.mock('../src/services/uploadService.js', () => ({
  deleteImagesByUrl: vi.fn(async () => {}),
  uploadImages: vi.fn(async (files = []) => files.map((_, i) => `https://res.cloudinary.test/evidence-${i}.png`)),
}));

import app from '../src/app.js';
import User from '../src/models/User.js';
import Complaint from '../src/models/Complaint.js';
import ComplaintUpdate from '../src/models/ComplaintUpdate.js';
import Notification from '../src/models/Notification.js';
import { canTransition } from '../src/utils/statusTransitions.js';

const XHR = { 'X-Requested-With': 'XMLHttpRequest' };
const PASSWORD = 'Passw0rdOK';
const fields = { title: 'Streetlight broken', description: 'The streetlight near the park has been off for days', category: 'Streetlight', address: 'Park Road, Salem' };
const png = { buffer: Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]) };

let mongod;
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.init(), Complaint.init()]);
});
afterEach(async () => {
  await Promise.all([User, Complaint, ComplaintUpdate, Notification].map((m) => m.deleteMany({})));
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function loginAs(email, role) {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const user = await User.create({ name: `${role} user`, email, passwordHash, role });
  const agent = request.agent(app);
  await agent.post('/api/auth/login').set(XHR).send({ email, password: PASSWORD });
  return { agent, user };
}

async function newComplaint() {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').set(XHR).send({ name: 'Citizen', email: 'c@example.com', password: PASSWORD });
  let req = agent.post('/api/complaints').set(XHR);
  for (const [k, v] of Object.entries(fields)) req = req.field(k, v);
  const res = await req;
  return { citizen: agent, id: res.body.data.complaint._id };
}

const assign = (admin, id, staff) => admin.agent.put(`/api/admin/complaints/${id}/assign`).set(XHR).send({ staffId: staff.user._id.toString() });
const setStatus = (staff, id, status) => staff.agent.put(`/api/staff/complaints/${id}/status`).set(XHR).send({ status });

describe('status transition table', () => {
  it('allows only the documented moves', () => {
    expect(canTransition('Pending', 'Assigned', 'admin')).toBe(true);
    expect(canTransition('Pending', 'Resolved', 'admin')).toBe(false);
    expect(canTransition('In Progress', 'Resolved', 'staff')).toBe(true);
    expect(canTransition('Resolved', 'Closed', 'staff')).toBe(false);
    expect(canTransition('Closed', 'In Progress', 'admin')).toBe(false);
  });
});

describe('full complaint lifecycle', () => {
  it('goes Pending -> Assigned -> In Progress -> Resolved -> Closed with timeline and notifications', async () => {
    const { citizen, id } = await newComplaint();
    const admin = await loginAs('admin@example.com', 'admin');
    const staff = await loginAs('staff@example.com', 'staff');

    expect((await staff.agent.get(`/api/complaints/${id}`)).status).toBe(404); // not assigned yet
    const assigned = await assign(admin, id, staff);
    expect(assigned.status).toBe(200);
    expect(assigned.body.data.complaint.status).toBe('Assigned');

    expect((await staff.agent.get('/api/staff/complaints')).body.data.items).toHaveLength(1);
    expect((await setStatus(staff, id, 'Resolved')).status).toBe(409); // cannot skip In Progress
    expect((await setStatus(staff, id, 'In Progress')).status).toBe(200);

    const close = () => admin.agent.put(`/api/admin/complaints/${id}/verify`).set(XHR).send({ action: 'close' });
    expect((await close()).status).toBe(409); // not resolved yet

    const upload = await staff.agent.post(`/api/staff/complaints/${id}/evidence`).set(XHR).field('note', 'Replaced the bulb').attach('images', png.buffer, { filename: 'after.png', contentType: 'image/png' });
    expect(upload.status).toBe(201);
    expect(upload.body.data.complaint.resolutionEvidence).toHaveLength(1);

    expect((await setStatus(staff, id, 'Resolved')).status).toBe(200);
    expect((await staff.agent.put(`/api/staff/complaints/${id}/status`).set(XHR).send({ status: 'Closed' })).status).toBe(400);

    const closed = await close();
    expect(closed.status).toBe(200);
    expect(closed.body.data.complaint.status).toBe('Closed');

    const timeline = await citizen.get(`/api/complaints/${id}/updates`);
    expect(timeline.body.data.updates.map((u) => u.newStatus)).toEqual(['Pending', 'Assigned', 'In Progress', 'In Progress', 'Resolved', 'Closed']);
    expect(await Notification.countDocuments({ recipient: (await User.findOne({ email: 'c@example.com' }))._id })).toBeGreaterThanOrEqual(4);
  });

  it('refuses to close a resolved complaint that has no evidence, and reopen needs a note', async () => {
    const { id } = await newComplaint();
    const admin = await loginAs('admin@example.com', 'admin');
    await Complaint.updateOne({ _id: id }, { status: 'Resolved' });
    expect((await admin.agent.put(`/api/admin/complaints/${id}/verify`).set(XHR).send({ action: 'close' })).status).toBe(409);
    expect((await admin.agent.put(`/api/admin/complaints/${id}/verify`).set(XHR).send({ action: 'reopen' })).status).toBe(400);
    const reopen = await admin.agent.put(`/api/admin/complaints/${id}/verify`).set(XHR).send({ action: 'reopen', note: 'Light still off' });
    expect(reopen.body.data.complaint.status).toBe('In Progress');
  });

  it('lets admin reject a pending complaint (reason required) but not a closed one', async () => {
    const { id } = await newComplaint();
    const admin = await loginAs('admin@example.com', 'admin');
    expect((await admin.agent.put(`/api/admin/complaints/${id}/reject`).set(XHR).send({})).status).toBe(400);
    expect((await admin.agent.put(`/api/admin/complaints/${id}/reject`).set(XHR).send({ note: 'Duplicate report' })).status).toBe(200);
    expect((await admin.agent.put(`/api/admin/complaints/${id}/reject`).set(XHR).send({ note: 'Again please' })).status).toBe(409);
  });
});

describe('role permissions', () => {
  it('blocks citizens and staff from admin routes, and citizens from staff routes', async () => {
    const { citizen } = await newComplaint();
    const staff = await loginAs('staff@example.com', 'staff');
    expect((await citizen.get('/api/admin/dashboard')).status).toBe(403);
    expect((await staff.agent.get('/api/admin/dashboard')).status).toBe(403);
    expect((await citizen.get('/api/staff/complaints')).status).toBe(403);
    expect((await request(app).get('/api/admin/dashboard')).status).toBe(401);
  });

  it('only assigned staff can change status or upload evidence', async () => {
    const { id } = await newComplaint();
    const admin = await loginAs('admin@example.com', 'admin');
    const owner = await loginAs('s1@example.com', 'staff');
    const other = await loginAs('s2@example.com', 'staff');
    await assign(admin, id, owner);
    expect((await setStatus(other, id, 'In Progress')).status).toBe(404);
    const res = await other.agent.post(`/api/staff/complaints/${id}/evidence`).set(XHR).attach('images', png.buffer, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(404);
  });

  it('rejects assigning to a citizen or a suspended staff member', async () => {
    const { id } = await newComplaint();
    const admin = await loginAs('admin@example.com', 'admin');
    const staff = await loginAs('staff@example.com', 'staff');
    const citizen = await User.findOne({ email: 'c@example.com' });
    expect((await admin.agent.put(`/api/admin/complaints/${id}/assign`).set(XHR).send({ staffId: citizen._id.toString() })).status).toBe(400);
    await User.updateOne({ _id: staff.user._id }, { accountStatus: 'suspended' });
    expect((await assign(admin, id, staff)).status).toBe(400);
  });
});

describe('admin user management', () => {
  it('creates a staff account that can log in, and public registration cannot', async () => {
    const admin = await loginAs('admin@example.com', 'admin');
    const created = await admin.agent.post('/api/admin/staff').set(XHR).send({ name: 'Ravi Staff', email: 'ravi@example.com', password: PASSWORD });
    expect(created.status).toBe(201);
    expect(created.body.data.user.role).toBe('staff');
    expect(created.body.data.user.passwordHash).toBeUndefined();

    const login = await request(app).post('/api/auth/login').set(XHR).send({ email: 'ravi@example.com', password: PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.data.user.role).toBe('staff');

    const dup = await admin.agent.post('/api/admin/staff').set(XHR).send({ name: 'Ravi Staff', email: 'ravi@example.com', password: PASSWORD });
    expect(dup.status).toBe(409);
  });

  it('suspends a user (session blocked immediately) but not itself or another admin', async () => {
    const admin = await loginAs('admin@example.com', 'admin');
    const other = await loginAs('admin2@example.com', 'admin');
    const staff = await loginAs('staff@example.com', 'staff');

    const suspend = await admin.agent.put(`/api/admin/users/${staff.user._id}/status`).set(XHR).send({ status: 'suspended' });
    expect(suspend.status).toBe(200);
    expect((await staff.agent.get('/api/staff/complaints')).status).toBe(403);

    expect((await admin.agent.put(`/api/admin/users/${admin.user._id}/status`).set(XHR).send({ status: 'suspended' })).status).toBe(400);
    expect((await admin.agent.put(`/api/admin/users/${other.user._id}/status`).set(XHR).send({ status: 'suspended' })).status).toBe(403);
  });

  it('lists users with filters', async () => {
    const admin = await loginAs('admin@example.com', 'admin');
    await loginAs('staff@example.com', 'staff');
    const res = await admin.agent.get('/api/admin/users?role=staff');
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.items[0].passwordHash).toBeUndefined();
  });
});

describe('admin dashboard and complaint list', () => {
  it('computes counts from the database and filters unassigned complaints', async () => {
    const { id } = await newComplaint();
    const admin = await loginAs('admin@example.com', 'admin');
    const staff = await loginAs('staff@example.com', 'staff');

    let dash = await admin.agent.get('/api/admin/dashboard');
    expect(dash.body.data.totals).toMatchObject({ total: 1, pending: 1, inProgress: 0, resolved: 0 });
    expect(dash.body.data.byCategory.Streetlight).toBe(1);
    expect((await admin.agent.get('/api/admin/complaints?staff=unassigned')).body.data.items).toHaveLength(1);

    await assign(admin, id, staff);
    dash = await admin.agent.get('/api/admin/dashboard');
    expect(dash.body.data.totals.pending).toBe(0);
    expect((await admin.agent.get('/api/admin/complaints?staff=unassigned')).body.data.items).toHaveLength(0);
    expect((await admin.agent.get('/api/admin/complaints?priority=Bogus')).status).toBe(400);
    expect((await admin.agent.put(`/api/admin/complaints/${id}/priority`).set(XHR).send({ priority: 'Urgent' })).body.data.complaint.priority).toBe('Urgent');

    const staffStats = await staff.agent.get('/api/staff/stats');
    expect(staffStats.body.data.stats).toMatchObject({ total: 1, assigned: 1, inProgress: 0, completed: 0 });
  });
});