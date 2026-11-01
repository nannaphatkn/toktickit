import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

import { prisma } from '../../src/prisma';

describe('Lab 04 Ticket Workflow & Status Transition API Tests', () => {
  let staffToken: string;
  let requesterToken: string;

  beforeAll(async () => {
    // Reset ticket 1 to IN_PROGRESS for predictable workflow testing
    await prisma.ticket.update({
      where: { id: 1 },
      data: { currentStatus: 'IN_PROGRESS' },
    });

    // IT Staff
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'michael.brown@toktickit.com', password: 'Password123!' });
    staffToken = staffRes.body.token;

    // Requester (Jennifer Anderson)
    const reqRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jennifer.anderson@toktickit.com', password: 'Password123!' });
    requesterToken = reqRes.body.token;
  });

  // AC-05 & API-06: Valid transition accepted
  it('API-06: IT Staff can perform valid transition (IN_PROGRESS -> WAITING_FOR_REQUESTER)', async () => {
    const res = await request(app)
      .patch('/api/tickets/1/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'WAITING_FOR_REQUESTER' });

    expect(res.status).toBe(200);
    expect(res.body.ticket.currentStatus).toBe('WAITING_FOR_REQUESTER');
  });

  // AC-05: Valid transition (WAITING_FOR_REQUESTER -> RESOLVED)
  it('IT Staff can transition WAITING_FOR_REQUESTER -> RESOLVED', async () => {
    const res = await request(app)
      .patch('/api/tickets/1/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'RESOLVED' });

    expect(res.status).toBe(200);
    expect(res.body.ticket.currentStatus).toBe('RESOLVED');
  });

  // AC-06 & API-07: Invalid status transition rejected with 400 & InvalidStatusTransition
  it('API-07: Rejects disallowed transition RESOLVED -> IN_PROGRESS with 400', async () => {
    const res = await request(app)
      .patch('/api/tickets/1/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('InvalidStatusTransition');
  });

  // Valid Requester transition: RESOLVED -> REOPENED
  it('Requester can reopen their own RESOLVED ticket (RESOLVED -> REOPENED)', async () => {
    const res = await request(app)
      .patch('/api/tickets/1/status')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({ status: 'REOPENED' });

    expect(res.status).toBe(200);
    expect(res.body.ticket.currentStatus).toBe('REOPENED');
  });

  // Reopen ticket back to IN_PROGRESS by IT Staff
  it('IT Staff can transition REOPENED -> IN_PROGRESS', async () => {
    const res = await request(app)
      .patch('/api/tickets/1/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.ticket.currentStatus).toBe('IN_PROGRESS');
  });

  // Stale update detection on status update
  it('Returns 409 Conflict when status change sent with stale updatedAt', async () => {
    const staleDate = new Date(Date.now() - 3600000).toISOString();
    const res = await request(app)
      .patch('/api/tickets/1/status')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        status: 'RESOLVED',
        updatedAt: staleDate,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
  });
});
