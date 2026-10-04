import { Router, Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../prisma';
import { authenticateUser, requirePasswordChanged } from '../middleware/authMiddleware';

const router = Router();

// Remove top-level router.use to allow other /api/tickets routes to pass through

/**
 * Helper to check ticket access for current user
 */
async function canAccessTicket(ticketId: number, userId: number, userRole: Role) {
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return null;

  if (userRole === Role.ADMINISTRATOR || userRole === Role.IT_STAFF) {
    return ticket;
  }

  if (userRole === Role.REQUESTER && ticket.requesterId === userId) {
    return ticket;
  }

  return null;
}

// ----------------------------------------------------------------------
// Public Comments API
// ----------------------------------------------------------------------

/**
 * GET /api/tickets/:id/comments
 */
router.get('/:id/comments', authenticateUser, requirePasswordChanged, async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID.' });
  }

  try {
    const ticket = await canAccessTicket(ticketId, req.user!.id, req.user!.role);
    if (!ticket) {
      return res.status(403).json({ error: 'Forbidden. Access to this ticket is denied.' });
    }

    const comments = await prisma.publicComment.findMany({
      where: { ticketId },
      include: {
        author: { select: { id: true, fullName: true, role: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Failed to fetch public comments.' });
  }
});

/**
 * POST /api/tickets/:id/comments
 */
router.post('/:id/comments', authenticateUser, requirePasswordChanged, async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID.' });
  }

  const { content } = req.body;
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Comment content cannot be empty.' });
  }

  try {
    const ticket = await canAccessTicket(ticketId, req.user!.id, req.user!.role);
    if (!ticket) {
      return res.status(403).json({ error: 'Forbidden. Access to this ticket is denied.' });
    }

    const comment = await prisma.publicComment.create({
      data: {
        ticketId,
        authorId: req.user!.id,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, fullName: true, role: true, email: true } },
      },
    });

    return res.status(201).json({ message: 'Comment posted successfully.', comment });
  } catch (error) {
    console.error('Error posting comment:', error);
    return res.status(500).json({ error: 'Failed to post public comment.' });
  }
});

// ----------------------------------------------------------------------
// Internal Notes API (Role-restricted: IT_STAFF and ADMINISTRATOR only)
// ----------------------------------------------------------------------

/**
 * GET /api/tickets/:id/notes
 */
router.get('/:id/notes', authenticateUser, requirePasswordChanged, async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID.' });
  }

  // Reject Requesters immediately with 403 Forbidden without exposing note existence
  if (req.user!.role !== Role.IT_STAFF && req.user!.role !== Role.ADMINISTRATOR) {
    return res.status(403).json({ error: 'Forbidden. Internal notes are visible only to IT Staff and Administrators.' });
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const notes = await prisma.internalNote.findMany({
      where: { ticketId },
      include: {
        author: { select: { id: true, fullName: true, role: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ notes });
  } catch (error) {
    console.error('Error fetching internal notes:', error);
    return res.status(500).json({ error: 'Failed to fetch internal notes.' });
  }
});

/**
 * POST /api/tickets/:id/notes
 */
router.post('/:id/notes', authenticateUser, requirePasswordChanged, async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID.' });
  }

  // Reject Requesters immediately with 403 Forbidden
  if (req.user!.role !== Role.IT_STAFF && req.user!.role !== Role.ADMINISTRATOR) {
    return res.status(403).json({ error: 'Forbidden. Internal notes can only be posted by IT Staff and Administrators.' });
  }

  const { content } = req.body;
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Internal note content cannot be empty.' });
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const note = await prisma.internalNote.create({
      data: {
        ticketId,
        authorId: req.user!.id,
        content: content.trim(),
      },
      include: {
        author: { select: { id: true, fullName: true, role: true, email: true } },
      },
    });

    return res.status(201).json({ message: 'Internal note saved.', note });
  } catch (error) {
    console.error('Error posting internal note:', error);
    return res.status(500).json({ error: 'Failed to save internal note.' });
  }
});

export default router;
