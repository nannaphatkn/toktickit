import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { Role, TicketStatus } from '@prisma/client';
import { authenticateUser, requirePasswordChanged, requireRole } from '../middleware/authMiddleware';

const router = Router();

// All routes require authentication and password changed
router.use(authenticateUser, requirePasswordChanged);

// ── Status transition matrix ────────────────────────────────────────────────
type StatusTransitionMatrix = Record<TicketStatus, Partial<Record<Role, TicketStatus[]>>>;

export const STATUS_TRANSITIONS: StatusTransitionMatrix = {
  NEW: {
    IT_STAFF: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
    ADMINISTRATOR: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
    REQUESTER: [TicketStatus.CANCELLED],
  },
  OPEN: {
    IT_STAFF: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.CANCELLED],
    ADMINISTRATOR: [TicketStatus.IN_PROGRESS, TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.CANCELLED],
    REQUESTER: [TicketStatus.CANCELLED],
  },
  IN_PROGRESS: {
    IT_STAFF: [TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
    ADMINISTRATOR: [TicketStatus.WAITING_FOR_REQUESTER, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
    REQUESTER: [],
  },
  WAITING_FOR_REQUESTER: {
    IT_STAFF: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
    ADMINISTRATOR: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CANCELLED],
    REQUESTER: [TicketStatus.REOPENED, TicketStatus.CANCELLED],
  },
  RESOLVED: {
    IT_STAFF: [TicketStatus.CLOSED],
    ADMINISTRATOR: [TicketStatus.CLOSED],
    REQUESTER: [TicketStatus.REOPENED],
  },
  CLOSED: {
    IT_STAFF: [],
    ADMINISTRATOR: [],
    REQUESTER: [],
  },
  REOPENED: {
    IT_STAFF: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
    ADMINISTRATOR: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS, TicketStatus.CANCELLED],
    REQUESTER: [TicketStatus.CANCELLED],
  },
  CANCELLED: {
    IT_STAFF: [],
    ADMINISTRATOR: [],
    REQUESTER: [],
  },
};

