import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let requesterId: number;
let categoryId: string;
let relatedSystemId: number;

beforeAll(async () => {
  // Ensure we have reference data for tests
  const requester = await prisma.requesterUser.findFirst({ where: { isActive: true } });
  if (requester) requesterId = requester.id;

  const category = await prisma.category.findFirst();
  if (category) categoryId = category.id;

  const relatedSystem = await prisma.relatedSystem.findFirst();
  if (relatedSystem) relatedSystemId = relatedSystem.id;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('Ticket API Endpoints', () => {
  it('should return 401 if X-Requester-Id is missing', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .send({
        summary: 'This is a test summary',
        description: 'This is a test description with enough characters',
        categoryId,
        relatedSystemId,
        requestedPriority: 'MEDIUM'
      });
    
    expect(res.status).toBe(401);
  });

  it('should return 400 if validation fails (missing fields)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', requesterId.toString())
      .send({
        summary: 'Test', // Too short
      });
    
    expect(res.status).toBe(400);
  });

  it('should create a ticket successfully without attachments', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', requesterId.toString())
      .send({
        summary: 'This is a test summary for a new ticket',
        description: 'This is a very long description that exceeds twenty characters.',
        categoryId,
        relatedSystemId,
        requestedPriority: 'LOW'
      });
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('ticketNumber');
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.summary).toBe('This is a test summary for a new ticket');
    expect(res.body.currentStatus).toBe('NEW');
  });

  it('should fetch related systems', async () => {
    const res = await request(app)
      .get('/api/related-systems');
    
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('name');
  });
});
