import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import { Priority } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import app from '../../src/index';
import { prisma } from '../../src/prisma';

let requesterAId: number;
let requesterBId: number;
let ticketId: number;
let otherTicketId: number;
let activeAttachmentId: number;
let removedAttachmentId: number;
const attachmentIds: number[] = [];
const requesterEmails = [
  `attachments-a-${Date.now()}@example.test`,
  `attachments-b-${Date.now()}@example.test`,
];
const uploadDir = path.resolve(__dirname, '../../uploads');

beforeAll(async () => {
  const [requesterA, requesterB, category, relatedSystem] = await Promise.all([
    prisma.requesterUser.create({
      data: { name: 'Attachment Requester A', email: requesterEmails[0], isActive: true },
    }),
    prisma.requesterUser.create({
      data: { name: 'Attachment Requester B', email: requesterEmails[1], isActive: true },
    }),
    prisma.category.findFirst({ orderBy: { id: 'asc' } }),
    prisma.relatedSystem.findFirst({ orderBy: { id: 'asc' } }),
  ]);

  if (!category || !relatedSystem) throw new Error('Attachment tests require seeded category and related system');

  requesterAId = requesterA.id;
  requesterBId = requesterB.id;
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: `TKT-2099-${String(Date.now()).slice(-6)}`,
      requesterId: requesterAId,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: 'Attachment lifecycle API test ticket',
      description: 'This description verifies attachment upload, download, and soft removal.',
      requestedPriority: Priority.MEDIUM,
    },
  });
  ticketId = ticket.id;

  const otherTicket = await prisma.ticket.create({
    data: {
      ticketNumber: `TKT-2099-${String(Date.now() + 1).slice(-6)}`,
      requesterId: requesterBId,
      categoryId: category.id,
      relatedSystemId: relatedSystem.id,
      summary: 'Private attachment fixture ticket',
      description: 'This ticket is owned by another requester for access-control testing.',
      requestedPriority: Priority.LOW,
    },
  });
  otherTicketId = otherTicket.id;

  const active = await request(app)
    .post(`/api/tickets/${ticketId}/attachments`)
    .set('X-Requester-Id', String(requesterAId))
    .attach('file', Buffer.from('active attachment contents'), { filename: 'active.png', contentType: 'image/png' });
  expect(active.status).toBe(201);
  activeAttachmentId = active.body.id;
  attachmentIds.push(activeAttachmentId);

  const removed = await request(app)
    .post(`/api/tickets/${ticketId}/attachments`)
    .set('X-Requester-Id', String(requesterAId))
    .attach('file', Buffer.from('removed attachment contents'), { filename: 'removed.pdf', contentType: 'application/pdf' });
  expect(removed.status).toBe(201);
  removedAttachmentId = removed.body.id;
  attachmentIds.push(removedAttachmentId);

  const removeFixture = await request(app)
    .delete(`/api/attachments/${removedAttachmentId}`)
    .set('X-Requester-Id', String(requesterAId))
    .send({ removalReason: 'Fixture is intentionally removed' });
  expect(removeFixture.status).toBe(200);
});

afterAll(async () => {
  const ticketIds = [ticketId, otherTicketId].filter(Boolean);
  const attachments = await prisma.attachment.findMany({
    where: { ticketId: { in: ticketIds } },
    select: { fileName: true },
  });
  await prisma.attachment.deleteMany({ where: { ticketId: { in: ticketIds } } });
  await prisma.ticket.deleteMany({ where: { id: { in: ticketIds } } });
  await prisma.requesterUser.deleteMany({ where: { email: { in: requesterEmails } } });
  await Promise.all(attachments.map(({ fileName }) => fs.promises.unlink(path.join(uploadDir, fileName)).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error;
  })));
});

