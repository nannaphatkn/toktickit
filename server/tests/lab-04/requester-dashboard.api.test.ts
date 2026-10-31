import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Lab 04 Requester Dashboard API Tests', () => {
  let requesterToken: string;
  let staffToken: string;

  beforeAll(async () => {
    // Requester (Jennifer Anderson)
    const reqRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jennifer.anderson@toktickit.com', password: 'Password123!' });
    requesterToken = reqRes.body.token;

    // IT Staff (Michael Brown)
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'michael.brown@toktickit.com', password: 'Password123!' });
    staffToken = staffRes.body.token;
  });

  // AC-02 & API-03: Requester dashboard returns scoped metrics
  it('API-03: Requester can retrieve dashboard metrics for their own tickets', async () => {
    const res = await request(app)
      .get('/api/dashboard/requester')
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('openTickets');
    expect(res.body).toHaveProperty('waitingForRequester');
    expect(res.body).toHaveProperty('recentlyUpdated');
    expect(res.body).toHaveProperty('recentlyResolved');
    expect(res.body).toHaveProperty('recentTickets');

    expect(typeof res.body.openTickets).toBe('number');
    expect(typeof res.body.waitingForRequester).toBe('number');
    expect(typeof res.body.recentlyUpdated).toBe('number');
    expect(typeof res.body.recentlyResolved).toBe('number');
    expect(Array.isArray(res.body.recentTickets)).toBe(true);
  });

  // Non-requester forbidden from requester dashboard
  it('IT Staff is forbidden from accessing requester dashboard (403)', async () => {
    const res = await request(app)
      .get('/api/dashboard/requester')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(403);
  });

  // Unauthenticated request rejected
  it('Rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/dashboard/requester');
    expect(res.status).toBe(401);
  });
});
