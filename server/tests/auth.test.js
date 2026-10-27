import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';

const XHR = { 'X-Requested-With': 'XMLHttpRequest' };
const citizen = { name: 'Asha Kumar', email: 'asha@example.com', password: 'Passw0rdOK' };
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  await User.init(); // build the unique email index
});
afterEach(async () => {
  await User.deleteMany({});
});
afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('GET /api/health', () => {
  it('reports ok and database state', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });
});

describe('POST /api/auth/register', () => {
  it('creates a citizen, sets an HttpOnly cookie and hides the password hash', async () => {
    const res = await request(app).post('/api/auth/register').set(XHR).send(citizen);
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('citizen');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
  });

  it('ignores a user-supplied role (no privilege escalation)', async () => {
    const res = await request(app).post('/api/auth/register').set(XHR).send({ ...citizen, role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('citizen');
  });

  it('rejects duplicate emails with 409', async () => {
    await request(app).post('/api/auth/register').set(XHR).send(citizen);
    const res = await request(app).post('/api/auth/register').set(XHR).send(citizen);
    expect(res.status).toBe(409);
  });

  it('rejects invalid input with field-level errors', async () => {
    const res = await request(app).post('/api/auth/register').set(XHR).send({ name: 'A', email: 'bad', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.errors.length).toBeGreaterThanOrEqual(3);
  });

  it('rejects state-changing requests without the X-Requested-With header', async () => {
    const res = await request(app).post('/api/auth/register').send(citizen);
    expect(res.status).toBe(403);
  });
});

describe('POST /api/auth/login and GET /api/auth/me', () => {
  it('logs in with correct credentials and /me works with the cookie', async () => {
    await request(app).post('/api/auth/register').set(XHR).send(citizen);
    const agent = request.agent(app);
    const login = await agent.post('/api/auth/login').set(XHR).send({ email: citizen.email, password: citizen.password });
    expect(login.status).toBe(200);
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe(citizen.email);
  });

  it('rejects a wrong password with 401', async () => {
    await request(app).post('/api/auth/register').set(XHR).send(citizen);
    const res = await request(app).post('/api/auth/login').set(XHR).send({ email: citizen.email, password: 'WrongPass1' });
    expect(res.status).toBe(401);
  });

  it('blocks suspended accounts with 403', async () => {
    await request(app).post('/api/auth/register').set(XHR).send(citizen);
    await User.updateOne({ email: citizen.email }, { accountStatus: 'suspended' });
    const res = await request(app).post('/api/auth/login').set(XHR).send({ email: citizen.email, password: citizen.password });
    expect(res.status).toBe(403);
  });

  it('returns 401 from /me without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for a garbage token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.token');
    expect(res.status).toBe(401);
  });
});