describe('Attachment API', () => {
  it('rejects invalid type/size and rejects uploads to another requester ticket', async () => {
    const invalidType = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set('X-Requester-Id', String(requesterAId))
      .attach('file', Buffer.from('not an executable'), { filename: 'unsafe.exe', contentType: 'application/x-msdownload' });
    expect(invalidType.status).toBe(400);

    const oversized = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set('X-Requester-Id', String(requesterAId))
      .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), { filename: 'oversized.png', contentType: 'image/png' });
    expect(oversized.status).toBe(400);
    expect(oversized.body.error).toMatch(/exceeds 5 MB/i);

    const foreign = await request(app)
      .post(`/api/tickets/${otherTicketId}/attachments`)
      .set('X-Requester-Id', String(requesterAId))
      .attach('file', Buffer.from('foreign upload'), { filename: 'foreign.png', contentType: 'image/png' });
    expect(foreign.status).toBe(403);

    const valid = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set('X-Requester-Id', String(requesterAId))
      .attach('file', Buffer.from('new attachment contents'), { filename: 'new.webp', contentType: 'image/webp' });
    expect(valid.status).toBe(201);
    expect(valid.body).toMatchObject({ originalName: 'new.webp', fileType: 'image/webp', isRemoved: false });
    attachmentIds.push(valid.body.id);

    const jpeg = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set('X-Requester-Id', String(requesterAId))
      .attach('file', Buffer.from('jpeg attachment contents'), { filename: 'photo.jpeg', contentType: 'image/jpeg' });
    expect(jpeg.status).toBe(201);
    attachmentIds.push(jpeg.body.id);

    const stored = await prisma.attachment.findUnique({ where: { id: valid.body.id } });
    expect(stored?.fileName).toMatch(/^[0-9a-f-]{36}\.webp$/);
    expect(stored?.fileName).not.toBe('new.webp');
  });

  it('limits active attachments to five while allowing a removed slot to be reused', async () => {
    for (let index = 0; index < 2; index += 1) {
      const response = await request(app)
        .post(`/api/tickets/${ticketId}/attachments`)
        .set('X-Requester-Id', String(requesterAId))
        .attach('file', Buffer.from(`limit fixture ${index}`), { filename: `limit-${index}.png`, contentType: 'image/png' });
      expect(response.status).toBe(201);
      attachmentIds.push(response.body.id);
    }

    const overLimit = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set('X-Requester-Id', String(requesterAId))
      .attach('file', Buffer.from('over limit'), { filename: 'over-limit.png', contentType: 'image/png' });
    expect(overLimit.status).toBe(400);
    expect(overLimit.body.error).toMatch(/maximum 5 active attachments/i);

    const removeOne = await request(app)
      .delete(`/api/attachments/${attachmentIds[2]}`)
      .set('X-Requester-Id', String(requesterAId))
      .send({ removalReason: 'Free an active attachment slot' });
    expect(removeOne.status).toBe(200);

    const replacement = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set('X-Requester-Id', String(requesterAId))
      .attach('file', Buffer.from('replacement contents'), { filename: 'replacement.jpg', contentType: 'image/jpeg' });
    expect(replacement.status).toBe(201);
    attachmentIds.push(replacement.body.id);
  });

  it('downloads active files with original headers and rejects removed or foreign files', async () => {
    const active = await request(app)
      .get(`/api/attachments/${activeAttachmentId}/download`)
      .set('X-Requester-Id', String(requesterAId));
    expect(active.status).toBe(200);
    expect(active.headers['content-type']).toMatch(/image\/png/);
    expect(active.headers['content-disposition']).toBe('attachment; filename="active.png"');
    expect(active.body.toString()).toBe('active attachment contents');

    const removed = await request(app)
      .get(`/api/attachments/${removedAttachmentId}/download`)
      .set('X-Requester-Id', String(requesterAId));
    expect(removed.status).toBe(410);

    const foreign = await request(app)
      .get(`/api/attachments/${activeAttachmentId}/download`)
      .set('X-Requester-Id', String(requesterBId));
    expect(foreign.status).toBe(403);
  });

  it('soft-removes with a trimmed reason and rejects repeated removal', async () => {
    const foreign = await request(app)
      .delete(`/api/attachments/${activeAttachmentId}`)
      .set('X-Requester-Id', String(requesterBId))
      .send({ removalReason: 'Requester B must not remove this file' });
    expect(foreign.status).toBe(403);

    const missingReason = await request(app)
      .delete(`/api/attachments/${activeAttachmentId}`)
      .set('X-Requester-Id', String(requesterAId))
      .send({ removalReason: 'x' });
    expect(missingReason.status).toBe(400);

    const removed = await request(app)
      .delete(`/api/attachments/${activeAttachmentId}`)
      .set('X-Requester-Id', String(requesterAId))
      .send({ removalReason: '  No longer relevant to the request  ' });
    expect(removed.status).toBe(200);

    const stored = await prisma.attachment.findUnique({ where: { id: activeAttachmentId } });
    expect(stored).toMatchObject({ isRemoved: true, removalReason: 'No longer relevant to the request' });
    expect(stored?.removedAt).toBeInstanceOf(Date);

    const repeated = await request(app)
      .delete(`/api/attachments/${activeAttachmentId}`)
      .set('X-Requester-Id', String(requesterAId))
      .send({ removalReason: 'Second removal' });
    expect(repeated.status).toBe(400);
  });
});
