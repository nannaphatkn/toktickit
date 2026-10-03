import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Lab 03 Authorization & RBAC API Tests', () => {
  let requesterToken: string;
  let mustChangePassToken: string;

  beforeAll(async () => {
    // Login Requester
    const reqRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jennifer.anderson@toktickit.com', password: 'Password123!' });
    requesterToken = reqRes.body.token;

    // Login User requiring password change
    const mustChangeRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'emily.davis@toktickit.com', password: 'Password123!' });
    mustChangePassToken = mustChangeRes.body.token;
  });

  it('API-04: User requiring password change is blocked from IT Staff Queue', async () => {
    const res = await request(app)
      .get('/api/staff/tickets')
      .set('Authorization', `Bearer ${mustChangePassToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/password change required/i);
  });

  it('API-05: Requester role is forbidden from accessing Admin Users API', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
  });

  it('API-06: Unauthenticated request to staff queue returns 401', async () => {
    const res = await request(app).get('/api/staff/tickets');
    expect(res.status).toBe(401);
  });
});
