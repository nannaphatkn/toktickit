import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Lab 03 IT Staff Ticket Operations API Tests', () => {
  let staffToken: string;
  let lisaId: number;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'michael.brown@toktickit.com', password: 'Password123!' });
    staffToken = res.body.token;

    // Fetch Lisa's ID
    const lisaRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'lisa.martinez@toktickit.com', password: 'Password123!' });
    lisaId = lisaRes.body.user.id;
  });

  it('API-08: IT Staff can claim/reassign ticket owner', async () => {
    const res = await request(app)
      .patch('/api/staff/tickets/1/assign')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ ownerId: lisaId });

    expect(res.status).toBe(200);
    expect(res.body.ticket.ownerId).toBe(lisaId);
  });

  it('API-09: IT Staff can update IT Priority', async () => {
    const res = await request(app)
      .patch('/api/staff/tickets/1/priority')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ itPriority: 'URGENT' });

    expect(res.status).toBe(200);
    expect(res.body.ticket.itPriority).toBe('URGENT');
  });

  it('API-10: IT Staff can transition ticket status', async () => {
    const res = await request(app)
      .patch('/api/staff/tickets/1/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(200);
    expect(res.body.ticket.currentStatus).toBe('RESOLVED');
  });
});
