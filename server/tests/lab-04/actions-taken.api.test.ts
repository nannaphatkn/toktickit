import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Lab 04 Actions Taken API Tests', () => {
  let staffToken: string;
  let otherStaffToken: string;
  let adminToken: string;
  let requesterToken: string;
  let otherRequesterToken: string;
  let createdActionId: number;
  let actionUpdatedAt: string;

  beforeAll(async () => {
    // IT Staff 1 (Michael Brown)
    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'michael.brown@toktickit.com', password: 'Password123!' });
    staffToken = staffRes.body.token;

    // IT Staff 2 (Lisa Martinez)
    const otherStaffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'lisa.martinez@toktickit.com', password: 'Password123!' });
    otherStaffToken = otherStaffRes.body.token;

    // Administrator (John Smith)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john.smith@toktickit.com', password: 'Password123!' });
    adminToken = adminRes.body.token;

    // Requester 1 (Jennifer Anderson - owner of ticket 1)
    const reqRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jennifer.anderson@toktickit.com', password: 'Password123!' });
    requesterToken = reqRes.body.token;

    // Requester 2 (David Lee - owner of ticket 3, not ticket 1)
    const otherReqRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'david.lee@toktickit.com', password: 'Password123!' });
    otherRequesterToken = otherReqRes.body.token;
  });

  // AC-01 & API-01: Valid Action Taken create by IT Staff
  it('API-01: IT Staff can record Action Taken on ticket', async () => {
    const actionDate = new Date(Date.now() - 60000).toISOString();
    const res = await request(app)
      .post('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: actionDate,
        actionDescription: 'Cleaned laptop cooling vents and reapplied thermal paste.',
        result: 'Temperature dropped by 18 degrees Celsius.',
        followUpRequired: true,
        followUpNote: 'Check temperatures again in 2 business days.',
        attachmentNotes: 'Thermal camera logs attached.',
      });

    expect(res.status).toBe(201);
    expect(res.body.action).toBeDefined();
    expect(res.body.action.actionDescription).toBe('Cleaned laptop cooling vents and reapplied thermal paste.');
    expect(res.body.action.followUpRequired).toBe(true);
    expect(res.body.action.followUpNote).toBe('Check temperatures again in 2 business days.');
    expect(res.body.action.performedBy.fullName).toBe('Michael Brown');

    createdActionId = res.body.action.id;
    actionUpdatedAt = res.body.action.updatedAt;
  });

  // AC-01 & API-02: performedById cannot be overridden by client
  it('API-02: Server ignores client-supplied performedById and uses JWT identity', async () => {
    const actionDate = new Date(Date.now() - 120000).toISOString();
    const res = await request(app)
      .post('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: actionDate,
        actionDescription: 'Replaced CMOS battery on motherboard.',
        result: 'BIOS clock now persists through reboot.',
        performedById: 9999, // Attempted spoof
        followUpRequired: false,
      });

    expect(res.status).toBe(201);
    expect(res.body.action.performedBy.fullName).toBe('Michael Brown');
  });

  // AC-04 & API-05: Requester blocked from creating Actions Taken
  it('API-05: Requester is forbidden from creating Actions Taken (403)', async () => {
    const res = await request(app)
      .post('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        actionDescription: 'Attempted requester action',
        result: 'Should fail',
        followUpRequired: false,
      });

    expect(res.status).toBe(403);
  });

  // AC-07 & API-08: Validation - followUpNote required when followUpRequired=true
  it('API-08: Rejects action if followUpRequired=true but followUpNote is omitted (400)', async () => {
    const res = await request(app)
      .post('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: new Date().toISOString(),
        actionDescription: 'Replaced power adapter.',
        result: 'Laptop charges now.',
        followUpRequired: true,
        // followUpNote is missing
      });

    expect(res.status).toBe(400);
    expect(res.body.details?.followUpNote).toBeDefined();
  });

  // Validation: Future actionDateTime rejected
  it('Rejects action with future actionDateTime (400)', async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const res = await request(app)
      .post('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDateTime: futureDate,
        actionDescription: 'Future action test',
        result: 'Should fail',
        followUpRequired: false,
      });

    expect(res.status).toBe(400);
    expect(res.body.details?.actionDateTime).toBeDefined();
  });

  // GET actions for ticket: IT Staff can view
  it('IT Staff can retrieve Actions Taken for ticket', async () => {
    const res = await request(app)
      .get('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.actions)).toBe(true);
    expect(res.body.actions.length).toBeGreaterThan(0);
  });

  // GET actions: Requester can view on OWN ticket
  it('Requester can view Actions Taken on their own ticket', async () => {
    const res = await request(app)
      .get('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.actions)).toBe(true);
  });

  // GET actions: Requester CANNOT view on other requester ticket
  it('Requester is forbidden from viewing Actions Taken on ticket they do not own (403)', async () => {
    const res = await request(app)
      .get('/api/tickets/1/actions')
      .set('Authorization', `Bearer ${otherRequesterToken}`);

    expect(res.status).toBe(403);
  });

  // PATCH action: Original performer can update
  it('Original performer can update their own Action Taken', async () => {
    const res = await request(app)
      .patch(`/api/tickets/1/actions/${createdActionId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDescription: 'Updated: Cleaned vents, replaced paste, verified fan curve.',
        result: 'Temperature dropped by 20 degrees Celsius under load.',
        updatedAt: actionUpdatedAt,
      });

    expect(res.status).toBe(200);
    expect(res.body.action.actionDescription).toContain('verified fan curve');
    actionUpdatedAt = res.body.action.updatedAt;
  });

  // PATCH action: Non-author IT Staff CANNOT update (403)
  it('Non-author IT Staff is forbidden from editing another performer action (403)', async () => {
    const res = await request(app)
      .patch(`/api/tickets/1/actions/${createdActionId}`)
      .set('Authorization', `Bearer ${otherStaffToken}`)
      .send({
        actionDescription: 'Attempted unauthorized edit by Lisa',
      });

    expect(res.status).toBe(403);
  });

  // PATCH action: Administrator CAN update any performer action
  it('Administrator can update any performer Action Taken', async () => {
    const res = await request(app)
      .patch(`/api/tickets/1/actions/${createdActionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        actionDescription: 'Admin-reviewed: Cleaned vents and thermal paste.',
      });

    expect(res.status).toBe(200);
    expect(res.body.action.actionDescription).toContain('Admin-reviewed');
  });

  // AC-08 & API-09: Stale update detection returns 409 Conflict
  it('API-09: Returns 409 Conflict when updating with outdated updatedAt', async () => {
    const staleDate = new Date(Date.now() - 3600000).toISOString();
    const res = await request(app)
      .patch(`/api/tickets/1/actions/${createdActionId}`)
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        actionDescription: 'Stale update attempt',
        updatedAt: staleDate,
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Conflict');
  });
});
