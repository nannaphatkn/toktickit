import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Priority, TicketStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import app from '../../src/index';
import { prisma } from '../../src/prisma';

let requesterAId: number;
let requesterBId: number;
let categoryId: number;
let relatedSystemId: number;
let ticketId: number;
let otherTicketId: number;
let activeAttachmentId: number;
let removedAttachmentId: number;
const requesterEmails = [
  `ticket-detail-a-${Date.now()}@example.test`,
  `ticket-detail-b-${Date.now()}@example.test`,
];
const uploadDir = path.resolve(__dirname, '../../uploads');

beforeAll(async () => {
  const [requesterA, requesterB, category, relatedSystem] = await Promise.all([
    prisma.requesterUser.create({
      data: { name: 'Ticket Detail Requester A', email: requesterEmails[0], isActive: true },
    }),
    prisma.requesterUser.create({
      data: { name: 'Ticket Detail Requester B', email: requesterEmails[1], isActive: true },
    }),
    prisma.category.findFirst({ orderBy: { id: 'asc' } }),
    prisma.relatedSystem.findFirst({ orderBy: { id: 'asc' } }),
  ]);

  if (!category || !relatedSystem) throw new Error('Ticket detail tests require seeded category and related system');

  requesterAId = requesterA.id;
  requesterBId = requesterB.id;
  categoryId = category.id;
  relatedSystemId = relatedSystem.id;

  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: `TKT-2098-${String(Date.now()).slice(-6)}`,
      requesterId: requesterAId,
      categoryId,
      relatedSystemId,
      summary: 'Ticket detail attachment lifecycle test',
      description: 'This description verifies the complete ticket detail and attachment lifecycle.',
      requestedPriority: Priority.HIGH,
      currentStatus: TicketStatus.IN_PROGRESS,
    },
  });
  ticketId = ticket.id;

  const otherTicket = await prisma.ticket.create({
    data: {
      ticketNumber: `TKT-2098-${String(Date.now() + 1).slice(-6)}`,
      requesterId: requesterBId,
      categoryId,
      relatedSystemId,
      summary: 'Private ticket detail fixture',
      description: 'This ticket is owned by another requester and must not be disclosed.',
      requestedPriority: Priority.LOW,
    },
  });
  otherTicketId = otherTicket.id;

  const activeResponse = await request(app)
    .post(`/api/tickets/${ticketId}/attachments`)
    .set('X-Requester-Id', String(requesterAId))
    .attach('file', Buffer.from('active attachment contents'), { filename: 'active.png', contentType: 'image/png' });
  expect(activeResponse.status).toBe(201);
  activeAttachmentId = activeResponse.body.id;

  const removedResponse = await request(app)
    .post(`/api/tickets/${ticketId}/attachments`)
    .set('X-Requester-Id', String(requesterAId))
    .attach('file', Buffer.from('removed attachment contents'), { filename: 'removed.pdf', contentType: 'application/pdf' });
  expect(removedResponse.status).toBe(201);
  removedAttachmentId = removedResponse.body.id;

  const removeResponse = await request(app)
    .delete(`/api/attachments/${removedAttachmentId}`)
    .set('X-Requester-Id', String(requesterAId))
    .send({ removalReason: 'Fixture is intentionally removed' });
  expect(removeResponse.status).toBe(200);
});

afterAll(async () => {
  const attachments = await prisma.attachment.findMany({
    where: { ticketId: { in: [ticketId, otherTicketId].filter(Boolean) } },
    select: { fileName: true },
  });
  await prisma.attachment.deleteMany({ where: { ticketId: { in: [ticketId, otherTicketId].filter(Boolean) } } });
  await prisma.ticket.deleteMany({ where: { id: { in: [ticketId, otherTicketId].filter(Boolean) } } });
  await prisma.requesterUser.deleteMany({ where: { email: { in: requesterEmails } } });
  await Promise.all(attachments.map(({ fileName }) => fs.promises.unlink(path.join(uploadDir, fileName)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  })));
});

describe('Ticket detail and attachment lifecycle API', () => {
  it('returns complete read-only ticket metadata and attachment history to the owner', async () => {
    const response = await request(app)
      .get(`/api/tickets/${ticketId}`)
      .set('X-Requester-Id', String(requesterAId));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: ticketId,
      summary: 'Ticket detail attachment lifecycle test',
      requestedPriority: 'HIGH',
      currentStatus: 'IN_PROGRESS',
      category: { id: categoryId },
      relatedSystem: { id: relatedSystemId },
      requester: { id: requesterAId },
    });
    expect(response.body.attachments).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: activeAttachmentId, originalName: 'active.png', isRemoved: false, removalReason: null }),
      expect.objectContaining({ id: removedAttachmentId, originalName: 'removed.pdf', isRemoved: true, removalReason: 'Fixture is intentionally removed' }),
    ]));
    expect(response.body.attachments[0]).not.toHaveProperty('fileName');
  });

  it('enforces ticket ownership and requester authentication', async () => {
    const [crossOwner, missingHeader, missingTicket] = await Promise.all([
      request(app).get(`/api/tickets/${otherTicketId}`).set('X-Requester-Id', String(requesterAId)),
      request(app).get(`/api/tickets/${ticketId}`),
      request(app).get('/api/tickets/999999999').set('X-Requester-Id', String(requesterAId)),
    ]);

    expect(crossOwner.status).toBe(403);
    expect(missingHeader.status).toBe(401);
    expect(missingTicket.status).toBe(404);
  });

});
