import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Priority, TicketStatus } from '@prisma/client';
import app from '../../src/index';
import { prisma } from '../../src/prisma';

let requesterAId: number;
let requesterBId: number;
let categoryAId: number;
let categoryBId: number;
let relatedSystemId: number;
let ticketNumbers: string[] = [];
const requesterEmails = [
  `my-tickets-a-${Date.now()}@example.test`,
  `my-tickets-b-${Date.now()}@example.test`,
];

beforeAll(async () => {
  const [requesterA, requesterB, categories, relatedSystem] = await Promise.all([
    prisma.requesterUser.create({
      data: { name: 'My Tickets Test Requester A', email: requesterEmails[0], isActive: true },
    }),
    prisma.requesterUser.create({
      data: { name: 'My Tickets Test Requester B', email: requesterEmails[1], isActive: true },
    }),
    prisma.category.findMany({ orderBy: { id: 'asc' }, take: 2 }),
    prisma.relatedSystem.findFirst({ orderBy: { id: 'asc' } }),
  ]);

  if (categories.length < 2 || !relatedSystem) {
    throw new Error('My Tickets API tests require two categories and one related system');
  }

  requesterAId = requesterA.id;
  requesterBId = requesterB.id;
  categoryAId = categories[0].id;
  categoryBId = categories[1].id;
  relatedSystemId = relatedSystem.id;

  const sequenceStart = 100000 + (Date.now() % 800000);
  ticketNumbers = Array.from({ length: 5 }, (_, index) => `TKT-2097-${String(sequenceStart + index).padStart(6, '0')}`);

  await prisma.ticket.createMany({
    data: [
      {
        ticketNumber: ticketNumbers[0],
        requesterId: requesterAId,
        categoryId: categoryAId,
        relatedSystemId,
        summary: 'Wireless network disconnects frequently',
        description: 'The wireless network disconnects several times every working day.',
        requestedPriority: Priority.LOW,
        currentStatus: TicketStatus.NEW,
        createdAt: new Date('2026-01-01T08:00:00.000Z'),
      },
      {
        ticketNumber: ticketNumbers[1],
        requesterId: requesterAId,
        categoryId: categoryBId,
        relatedSystemId,
        summary: 'VPN access is unavailable',
        description: 'The corporate VPN cannot establish a connection from home.',
        requestedPriority: Priority.HIGH,
        currentStatus: TicketStatus.IN_PROGRESS,
        createdAt: new Date('2026-01-02T08:00:00.000Z'),
      },
      {
        ticketNumber: ticketNumbers[2],
        requesterId: requesterAId,
        categoryId: categoryAId,
        relatedSystemId,
        summary: 'Office printer queue is stuck',
        description: 'Documents stay in the office printer queue and never complete.',
        requestedPriority: Priority.MEDIUM,
        currentStatus: TicketStatus.RESOLVED,
        createdAt: new Date('2026-01-03T08:00:00.000Z'),
      },
      {
        ticketNumber: ticketNumbers[3],
        requesterId: requesterAId,
        categoryId: categoryBId,
        relatedSystemId,
        summary: 'Account password reset request',
        description: 'The requester needs a password reset for their primary account.',
        requestedPriority: Priority.LOW,
        currentStatus: TicketStatus.CLOSED,
        createdAt: new Date('2026-01-04T08:00:00.000Z'),
      },
      {
        ticketNumber: ticketNumbers[4],
        requesterId: requesterBId,
        categoryId: categoryAId,
        relatedSystemId,
        summary: 'Requester B confidential ticket',
        description: 'This ticket must never appear in requester A list responses.',
        requestedPriority: Priority.HIGH,
        currentStatus: TicketStatus.NEW,
        createdAt: new Date('2026-01-05T08:00:00.000Z'),
      },
    ],
  });
});

afterAll(async () => {
  if (ticketNumbers.length > 0) {
    await prisma.ticket.deleteMany({ where: { ticketNumber: { in: ticketNumbers } } });
  }
  await prisma.requesterUser.deleteMany({ where: { email: { in: requesterEmails } } });
});

