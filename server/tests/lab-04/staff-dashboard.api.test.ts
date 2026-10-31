import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Lab 04 IT Staff Dashboard API Tests', () => {
  let staffToken: string;
  let adminToken: string;
  let requesterToken: string;

  beforeAll(async () => {
    // IT Staff (Michael Brown)
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'michael.brown@toktickit.com', password: 'Password123!' });
    staffToken = staffRes.body.token;

    // Administrator (John Smith)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john.smith@toktickit.com', password: 'Password123!' });
    adminToken = adminRes.body.token;

    // Requester (Jennifer Anderson)
    const reqRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jennifer.anderson@toktickit.com', password: 'Password123!' });
    requesterToken = reqRes.body.token;
  });

  // AC-03 & API-04: IT Staff dashboard returns metrics
  it('API-04: IT Staff can retrieve staff dashboard metrics', async () => {
    const res = await request(app)
      .get('/api/dashboard/staff')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('unassigned');
    expect(res.body).toHaveProperty('myTickets');
    expect(res.body).toHaveProperty('openInProgress');
    expect(res.body).toHaveProperty('urgentPriority');
    expect(res.body).toHaveProperty('byStatus');
    expect(res.body).toHaveProperty('byPriority');
    expect(res.body).toHaveProperty('recentTickets');

    expect(typeof res.body.unassigned).toBe('number');
    expect(typeof res.body.myTickets).toBe('number');
    expect(typeof res.body.byStatus.NEW).toBe('number');
    expect(typeof res.body.byStatus.OPEN).toBe('number');
    expect(typeof res.body.byStatus.IN_PROGRESS).toBe('number');
    expect(typeof res.body.byPriority.URGENT).toBe('number');
    expect(Array.isArray(res.body.recentTickets)).toBe(true);
  });

  // Administrator can also access staff dashboard
  it('Administrator can access staff dashboard', async () => {
    const res = await request(app)
      .get('/api/dashboard/staff')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('unassigned');
  });

  // Requester is forbidden from staff dashboard
  it('Requester is forbidden from staff dashboard (403)', async () => {
    const res = await request(app)
      .get('/api/dashboard/staff')
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
  });

  // Unauthenticated request rejected
  it('Rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/dashboard/staff');
    expect(res.status).toBe(401);
  });
});
