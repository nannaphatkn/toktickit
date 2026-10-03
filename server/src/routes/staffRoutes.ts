import { Router, Request, Response } from 'express';
import { Priority, TicketStatus, Role, Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { authenticateUser, requirePasswordChanged, requireRole } from '../middleware/authMiddleware';

const router = Router();

// Protect all IT Staff routes: Must be authenticated, password changed, and role = IT_STAFF or ADMINISTRATOR
router.use(authenticateUser);
router.use(requirePasswordChanged);
router.use(requireRole(Role.IT_STAFF, Role.ADMINISTRATOR));

/**
 * GET /api/staff/members
 * Returns list of active IT Staff and Administrator users available for ticket assignment.
 */
router.get('/members', async (_req: Request, res: Response) => {
  try {
    const staffMembers = await prisma.user.findMany({
      where: {
        role: { in: [Role.IT_STAFF, Role.ADMINISTRATOR] },
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
      },
      orderBy: { fullName: 'asc' },
    });
    return res.json({ staffMembers });
  } catch (error) {
    console.error('Error fetching staff members:', error);
    return res.status(500).json({ error: 'Failed to fetch IT staff members.' });
  }
});

/**
 * GET /api/staff/tickets
 * IT Staff Ticket Queue with search, category/status/priority filters, owner filter, sorting, and pagination.
 */
router.get('/tickets', async (req: Request, res: Response) => {
  try {
    const {
      search,
      category,
      status,
      priority,
      owner,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const where: Prisma.TicketWhereInput = {};

    // Search filter (ticket number, summary, description, requester name)
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { ticketNumber: { contains: searchTerm, mode: 'insensitive' } },
        { summary: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { requester: { fullName: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    // Category filter
    if (category && typeof category === 'string' && category !== 'ALL') {
      if (!isNaN(Number(category))) {
        where.categoryId = parseInt(category, 10);
      } else {
        where.category = { name: { equals: category, mode: 'insensitive' } };
      }
    }

    // Status filter
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.currentStatus = status as TicketStatus;
    }

    // IT Priority filter
    if (priority && typeof priority === 'string' && priority !== 'ALL') {
      where.itPriority = priority as Priority;
    }

    // Owner filter ('me', 'unassigned', 'all', or userId)
    if (owner && typeof owner === 'string') {
      if (owner === 'me') {
        where.ownerId = req.user!.id;
      } else if (owner === 'unassigned') {
        where.ownerId = null;
      } else if (owner !== 'all' && !isNaN(Number(owner))) {
        where.ownerId = parseInt(owner, 10);
      }
    }

    // Determine sorting
    let orderBy: Prisma.TicketOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy === 'ticketNumber') {
      orderBy = { ticketNumber: sortOrder === 'asc' ? 'asc' : 'desc' };
    } else if (sortBy === 'itPriority') {
      orderBy = { itPriority: sortOrder === 'asc' ? 'asc' : 'desc' };
    } else if (sortBy === 'status' || sortBy === 'currentStatus') {
      orderBy = { currentStatus: sortOrder === 'asc' ? 'asc' : 'desc' };
    } else if (sortBy === 'updatedAt') {
      orderBy = { updatedAt: sortOrder === 'asc' ? 'asc' : 'desc' };
    } else {
      orderBy = { createdAt: sortOrder === 'asc' ? 'asc' : 'desc' };
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          requester: { select: { id: true, fullName: true, email: true } },
          owner: { select: { id: true, fullName: true, email: true, role: true } },
          _count: { select: { publicComments: true, internalNotes: true, attachments: true } },
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.json({
      tickets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching staff tickets queue:', error);
    return res.status(500).json({ error: 'Failed to fetch ticket queue.' });
  }
});

/**
 * GET /api/staff/tickets/:id
 * Retrieve single ticket detail for IT Staff
 */
router.get('/tickets/:id', async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID.' });
  }

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, fullName: true, email: true } },
        owner: { select: { id: true, fullName: true, email: true, role: true } },
        attachments: { where: { isRemoved: false } },
        publicComments: {
          include: { author: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
        internalNotes: {
          include: { author: { select: { id: true, fullName: true, role: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    return res.json({ ticket });
  } catch (error) {
    console.error('Error fetching ticket detail for staff:', error);
    return res.status(500).json({ error: 'Failed to fetch ticket detail.' });
  }
});

/**
 * PATCH /api/staff/tickets/:id/assign
 * Claim or reassign ticket owner
 */
router.post('/tickets/:id/assign', async (req: Request, res: Response) => {
  return handleAssign(req, res);
});
router.patch('/tickets/:id/assign', async (req: Request, res: Response) => {
  return handleAssign(req, res);
});

async function handleAssign(req: Request, res: Response) {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID.' });
  }

  const { ownerId } = req.body; // Can be number, string, or null/undefined (claim to self if omitted)

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    let targetOwnerId: number | null = null;
    if (ownerId === null || ownerId === 'unassigned') {
      targetOwnerId = null;
    } else if (ownerId !== undefined && ownerId !== null) {
      targetOwnerId = parseInt(ownerId as string, 10);
      if (isNaN(targetOwnerId)) {
        return res.status(400).json({ error: 'Invalid target owner ID.' });
      }

      // Verify target owner is active IT_STAFF or ADMINISTRATOR
      const targetUser = await prisma.user.findUnique({ where: { id: targetOwnerId } });
      if (!targetUser || !targetUser.isActive) {
        return res.status(400).json({ error: 'Target owner user must be an active user.' });
      }
      if (targetUser.role !== Role.IT_STAFF && targetUser.role !== Role.ADMINISTRATOR) {
        return res.status(400).json({ error: 'Primary ticket ownership can only be assigned to IT Staff or Administrator.' });
      }
    } else {
      // Default: Claim ticket for self
      targetOwnerId = req.user!.id;
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { ownerId: targetOwnerId },
      include: {
        owner: { select: { id: true, fullName: true, email: true, role: true } },
      },
    });

    return res.json({ message: 'Ticket ownership updated.', ticket: updatedTicket });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    return res.status(500).json({ error: 'Failed to assign ticket.' });
  }
}

/**
 * PATCH /api/staff/tickets/:id/priority
 * Update IT Priority
 */
router.patch('/tickets/:id/priority', async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID.' });
  }

  const { itPriority } = req.body;
  if (!itPriority || !Object.values(Priority).includes(itPriority)) {
    return res.status(400).json({ error: 'Valid IT Priority is required (LOW, MEDIUM, HIGH, URGENT).' });
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { itPriority: itPriority as Priority },
    });

    return res.json({ message: 'IT Priority updated.', ticket: updatedTicket });
  } catch (error) {
    console.error('Error updating IT priority:', error);
    return res.status(500).json({ error: 'Failed to update IT priority.' });
  }
});

/**
 * PATCH /api/staff/tickets/:id/status
 * Update ticket status according to permitted workflow
 */
router.patch('/tickets/:id/status', async (req: Request, res: Response) => {
  const ticketId = parseInt(req.params.id, 10);
  if (isNaN(ticketId)) {
    return res.status(400).json({ error: 'Invalid ticket ID.' });
  }

  const { status } = req.body;
  if (!status || !Object.values(TicketStatus).includes(status)) {
    return res.status(400).json({ error: 'Valid status is required.' });
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { currentStatus: status as TicketStatus },
    });

    return res.json({ message: 'Ticket status updated.', ticket: updatedTicket });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return res.status(500).json({ error: 'Failed to update ticket status.' });
  }
});

export default router;