describe('GET /api/tickets — My Tickets', () => {
  it('returns requester-owned tickets with default pagination and newest-first sorting', async () => {
    const response = await request(app)
      .get('/api/tickets')
      .set('X-Requester-Id', String(requesterAId));

    expect(response.status).toBe(200);
    expect(response.body.meta).toEqual({ total: 4, page: 1, limit: 10, totalPages: 1 });
    expect(response.body.data).toHaveLength(4);
    expect(response.body.data.map((ticket: { ticketNumber: string }) => ticket.ticketNumber)).toEqual([
      ticketNumbers[3],
      ticketNumbers[2],
      ticketNumbers[1],
      ticketNumbers[0],
    ]);
    expect(response.body.data[0].category).toEqual(expect.objectContaining({ id: categoryBId }));
  });

  it('supports custom page and limit values', async () => {
    const response = await request(app)
      .get('/api/tickets?page=2&limit=2')
      .set('X-Requester-Id', String(requesterAId));

    expect(response.status).toBe(200);
    expect(response.body.meta).toEqual({ total: 4, page: 2, limit: 2, totalPages: 2 });
    expect(response.body.data.map((ticket: { ticketNumber: string }) => ticket.ticketNumber)).toEqual([
      ticketNumbers[1],
      ticketNumbers[0],
    ]);
  });

  it.each([
    ['summary', () => 'vpn ACCESS', 1],
    ['ticket number', () => ticketNumbers[2].toLowerCase(), 2],
  ])('searches case-insensitively by %s', async (_label, search, expectedIndex) => {
    const response = await request(app)
      .get('/api/tickets')
      .query({ search: search() })
      .set('X-Requester-Id', String(requesterAId));

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].ticketNumber).toBe(ticketNumbers[expectedIndex]);
  });

  it.each([
    ['categoryId', () => String(categoryAId), () => [ticketNumbers[2], ticketNumbers[0]]],
    ['requestedPriority', () => 'HIGH', () => [ticketNumbers[1]]],
    ['currentStatus', () => 'RESOLVED', () => [ticketNumbers[2]]],
  ])('filters by %s', async (filterName, value, expectedNumbers) => {
    const response = await request(app)
      .get('/api/tickets')
      .query({ [filterName]: value() })
      .set('X-Requester-Id', String(requesterAId));

    expect(response.status).toBe(200);
    expect(response.body.data.map((ticket: { ticketNumber: string }) => ticket.ticketNumber)).toEqual(expectedNumbers());
  });

  it('supports ascending and descending sort direction', async () => {
    const [ascending, descending] = await Promise.all([
      request(app).get('/api/tickets?sortBy=createdAt&sortDesc=false').set('X-Requester-Id', String(requesterAId)),
      request(app).get('/api/tickets?sortBy=createdAt&sortDesc=true').set('X-Requester-Id', String(requesterAId)),
    ]);

    expect(ascending.status).toBe(200);
    expect(descending.status).toBe(200);
    expect(ascending.body.data[0].ticketNumber).toBe(ticketNumbers[0]);
    expect(descending.body.data[0].ticketNumber).toBe(ticketNumbers[3]);
  });

  it('never returns another requester’s tickets', async () => {
    const response = await request(app)
      .get('/api/tickets?limit=50')
      .set('X-Requester-Id', String(requesterAId));

    const returnedNumbers = response.body.data.map((ticket: { ticketNumber: string }) => ticket.ticketNumber);
    expect(returnedNumbers).not.toContain(ticketNumbers[4]);
    expect(returnedNumbers).toEqual(expect.arrayContaining(ticketNumbers.slice(0, 4)));
  });

  it('returns 401 when the requester header is missing', async () => {
    const response = await request(app).get('/api/tickets');
    expect(response.status).toBe(401);
  });

  it('returns 401 when the requester header is invalid', async () => {
    const response = await request(app)
      .get('/api/tickets')
      .set('X-Requester-Id', 'not-a-number');
    expect(response.status).toBe(401);
  });

  it.each([
    ['page=0'],
    ['limit=51'],
    ['requestedPriority=URGENT'],
    ['currentStatus=UNKNOWN'],
    ['sortBy=requesterId'],
    ['sortDesc=maybe'],
  ])('returns 400 for invalid query: %s', async (query) => {
    const response = await request(app)
      .get(`/api/tickets?${query}`)
      .set('X-Requester-Id', String(requesterAId));

    expect(response.status).toBe(400);
    expect(response.body.details).toEqual(expect.any(Object));
  });
});
