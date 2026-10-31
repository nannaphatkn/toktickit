import { Router, Request, Response } from 'express';
import { prisma } from '../prisma';
import { Priority, Role, TicketStatus } from '@prisma/client';
import { authenticateUser, requirePasswordChanged } from '../middleware/authMiddleware';

const router = Router();

// Protect all dashboard routes
router.use(authenticateUser);
router.use(requirePasswordChanged);

/**
 * GET /api/dashboard/requester
 * Requester dashboard metrics scoped strictly to authenticated Requester's tickets.
 */
router.get('/requester', async (req: Request, res: Response) => {
  const currentUser = req.user!;

  if (currentUser.role !== Role.REQUESTER) {
    return res.status(403).json({ error: 'Forbidden. Requester role required.' });
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [openTickets, waitingForRequester, recentlyUpdated, recentlyResolved, recentTickets] =
      await Promise.all([
        // openTickets: not RESOLVED, CLOSED, or CANCELLED
        prisma.ticket.count({
          where: {
            requesterId: currentUser.id,
            currentStatus: {
              notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED],
            },
          },
        }),
        // waitingForRequester
        prisma.ticket.count({
          where: {
            requesterId: currentUser.id,
            currentStatus: TicketStatus.WAITING_FOR_REQUESTER,
          },
        }),
        // recentlyUpdated (in last 7 days)
        prisma.ticket.count({
          where: {
            requesterId: currentUser.id,
            updatedAt: { gte: sevenDaysAgo },
          },
        }),
        // recentlyResolved (in last 7 days)
        prisma.ticket.count({
          where: {
            requesterId: currentUser.id,
            currentStatus: TicketStatus.RESOLVED,
            updatedAt: { gte: sevenDaysAgo },
          },
        }),
        // recentTickets (last 5 updated within 7 days)
        prisma.ticket.findMany({
          where: {
            requesterId: currentUser.id,
            updatedAt: { gte: sevenDaysAgo },
          },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            itPriority: true,
            requestedPriority: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
      ]);

    return res.json({
      openTickets,
      waitingForRequester,
      recentlyUpdated,
      recentlyResolved,
      recentTickets,
    });
  } catch (error) {
    console.error('Error fetching requester dashboard metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch requester dashboard metrics.' });
  }
});

/**
 * GET /api/dashboard/staff
 * IT Staff & Administrator dashboard metrics across all tickets.
 */
router.get('/staff', async (req: Request, res: Response) => {
  const currentUser = req.user!;

  if (currentUser.role !== Role.IT_STAFF && currentUser.role !== Role.ADMINISTRATOR) {
    return res.status(403).json({ error: 'Forbidden. IT Staff or Administrator role required.' });
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [unassigned, myTickets, statusGroups, priorityGroups, recentTickets] =
      await Promise.all([
        // unassigned: no owner, not terminal (RESOLVED, CLOSED, CANCELLED)
        prisma.ticket.count({
          where: {
            ownerId: null,
            currentStatus: {
              notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED],
            },
          },
        }),
        // myTickets: owned by current staff, not terminal
        prisma.ticket.count({
          where: {
            ownerId: currentUser.id,
            currentStatus: {
              notIn: [TicketStatus.RESOLVED, TicketStatus.CLOSED, TicketStatus.CANCELLED],
            },
          },
        }),
        // Status counts
        prisma.ticket.groupBy({
          by: ['currentStatus'],
          _count: { id: true },
        }),
        // Priority counts
        prisma.ticket.groupBy({
          by: ['itPriority'],
          _count: { id: true },
        }),
        // recentTickets: updated within 7 days, up to 10
        prisma.ticket.findMany({
          where: {
            updatedAt: { gte: sevenDaysAgo },
          },
          orderBy: { updatedAt: 'desc' },
          take: 10,
          select: {
            id: true,
            ticketNumber: true,
            summary: true,
            currentStatus: true,
            itPriority: true,
            requestedPriority: true,
            createdAt: true,
            updatedAt: true,
            owner: { select: { id: true, fullName: true, role: true } },
            requester: { select: { id: true, fullName: true, email: true } },
          },
        }),
      ]);

    // Build byStatus map with all enum values initialized
    const byStatus: Record<TicketStatus, number> = {
      NEW: 0,
      OPEN: 0,
      IN_PROGRESS: 0,
      WAITING_FOR_REQUESTER: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REOPENED: 0,
      CANCELLED: 0,
    };
    for (const group of statusGroups) {
      byStatus[group.currentStatus] = group._count.id;
    }

    // Build byPriority map with all enum values initialized
    const byPriority: Record<Priority, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };
    for (const group of priorityGroups) {
      if (group.itPriority) {
        byPriority[group.itPriority] = group._count.id;
      }
    }

    const openInProgress = (byStatus.OPEN || 0) + (byStatus.IN_PROGRESS || 0);
    const urgentPriority = byPriority.URGENT || 0;

    return res.json({
      unassigned,
      myTickets,
      openInProgress,
      urgentPriority,
      byStatus,
      byPriority,
      recentTickets,
    });
  } catch (error) {
    console.error('Error fetching staff dashboard metrics:', error);
    return res.status(500).json({ error: 'Failed to fetch staff dashboard metrics.' });
  }
});

export default router;
