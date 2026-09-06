import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/prisma';
import fs from 'fs';
import path from 'path';

let requesterId: number;
let inactiveRequesterId: number;
let categoryId: number;
let relatedSystemId: number;
const createdTicketIds: number[] = [];
const uploadDir = path.join(__dirname, '../uploads');

function uploadFileNames(): string[] {
  return fs.readdirSync(uploadDir).filter((name) => name !== '.gitkeep').sort();
}

beforeAll(async () => {
  const requester = await prisma.requesterUser.findFirst({ where: { isActive: true } });
  if (requester) requesterId = requester.id;

  const inactiveRequester = await prisma.requesterUser.findFirst({ where: { isActive: false } });
  if (inactiveRequester) inactiveRequesterId = inactiveRequester.id;

  const category = await prisma.category.findFirst();
  if (category) categoryId = category.id;

  const relatedSystem = await prisma.relatedSystem.findFirst();
  if (relatedSystem) relatedSystemId = relatedSystem.id;
});

afterAll(async () => {
  if (createdTicketIds.length === 0) return;

  const attachments = await prisma.attachment.findMany({
    where: { ticketId: { in: createdTicketIds } },
    select: { fileName: true },
  });
  await prisma.attachment.deleteMany({ where: { ticketId: { in: createdTicketIds } } });
  await prisma.ticket.deleteMany({ where: { id: { in: createdTicketIds } } });
  await Promise.all(attachments.map(async ({ fileName }) => {
    await fs.promises.unlink(path.join(uploadDir, fileName)).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }));
});