// ── GET /api/tickets/:id/actions ─────────────────────────────────────────────
router.get('/:id/actions', async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  const currentUser = req.user!;

  if (isNaN(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID' });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  // Authorization: Requester can only access their own tickets
  if (currentUser.role === Role.REQUESTER && ticket.requesterId !== currentUser.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const actions = await prisma.actionTaken.findMany({
    where: { ticketId },
    include: {
      performedBy: { select: { id: true, fullName: true, role: true } },
    },
    orderBy: { actionDateTime: 'desc' },
  });

  return res.json({ actions });
});

// ── POST /api/tickets/:id/actions ────────────────────────────────────────────
router.post(
  '/:id/actions',
  requireRole(Role.IT_STAFF, Role.ADMINISTRATOR),
  async (req: Request, res: Response) => {
    const ticketId = parseInt(req.params.id, 10);
    const currentUser = req.user!;

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const {
      actionDateTime,
      actionDescription,
      result,
      followUpRequired = false,
      followUpNote,
      attachmentNotes,
    } = req.body;

    // Validation
    const errors: Record<string, string> = {};

    if (!actionDateTime) {
      errors.actionDateTime = 'Action Date/Time is required.';
    } else {
      const dt = new Date(actionDateTime);
      if (isNaN(dt.getTime())) {
        errors.actionDateTime = 'Action Date/Time must be a valid ISO-8601 date-time.';
      } else if (dt.getTime() > Date.now()) {
        errors.actionDateTime = 'Action Date/Time cannot be in the future.';
      }
    }

    if (!actionDescription || !actionDescription.toString().trim()) {
      errors.actionDescription = 'Action Description is required.';
    }

    if (!result || !result.toString().trim()) {
      errors.result = 'Result is required.';
    }

    const isFollowUp = Boolean(followUpRequired);
    if (isFollowUp && (!followUpNote || !followUpNote.toString().trim())) {
      errors.followUpNote = 'Follow-Up Note is required when Follow-Up Required is true.';
    }

    if (attachmentNotes !== undefined && attachmentNotes !== null && !attachmentNotes.toString().trim()) {
      errors.attachmentNotes = 'Attachment Notes cannot be blank if provided.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const action = await prisma.actionTaken.create({
      data: {
        ticketId,
        performedById: currentUser.id, // Always from JWT — ignore any client-supplied value
        actionDateTime: new Date(actionDateTime),
        actionDescription: actionDescription.trim(),
        result: result.trim(),
        followUpRequired: isFollowUp,
        followUpNote: isFollowUp && followUpNote ? followUpNote.trim() : null,
        attachmentNotes: attachmentNotes ? attachmentNotes.trim() : null,
      },
      include: {
        performedBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    return res.status(201).json({ action });
  }
);

// ── PATCH /api/tickets/:id/actions/:actionId ─────────────────────────────────
router.patch(
  '/:id/actions/:actionId',
  requireRole(Role.IT_STAFF, Role.ADMINISTRATOR),
  async (req: Request, res: Response) => {
    const ticketId = parseInt(req.params.id, 10);
    const actionId = parseInt(req.params.actionId, 10);
    const currentUser = req.user!;

    if (isNaN(ticketId) || isNaN(actionId)) {
      return res.status(400).json({ error: 'Invalid ticket or action ID' });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const existingAction = await prisma.actionTaken.findFirst({
      where: { id: actionId, ticketId },
    });
    if (!existingAction) {
      return res.status(404).json({ error: 'Action not found' });
    }

    // Authorization: original performer OR Administrator
    if (
      currentUser.role !== Role.ADMINISTRATOR &&
      existingAction.performedById !== currentUser.id
    ) {
      return res.status(403).json({ error: 'Forbidden: You can only edit your own Actions Taken.' });
    }

    // Stale-update detection
    const { updatedAt: clientUpdatedAt, ...updateFields } = req.body;
    if (clientUpdatedAt) {
      const dbUpdatedAt = new Date(existingAction.updatedAt).toISOString();
      const clientUpdatedAtStr = new Date(clientUpdatedAt).toISOString();
      if (dbUpdatedAt !== clientUpdatedAtStr) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'Record was modified by another user. Please refresh.',
        });
      }
    }

    const {
      actionDateTime,
      actionDescription,
      result,
      followUpRequired,
      followUpNote,
      attachmentNotes,
    } = updateFields;

    // Validation for supplied fields
    const errors: Record<string, string> = {};

    if (actionDateTime !== undefined) {
      const dt = new Date(actionDateTime);
      if (isNaN(dt.getTime())) {
        errors.actionDateTime = 'Action Date/Time must be a valid ISO-8601 date-time.';
      } else if (dt.getTime() > Date.now()) {
        errors.actionDateTime = 'Action Date/Time cannot be in the future.';
      }
    }

    if (actionDescription !== undefined && !actionDescription.toString().trim()) {
      errors.actionDescription = 'Action Description cannot be empty.';
    }

    if (result !== undefined && !result.toString().trim()) {
      errors.result = 'Result cannot be empty.';
    }

    const effectiveFollowUpRequired =
      followUpRequired !== undefined ? Boolean(followUpRequired) : existingAction.followUpRequired;

    if (effectiveFollowUpRequired) {
      const effectiveFollowUpNote =
        followUpNote !== undefined ? followUpNote : existingAction.followUpNote;
      if (!effectiveFollowUpNote || !effectiveFollowUpNote.toString().trim()) {
        errors.followUpNote = 'Follow-Up Note is required when Follow-Up Required is true.';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const updated = await prisma.actionTaken.update({
      where: { id: actionId },
      data: {
        ...(actionDateTime !== undefined && { actionDateTime: new Date(actionDateTime) }),
        ...(actionDescription !== undefined && { actionDescription: actionDescription.trim() }),
        ...(result !== undefined && { result: result.trim() }),
        ...(followUpRequired !== undefined && { followUpRequired: Boolean(followUpRequired) }),
        ...(followUpNote !== undefined && {
          followUpNote: effectiveFollowUpRequired && followUpNote ? followUpNote.trim() : null,
        }),
        ...(attachmentNotes !== undefined && {
          attachmentNotes: attachmentNotes ? attachmentNotes.trim() : null,
        }),
      },
      include: {
        performedBy: { select: { id: true, fullName: true, role: true } },
      },
    });

    return res.json({ action: updated });
  }
);

// ── PATCH /api/tickets/:id/status (with transition enforcement & stale detection) ──────────────
router.patch('/:id/status', async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  const currentUser = req.user!;

  if (isNaN(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID' });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  // Requester: only owner can update
  if (currentUser.role === Role.REQUESTER && ticket.requesterId !== currentUser.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { status, updatedAt: clientUpdatedAt } = req.body;

  if (!status || !Object.values(TicketStatus).includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  // Stale-update detection
  if (clientUpdatedAt) {
    const dbUpdatedAt = new Date(ticket.updatedAt).toISOString();
    const clientStr = new Date(clientUpdatedAt).toISOString();
    if (dbUpdatedAt !== clientStr) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'This ticket was recently updated. Please refresh and try again.',
      });
    }
  }

  const currentStatus = ticket.currentStatus;
  const userRole = currentUser.role;
  const allowedTransitions = STATUS_TRANSITIONS[currentStatus]?.[userRole] ?? [];

  if (!allowedTransitions.includes(status as TicketStatus)) {
    return res.status(400).json({
      error: 'InvalidStatusTransition',
      message: `Cannot transition from ${currentStatus} to ${status}.`,
    });
  }

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { currentStatus: status as TicketStatus },
  });

  return res.json({ message: 'Ticket status updated.', ticket: updated });
});

export default router;
