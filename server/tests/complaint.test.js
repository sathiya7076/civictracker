import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Never call the real Cloudinary in tests.
vi.mock('../src/services/uploadService.js', () => ({
  deleteImagesByUrl: vi.fn(async () => {}),
  uploadImages: vi.fn(async (files = []) => files.map((_, i) => `https://res.cloudinary.test/image-${i}.png`)),
}));

import app from '../src/app.js';
import User from '../src/models/User.js';
import Complaint from '../src/models/Complaint.js';
import ComplaintUpdate from '../src/models/ComplaintUpdate.js';

const XHR = { 'X-Requested-With': 'XMLHttpRequest' };
const PASSWORD = 'Passw0rdOK';
const fields = {
  title: 'Big pothole on Main Road',
  description: 'Deep pothole near the bus stop causing accidents',
  category: 'Road Damage',
  address: 'Main Road, Salem',
};
const png = { name: 'a.png', type: 'image/png', buffer: Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]) };

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await Promise.all([User.init(), Complaint.init()]);
});
afterEach(async () => {
  await Promise.all([User.deleteMany({}), Complaint.deleteMany({}), ComplaintUpdate.deleteMany({})]);
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

async function citizenAgent(email) {
  const agent = request.agent(app);
  await agent.post('/api/auth/register').set(XHR).send({ name: 'Citizen', email, password: PASSWORD });
  return agent;
}

async function staffAgent(email) {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const user = await User.create({ name: 'Staff', email, passwordHash, role: 'staff' });
  const agent = request.agent(app);
  await agent.post('/api/auth/login').set(XHR).send({ email, password: PASSWORD });
  return { agent, user };
}

function submit(agent, overrides = {}, files = []) {
  let req = agent.post('/api/complaints').set(XHR);
  for (const [k, v] of Object.entries({ ...fields, ...overrides })) req = req.field(k, v);
  for (const f of files) req = req.attach('images', f.buffer, { filename: f.name, contentType: f.type });
  return req;
}

describe('POST /api/complaints', () => {
  it('creates a Pending complaint with a reference id, image URLs and first timeline entry', async () => {
    const agent = await citizenAgent('a@example.com');
    const res = await submit(agent, { latitude: '11.65', longitude: '78.16' }, [png]);
    expect(res.status).toBe(201);
    const c = res.body.data.complaint;
    expect(c.complaintId).toMatch(/^CT-\d{8}-[A-Z0-9]{5}$/);
    expect(c.status).toBe('Pending');
    expect(c.images).toHaveLength(1);
    expect(await ComplaintUpdate.countDocuments({ complaint: c._id })).toBe(1);
  });

  it('works without photos or coordinates', async () => {
    const agent = await citizenAgent('a@example.com');
    expect((await submit(agent)).status).toBe(201);
  });

  it('returns field errors for invalid input', async () => {
    const agent = await citizenAgent('a@example.com');
    const res = await submit(agent, { title: 'x', category: 'Nope', latitude: '12' });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('requires login', async () => {
    const res = await request(app).post('/api/complaints').set(XHR).send(fields);
    expect(res.status).toBe(401);
  });

  it('forbids staff from creating complaints', async () => {
    const { agent } = await staffAgent('s@example.com');
    expect((await submit(agent)).status).toBe(403);
  });
});

describe('upload validation', () => {
  it('rejects non-image mime types', async () => {
    const agent = await citizenAgent('a@example.com');
    const res = await submit(agent, {}, [{ name: 'a.pdf', type: 'application/pdf', buffer: Buffer.from('%PDF-1.4 fake') }]);
    expect(res.status).toBe(400);
  });

  it('rejects a text file disguised as a PNG', async () => {
    const agent = await citizenAgent('a@example.com');
    const res = await submit(agent, {}, [{ name: 'a.png', type: 'image/png', buffer: Buffer.from('this is definitely not an image') }]);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not a valid image/i);
  });

  it('rejects more than 5 images', async () => {
    const agent = await citizenAgent('a@example.com');
    const res = await submit(agent, {}, Array(6).fill(png));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/complaints/my', () => {
  it('paginates, filters and only returns the caller\'s complaints', async () => {
    const a = await citizenAgent('a@example.com');
    const b = await citizenAgent('b@example.com');
    await submit(a);
    await submit(a);
    await submit(a, { category: 'Water Leakage' });
    await submit(b);

    const page1 = await a.get('/api/complaints/my?limit=2');
    expect(page1.body.data.items).toHaveLength(2);
    expect(page1.body.data.pagination).toMatchObject({ total: 3, totalPages: 2 });

    const water = await a.get('/api/complaints/my?category=Water%20Leakage');
    expect(water.body.data.pagination.total).toBe(1);

    const searched = await a.get('/api/complaints/my?search=pothole');
    expect(searched.body.data.pagination.total).toBe(2);
  });

  it('rejects an invalid status filter', async () => {
    const a = await citizenAgent('a@example.com');
    expect((await a.get('/api/complaints/my?status=Bogus')).status).toBe(400);
  });
});

describe('ownership rules', () => {
  it('hides, blocks edits and blocks deletes of other citizens\' complaints (404)', async () => {
    const owner = await citizenAgent('a@example.com');
    const other = await citizenAgent('b@example.com');
    const id = (await submit(owner)).body.data.complaint._id;

    expect((await other.get(`/api/complaints/${id}`)).status).toBe(404);
    expect((await other.get(`/api/complaints/${id}/updates`)).status).toBe(404);
    expect((await other.put(`/api/complaints/${id}`).set(XHR).send({ title: 'Hijacked title' })).status).toBe(404);
    expect((await other.delete(`/api/complaints/${id}`).set(XHR)).status).toBe(404);
    expect((await owner.get(`/api/complaints/${id}`)).status).toBe(200);
  });

  it('lets only the assigned staff member view a complaint', async () => {
    const owner = await citizenAgent('a@example.com');
    const id = (await submit(owner)).body.data.complaint._id;
    const assigned = await staffAgent('s1@example.com');
    const unassigned = await staffAgent('s2@example.com');
    await Complaint.updateOne({ _id: id }, { assignedStaffId: assigned.user._id, status: 'Assigned' });

    expect((await assigned.agent.get(`/api/complaints/${id}`)).status).toBe(200);
    expect((await unassigned.agent.get(`/api/complaints/${id}`)).status).toBe(404);
  });

  it('returns 400 for a malformed id and 404 for an unknown id', async () => {
    const a = await citizenAgent('a@example.com');
    expect((await a.get('/api/complaints/123')).status).toBe(400);
    expect((await a.get(`/api/complaints/${new mongoose.Types.ObjectId()}`)).status).toBe(404);
  });
});

describe('edit and cancel', () => {
  it('allows editing and cancelling while Pending', async () => {
    const a = await citizenAgent('a@example.com');
    const id = (await submit(a)).body.data.complaint._id;

    const edited = await a.put(`/api/complaints/${id}`).set(XHR).send({ title: 'Updated pothole title' });
    expect(edited.status).toBe(200);
    expect(edited.body.data.complaint.title).toBe('Updated pothole title');

    expect((await a.delete(`/api/complaints/${id}`).set(XHR)).status).toBe(200);
    expect(await Complaint.countDocuments({ _id: id })).toBe(0);
  });

  it('blocks editing and cancelling once the complaint is no longer Pending (409)', async () => {
    const a = await citizenAgent('a@example.com');
    const id = (await submit(a)).body.data.complaint._id;
    await Complaint.updateOne({ _id: id }, { status: 'In Progress' });

    expect((await a.put(`/api/complaints/${id}`).set(XHR).send({ title: 'Too late for edits' })).status).toBe(409);
    expect((await a.delete(`/api/complaints/${id}`).set(XHR)).status).toBe(409);
  });

  it('returns the timeline for the owner', async () => {
    const a = await citizenAgent('a@example.com');
    const id = (await submit(a)).body.data.complaint._id;
    const res = await a.get(`/api/complaints/${id}/updates`);
    expect(res.status).toBe(200);
    expect(res.body.data.updates[0]).toMatchObject({ newStatus: 'Pending', previousStatus: null });
  });
});