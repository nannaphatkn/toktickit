import { Router, Request, Response } from 'express';
import { Priority } from '@prisma/client';
import { prisma } from '../prisma';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer Config
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
  }
});

// Create Ticket endpoint
router.post('/', upload.array('attachments', 5), async (req: Request, res: Response): Promise<void> => {
  const files = req.files as Express.Multer.File[];
  
  try {
    const requesterId = req.headers['x-requester-id'] as string;
    if (!requesterId) {
      res.status(401).json({ error: 'Unauthorized', details: 'Missing X-Requester-Id header' });
      return;
    }

    const { summary, description, categoryId, relatedSystemId, requestedPriority } = req.body;

    // Validation
    if (!summary || typeof summary !== 'string' || summary.length < 10 || summary.length > 150) {
      res.status(400).json({ error: 'Bad Request', details: 'Summary must be between 10 and 150 characters' });
      return;
    }
    if (!description || typeof description !== 'string' || description.length < 20 || description.length > 1000) {
      res.status(400).json({ error: 'Bad Request', details: 'Description must be between 20 and 1000 characters' });
      return;
    }
    if (!categoryId || !relatedSystemId || !requestedPriority) {
      res.status(400).json({ error: 'Bad Request', details: 'Missing required fields' });
      return;
    }

    if (!Object.values(Priority).includes(requestedPriority as Priority)) {
      res.status(400).json({ error: 'Bad Request', details: 'Invalid requestedPriority' });
      return;
    }

    // Verify relations exist
    const requester = await prisma.requesterUser.findUnique({ where: { id: Number(requesterId) } });
    if (!requester || !requester.isActive) {
      res.status(401).json({ error: 'Unauthorized', details: 'Invalid or inactive requester' });
      return;
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      res.status(400).json({ error: 'Bad Request', details: 'Invalid categoryId' });
      return;
    }

    const relatedSystem = await prisma.relatedSystem.findUnique({ where: { id: Number(relatedSystemId) } });
    if (!relatedSystem) {
      res.status(400).json({ error: 'Bad Request', details: 'Invalid relatedSystemId' });
      return;
    }

    // Transaction for Ticket & Attachments
    const newTicket = await prisma.$transaction(async (tx) => {
      // Generate Ticket Number
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(`${currentYear}-01-01T00:00:00.000Z`);
      const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);
      
      const lastTicket = await tx.ticket.findFirst({
        where: {
          createdAt: {
            gte: startOfYear,
            lte: endOfYear
          }
        },
        orderBy: {
          id: 'desc'
        }
      });

      let nextNumber = 1;
      if (lastTicket && lastTicket.ticketNumber.startsWith(`TKT-${currentYear}-`)) {
        const parts = lastTicket.ticketNumber.split('-');
        if (parts.length === 3) {
          nextNumber = parseInt(parts[2], 10) + 1;
        }
      }

      const ticketNumberStr = nextNumber.toString().padStart(6, '0');
      const ticketNumber = `TKT-${currentYear}-${ticketNumberStr}`;

      const createdTicket = await tx.ticket.create({
        data: {
          ticketNumber,
          summary,
          description,
          requestedPriority: requestedPriority as Priority,
          requesterId: Number(requesterId),
          categoryId,
          relatedSystemId: Number(relatedSystemId)
        }
      });

      if (files && files.length > 0) {
        const attachmentData = files.map(file => ({
          ticketId: createdTicket.id,
          fileName: file.filename,
          originalName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size
        }));

        await tx.attachment.createMany({
          data: attachmentData
        });
      }

      return createdTicket;
    });

    res.status(201).json(newTicket);
  } catch (error: any) {
    // Rollback uploaded files
    if (files && files.length > 0) {
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    console.error('Error creating ticket:', error);
    if (error.message && error.message.includes('Invalid file type')) {
        res.status(400).json({ error: 'Bad Request', details: error.message });
        return;
    }
    res.status(500).json({ error: 'Internal Server Error', details: 'Unexpected failure' });
  }
});

export default router;
