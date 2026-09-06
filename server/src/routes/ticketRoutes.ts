import { Router, Request, Response, NextFunction } from 'express';
import { Priority, Prisma, TicketStatus } from '@prisma/client';
import { prisma } from '../prisma';
import { sendApiError } from '../http';
import { requireActiveRequester } from '../middleware/requireActiveRequester';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const router = Router();

// Multer Config
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedFileTypes: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
};

const upload = multer({
  // Keep uploads in memory until authorization and validation have passed. Files
  // are persisted while the database transaction is open so either both the
  // ticket metadata and files succeed, or the transaction/files are rolled back.
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (allowedFileTypes[extension] === file.mimetype) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.originalname} (${file.mimetype})`));
    }
  }
});

// Middleware to catch Multer errors and return 400 JSON per api-spec.md
const handleUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.array('attachments', 5)(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendApiError(res, 400, 'File size exceeds 5 MB limit', { code: err.code });
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendApiError(res, 400, 'Maximum 5 files allowed', { code: err.code });
        }
        return sendApiError(res, 400, err.message, { code: err.code });
      }
      if (err.message && err.message.includes('Invalid file type')) {
        return sendApiError(res, 400, err.message, { code: 'INVALID_FILE_TYPE' });
      }
      return sendApiError(res, 400, err.message || 'File upload error', { code: 'UPLOAD_ERROR' });
    }
    next();
  });
};

/**
 * Generate unique Ticket Number in format TKT-YYYY-XXXXXX
 */
async function generateTicketNumber(tx: Prisma.TransactionClient, currentYear: number): Promise<string> {
  // Serialize number allocation per year. The unique database index remains the
  // final guard, while this lock prevents two valid concurrent requests from
  // reading and attempting to allocate the same next number.
  await tx.$queryRaw<Array<{ locked: string }>>`
    SELECT pg_advisory_xact_lock(${currentYear})::text AS "locked"
  `;

  const lastTicket = await tx.ticket.findFirst({
    where: {
      ticketNumber: { startsWith: `TKT-${currentYear}-` },
    },
    orderBy: {
      ticketNumber: 'desc',
    }
  });

  let nextNumber = 1;
  if (lastTicket) {
    const parts = lastTicket.ticketNumber.split('-');
    if (parts.length === 3) {
      const parsed = parseInt(parts[2], 10);
      if (!isNaN(parsed)) {
        nextNumber = parsed + 1;
      }
    }
  }

  const ticketNumberStr = nextNumber.toString().padStart(6, '0');
  if (ticketNumberStr.length !== 6) {
    throw new Error(`Ticket number sequence exhausted for ${currentYear}`);
  }
  return `TKT-${currentYear}-${ticketNumberStr}`;
}

function safeOriginalName(originalName: string): string {
  const basename = path.basename(originalName).replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 255);
  return basename || 'attachment';
}

async function removeFiles(filePaths: string[]): Promise<void> {
  await Promise.all(filePaths.map(async (filePath) => {
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error(`Failed to remove uploaded file ${filePath}:`, error);
      }
    }
  }));
}

class QueryValidationError extends Error {}

function queryString(req: Request, name: string): string | undefined {
  const value = req.query[name];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') {
    throw new QueryValidationError(`${name} must be a single value`);
  }
  return value;
}

function positiveInteger(value: string | undefined, name: string, fallback?: number): number {
  if (value === undefined && fallback !== undefined) return fallback;
  if (!value || !/^\d+$/.test(value)) {
    throw new QueryValidationError(`${name} must be a positive integer`);
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new QueryValidationError(`${name} must be a positive integer`);
  }
  return parsed;
}

const ticketSortFields = [
  'createdAt',
  'updatedAt',
  'ticketNumber',
  'summary',
  'requestedPriority',
  'currentStatus',
] as const;

// GET /api/tickets - List tickets owned by the active requester
router.get('/', requireActiveRequester, async (req: Request, res: Response): Promise<void> => {
  try {
    const requesterId = res.locals.requesterId as number;
    const page = positiveInteger(queryString(req, 'page'), 'page', 1);
    const limit = positiveInteger(queryString(req, 'limit'), 'limit', 10);
    if (limit > 50) {
      throw new QueryValidationError('limit must not exceed 50');
    }

    const search = queryString(req, 'search')?.trim();
    const categoryIdValue = queryString(req, 'categoryId');
    const priorityValue = queryString(req, 'requestedPriority');
    const statusValue = queryString(req, 'currentStatus');
    const sortByValue = queryString(req, 'sortBy') ?? 'createdAt';
    const sortDescValue = queryString(req, 'sortDesc') ?? 'true';

    if (!ticketSortFields.includes(sortByValue as typeof ticketSortFields[number])) {
      throw new QueryValidationError('Invalid sortBy value');
    }
    if (sortDescValue !== 'true' && sortDescValue !== 'false') {
      throw new QueryValidationError('sortDesc must be true or false');
    }
    if (priorityValue && !Object.values(Priority).includes(priorityValue as Priority)) {
      throw new QueryValidationError('Invalid requestedPriority value');
    }
    if (statusValue && !Object.values(TicketStatus).includes(statusValue as TicketStatus)) {
      throw new QueryValidationError('Invalid currentStatus value');
    }

    const where: Prisma.TicketWhereInput = { requesterId };
    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryIdValue !== undefined) {
      where.categoryId = positiveInteger(categoryIdValue, 'categoryId');
    }
    if (priorityValue) where.requestedPriority = priorityValue as Priority;
    if (statusValue) where.currentStatus = statusValue as TicketStatus;

    const orderBy = {
      [sortByValue]: sortDescValue === 'true' ? 'desc' : 'asc',
    } as Prisma.TicketOrderByWithRelationInput;

    const [total, tickets] = await prisma.$transaction([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          ticketNumber: true,
          summary: true,
          category: { select: { id: true, name: true } },
          requestedPriority: true,
          itPriority: true,
          currentStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    res.json({
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof QueryValidationError) {
      sendApiError(res, 400, error.message);
      return;
    }

    console.error('Error listing tickets:', error);
    sendApiError(res, 500, 'Unexpected failure');
  }
});

// POST /api/tickets - Create Ticket endpoint
router.post('/', requireActiveRequester, handleUpload, async (req: Request, res: Response): Promise<void> => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  const persistedFilePaths: string[] = [];

  try {
    const requesterId = res.locals.requesterId as number;

    const { summary, description, categoryId, relatedSystemId, requestedPriority } = req.body;

    // Field validations
    if (!summary || typeof summary !== 'string' || summary.trim().length < 10 || summary.trim().length > 150) {
      sendApiError(res, 400, 'Summary must be between 10 and 150 characters', { field: 'summary' });
      return;
    }
    if (!description || typeof description !== 'string' || description.trim().length < 20 || description.trim().length > 1000) {
      sendApiError(res, 400, 'Description must be between 20 and 1000 characters', { field: 'description' });
      return;
    }
    if (!categoryId || !relatedSystemId || !requestedPriority) {
      sendApiError(res, 400, 'Missing required fields');
      return;
    }

    if (!Object.values(Priority).includes(requestedPriority as Priority)) {
      sendApiError(res, 400, 'Invalid requestedPriority', { field: 'requestedPriority' });
      return;
    }

    // Verify category exists
    const numericCategoryId = Number(categoryId);
    if (!Number.isSafeInteger(numericCategoryId) || numericCategoryId <= 0) {
      sendApiError(res, 400, 'Invalid categoryId', { field: 'categoryId' });
      return;
    }
    const category = await prisma.category.findUnique({ where: { id: numericCategoryId } });
    if (!category) {
      sendApiError(res, 400, 'Invalid categoryId', { field: 'categoryId' });
      return;
    }

    // Verify related system exists
    const numRelatedSystemId = Number(relatedSystemId);
    if (!Number.isSafeInteger(numRelatedSystemId) || numRelatedSystemId <= 0) {
      sendApiError(res, 400, 'Invalid relatedSystemId', { field: 'relatedSystemId' });
      return;
    }
    const relatedSystem = await prisma.relatedSystem.findUnique({ where: { id: numRelatedSystemId } });
    if (!relatedSystem) {
      sendApiError(res, 400, 'Invalid relatedSystemId', { field: 'relatedSystemId' });
      return;
    }

    // Transaction for Ticket & Attachments
    const newTicket = await prisma.$transaction(async (tx) => {
      const currentYear = new Date().getUTCFullYear();
      const ticketNumber = await generateTicketNumber(tx, currentYear);

      const createdTicket = await tx.ticket.create({
        data: {
          ticketNumber,
          summary: summary.trim(),
          description: description.trim(),
          requestedPriority: requestedPriority as Priority,
          requesterId: requesterId,
          categoryId: numericCategoryId,
          relatedSystemId: numRelatedSystemId
        }
      });

      if (files.length > 0) {
        const attachmentData = [];
        for (const file of files) {
          const extension = path.extname(file.originalname).toLowerCase();
          const fileName = `${Date.now()}-${randomUUID()}${extension}`;
          const filePath = path.join(uploadDir, fileName);

          await fs.promises.writeFile(filePath, file.buffer, { flag: 'wx' });
          persistedFilePaths.push(filePath);
          attachmentData.push({
            ticketId: createdTicket.id,
            fileName,
            originalName: safeOriginalName(file.originalname),
            fileType: file.mimetype,
            fileSize: file.size,
          });
        }

        await tx.attachment.createMany({
          data: attachmentData
        });
      }

      return createdTicket;
    });

    // Return response payload according to api-spec.md
    res.status(201).json({
      id: newTicket.id,
      ticketNumber: newTicket.ticketNumber,
      summary: newTicket.summary,
      currentStatus: newTicket.currentStatus,
      createdAt: newTicket.createdAt
    });
  } catch (error: any) {
    // Rollback uploaded files if transaction or processing fails
    await removeFiles(persistedFilePaths);

    console.error('Error creating ticket:', error);
    sendApiError(res, 500, 'Unexpected failure');
  }
});

export default router;
