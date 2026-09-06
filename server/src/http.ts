import { Response } from 'express';

export function sendApiError(
  res: Response,
  status: number,
  message: string,
  details: Record<string, unknown> = {},
) {
  return res.status(status).json({ error: message, details });
}