describe('Ticket API Endpoints', () => {
  it('should return 401 if X-Requester-Id is missing', async () => {
    const filesBefore = uploadFileNames();
    const res = await request(app)
      .post('/api/tickets')
      .field('summary', 'This is a test summary')
      .field('description', 'This is a test description with enough characters')
      .field('categoryId', String(categoryId))
      .field('relatedSystemId', String(relatedSystemId))
      .field('requestedPriority', 'MEDIUM')
      .attach('attachments', Buffer.from('unauthorized upload'), { filename: 'unauthorized.png', contentType: 'image/png' });

    expect(res.status).toBe(401);
    expect(uploadFileNames()).toEqual(filesBefore);
  });

  it('should return 401 if requester is inactive', async () => {
    if (!inactiveRequesterId) return;
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(inactiveRequesterId))
      .field('summary', 'This is a test summary')
      .field('description', 'This is a test description with enough characters')
      .field('categoryId', String(categoryId))
      .field('relatedSystemId', String(relatedSystemId))
      .field('requestedPriority', 'MEDIUM');

    expect(res.status).toBe(401);
  });

  it('should return 400 if validation fails (summary too short)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requesterId))
      .field('summary', 'Short')
      .field('description', 'This is a test description with enough characters')
      .field('categoryId', String(categoryId))
      .field('relatedSystemId', String(relatedSystemId))
      .field('requestedPriority', 'MEDIUM');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });

  it('should return 400 if description is too short', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requesterId))
      .field('summary', 'This is a test summary')
      .field('description', 'Too short')
      .field('categoryId', String(categoryId))
      .field('relatedSystemId', String(relatedSystemId))
      .field('requestedPriority', 'MEDIUM');
    
    expect(res.status).toBe(400);
  });

  it.each([
    ['summary above maximum', 'S'.repeat(151), 'A description that is comfortably longer than twenty characters.', 'VALID', 'VALID', 'MEDIUM'],
    ['description above maximum', 'A valid ticket summary', 'D'.repeat(1001), 'VALID', 'VALID', 'MEDIUM'],
    ['invalid category', 'A valid ticket summary', 'A description that is comfortably longer than twenty characters.', '0', 'VALID', 'MEDIUM'],
    ['invalid related system', 'A valid ticket summary', 'A description that is comfortably longer than twenty characters.', 'VALID', '0', 'MEDIUM'],
    ['invalid priority', 'A valid ticket summary', 'A description that is comfortably longer than twenty characters.', 'VALID', 'VALID', 'URGENT'],
  ])('rejects %s', async (_caseName, testSummary, testDescription, testCategoryId, testRelatedSystemId, testPriority) => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requesterId))
      .field('summary', testSummary)
      .field('description', testDescription)
      .field('categoryId', testCategoryId === 'VALID' ? String(categoryId) : testCategoryId)
      .field('relatedSystemId', testRelatedSystemId === 'VALID' ? String(relatedSystemId) : testRelatedSystemId)
      .field('requestedPriority', testPriority);

    expect(res.status).toBe(400);
    expect(res.body.error).toEqual(expect.any(String));
    expect(res.body.details).toEqual(expect.any(Object));
  });

  it('should create a ticket successfully without attachments (returns exact payload)', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requesterId))
      .field('summary', 'This is a test summary for a new ticket')
      .field('description', 'This is a very long description that exceeds twenty characters.')
      .field('categoryId', String(categoryId))
      .field('relatedSystemId', String(relatedSystemId))
      .field('requestedPriority', 'LOW');
    
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('ticketNumber');
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.summary).toBe('This is a test summary for a new ticket');
    expect(res.body.currentStatus).toBe('NEW');
    expect(res.body).toHaveProperty('createdAt');
    createdTicketIds.push(res.body.id);
  });

  // T-01: Create ticket with attachments
  it('T-01: should create a ticket successfully with valid attachments', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requesterId))
      .field('summary', 'Ticket with image attachments')
      .field('description', 'This is a valid ticket description with two attached image files.')
      .field('categoryId', String(categoryId))
      .field('relatedSystemId', String(relatedSystemId))
      .field('requestedPriority', 'HIGH')
      .attach('attachments', Buffer.from('fake image content 1'), { filename: 'test1.png', contentType: 'image/png' })
      .attach('attachments', Buffer.from('fake image content 2'), { filename: 'test2.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('ticketNumber');
    createdTicketIds.push(res.body.id);

    // Verify attachments are persisted in DB
    const attachments = await prisma.attachment.findMany({
      where: { ticketId: res.body.id }
    });
    expect(attachments.length).toBe(2);
    expect(attachments[0].originalName).toBe('test1.png');
    expect(attachments[1].originalName).toBe('test2.jpg');
  });

  // T-04: Reject file > 5 MB
  it('T-04: should reject attachment larger than 5MB with 400 Bad Request', async () => {
    const largeBuffer = Buffer.alloc(5 * 1024 * 1024 + 1024); // 5MB + 1KB
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requesterId))
      .field('summary', 'Ticket with oversized attachment')
      .field('description', 'This ticket description contains enough characters to pass validation.')
      .field('categoryId', String(categoryId))
      .field('relatedSystemId', String(relatedSystemId))
      .field('requestedPriority', 'MEDIUM')
      .attach('attachments', largeBuffer, { filename: 'large.png', contentType: 'image/png' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/exceeds 5 MB/i);
    expect(res.body.details).toEqual(expect.any(Object));
  });

  // T-08: Reject invalid MIME type
  it('T-08: should reject attachment with unsupported MIME type with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requesterId))
      .field('summary', 'Ticket with executable file')
      .field('description', 'This ticket description contains enough characters to pass validation.')
      .field('categoryId', String(categoryId))
      .field('relatedSystemId', String(relatedSystemId))
      .field('requestedPriority', 'MEDIUM')
      .attach('attachments', Buffer.from('fake exe content'), { filename: 'malicious.exe', contentType: 'application/x-msdownload' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid file type/i);
    expect(res.body.details).toEqual(expect.any(Object));
  });

  it('rejects more than five attachments', async () => {
    let pendingRequest = request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requesterId))
      .field('summary', 'Ticket with too many attachments')
      .field('description', 'This ticket description contains enough characters to pass validation.')
      .field('categoryId', String(categoryId))
      .field('relatedSystemId', String(relatedSystemId))
      .field('requestedPriority', 'MEDIUM');

    for (let index = 0; index < 6; index += 1) {
      pendingRequest = pendingRequest.attach(
        'attachments',
        Buffer.from(`image ${index}`),
        { filename: `image-${index}.png`, contentType: 'image/png' }
      );
    }

    const res = await pendingRequest;
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/maximum 5 files/i);
  });

  it('rejects a MIME/extension mismatch', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requesterId))
      .field('summary', 'Ticket with a disguised attachment')
      .field('description', 'This ticket description contains enough characters to pass validation.')
      .field('categoryId', String(categoryId))
      .field('relatedSystemId', String(relatedSystemId))
      .field('requestedPriority', 'MEDIUM')
      .attach('attachments', Buffer.from('not really a PDF'), { filename: 'disguised.exe', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid file type/i);
  });

  it('allocates unique ticket numbers for concurrent valid requests', async () => {
    const createTicket = (summary: string) => request(app)
      .post('/api/tickets')
      .set('X-Requester-Id', String(requesterId))
      .field('summary', summary)
      .field('description', 'This is a sufficiently long description for a concurrent request.')
      .field('categoryId', String(categoryId))
      .field('relatedSystemId', String(relatedSystemId))
      .field('requestedPriority', 'LOW');

    const [first, second] = await Promise.all([
      createTicket('Concurrent ticket request number one'),
      createTicket('Concurrent ticket request number two'),
    ]);

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.ticketNumber).not.toBe(second.body.ticketNumber);
    createdTicketIds.push(first.body.id, second.body.id);
  });

  it('rolls back the ticket when attachment storage fails', async () => {
    const summary = `Storage rollback test ${Date.now()}`;
    const filesBefore = uploadFileNames();
    const originalWriteFile = fs.promises.writeFile.bind(fs.promises);
    const writeFile = vi.spyOn(fs.promises, 'writeFile')
      .mockImplementationOnce(originalWriteFile)
      .mockRejectedValueOnce(new Error('simulated storage failure'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    try {
      const res = await request(app)
        .post('/api/tickets')
        .set('X-Requester-Id', String(requesterId))
        .field('summary', summary)
        .field('description', 'This description verifies transaction rollback after file storage fails.')
        .field('categoryId', String(categoryId))
        .field('relatedSystemId', String(relatedSystemId))
        .field('requestedPriority', 'HIGH')
        .attach('attachments', Buffer.from('first valid image'), { filename: 'first.png', contentType: 'image/png' })
        .attach('attachments', Buffer.from('second valid image'), { filename: 'second.png', contentType: 'image/png' });

      expect(res.status).toBe(500);
      expect(await prisma.ticket.findFirst({ where: { summary } })).toBeNull();
      expect(uploadFileNames()).toEqual(filesBefore);
    } finally {
      writeFile.mockRestore();
      consoleError.mockRestore();
    }
  });

  it('should fetch related systems', async () => {
    const res = await request(app).get('/api/related-systems');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('name');
  });
});
