import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { sendApiError } from '../http';
import { requireActiveRequester } from '../middleware/requireActiveRequester';
import fs from 'fs';
import path from 'path';

const router = Router();
const uploadDir = path.resolve(__dirname, '../../uploads');

class AttachmentIdError extends Error {}

function parseAttachmentId(value: string | undefined): number {
  if (!value || !/^\d+$/.test(value)) {
    throw new AttachmentIdError('Attachment id must be a positive integer');
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new AttachmentIdError('Attachment id must be a positive integer');
  }
  return id;
}

function attachmentFilePath(fileName: string): string | null {
  const resolvedPath = path.resolve(uploadDir, fileName);
  if (!resolvedPath.startsWith(`${uploadDir}${path.sep}`)) return null;
  return resolvedPath;
}

function contentDispositionName(originalName: string): string {
  return originalName.replace(/[\"\r\n]/g, '_');
}

async function findAttachmentForRequester(attachmentId: number, requesterId: number) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    select: {
      id: true,
      ticketId: true,
      fileName: true,
      originalName: true,
      fileType: true,
      fileSize: true,
      isRemoved: true,
      removalReason: true,
      removedAt: true,
      createdAt: true,
      ticket: { select: { requesterId: true } },
    },
  });

  if (!attachment) return { kind: 'missing' as const };
  if (attachment.ticket.requesterId !== requesterId) return { kind: 'forbidden' as const };
  return { kind: 'owned' as const, attachment };
}

// GET /api/attachments/:id/download - Download an active owned attachment
router.get('/:id/download', requireActiveRequester, async (req: Request, res: Response): Promise<void> => {
  let attachmentId: number;
  try {
    attachmentId = parseAttachmentId(req.params.id);
  } catch (error) {
    if (error instanceof AttachmentIdError) {
      sendApiError(res, 400, 'Invalid attachment id', { field: 'id' });
      return;
    }
    throw error;
  }

  try {
    const result = await findAttachmentForRequester(attachmentId, res.locals.requesterId as number);
    if (result.kind === 'missing') {
      sendApiError(res, 404, 'Attachment not found');
      return;
    }
    if (result.kind === 'forbidden') {
      sendApiError(res, 403, 'You do not have access to this attachment');
      return;
    }
    if (result.attachment.isRemoved) {
      sendApiError(res, 410, 'Attachment is no longer available for download');
      return;
    }

    const filePath = attachmentFilePath(result.attachment.fileName);
    if (!filePath) {
      sendApiError(res, 404, 'Attachment file not found');
      return;
    }

    try {
      await fs.promises.stat(filePath);
    } catch {
      sendApiError(res, 404, 'Attachment file not found');
      return;
    }

    res.setHeader('Content-Type', result.attachment.fileType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${contentDispositionName(result.attachment.originalName)}"`,
    );
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (streamError) => {
      console.error('Error streaming attachment:', streamError);
      if (!res.headersSent) sendApiError(res, 500, 'Unexpected failure');
      else res.destroy(streamError);
    });
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    if (!res.headersSent) sendApiError(res, 500, 'Unexpected failure');
  }
});

// DELETE /api/attachments/:id - Soft-remove an owned attachment
router.delete('/:id', requireActiveRequester, async (req: Request, res: Response): Promise<void> => {
  let attachmentId: number;
  try {
    attachmentId = parseAttachmentId(req.params.id);
  } catch (error) {
    if (error instanceof AttachmentIdError) {
      sendApiError(res, 400, 'Invalid attachment id', { field: 'id' });
      return;
    }
    throw error;
  }

  try {
    const result = await findAttachmentForRequester(attachmentId, res.locals.requesterId as number);
    if (result.kind === 'missing') {
      sendApiError(res, 404, 'Attachment not found');
      return;
    }
    if (result.kind === 'forbidden') {
      sendApiError(res, 403, 'You do not have access to this attachment');
      return;
    }
    if (result.attachment.isRemoved) {
      sendApiError(res, 400, 'Attachment has already been removed');
      return;
    }

    const removalReason = req.body?.removalReason;
    if (
      typeof removalReason !== 'string' ||
      removalReason.trim().length < 3 ||
      removalReason.trim().length > 500
    ) {
      sendApiError(res, 400, 'Removal reason must be between 3 and 500 characters', {
        field: 'removalReason',
      });
      return;
    }

    const updateResult = await prisma.attachment.updateMany({
      where: { id: attachmentId, isRemoved: false },
      data: {
        isRemoved: true,
        removedAt: new Date(),
        removalReason: removalReason.trim(),
      },
    });

    if (updateResult.count === 0) {
      sendApiError(res, 400, 'Attachment has already been removed');
      return;
    }

    res.json({ success: true, message: 'Attachment removed successfully' });
  } catch (error) {
    console.error('Error removing attachment:', error);
    sendApiError(res, 500, 'Unexpected failure');
  }
});

export default router;
