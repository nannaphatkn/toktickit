import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';
import { sendApiError } from '../http';

export async function requireActiveRequester(req: Request, res: Response, next: NextFunction) {
  const requesterIdHeader = req.headers['x-requester-id'];
  if (!requesterIdHeader || Array.isArray(requesterIdHeader)) {
    sendApiError(res, 401, 'Missing X-Requester-Id header', { header: 'X-Requester-Id' });
    return;
  }

  const requesterId = Number(requesterIdHeader);
  if (!/^\d+$/.test(requesterIdHeader) || !Number.isSafeInteger(requesterId) || requesterId <= 0) {
    sendApiError(res, 401, 'Invalid X-Requester-Id header', { header: 'X-Requester-Id' });
    return;
  }

  try {
    const requester = await prisma.requesterUser.findUnique({
      where: { id: requesterId },
      select: { isActive: true },
    });
    if (!requester?.isActive) {
      sendApiError(res, 401, 'Invalid or inactive requester', { requesterId });
      return;
    }

    res.locals.requesterId = requesterId;
    next();
  } catch (error) {
    next(error);
  }
}
