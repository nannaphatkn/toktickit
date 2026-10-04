import { Router } from 'express';
import { prisma } from '../prisma';
import { sendApiError } from '../http';

const router = Router();


// GET /api/requesters - Retrieve all active requesters
router.get('/', async (_req, res) => {
  try {
    const requesters = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });
    // Format response to include name for backward compatibility
    const formatted = requesters.map(r => ({
      id: r.id,
      name: r.fullName,
      fullName: r.fullName,
      email: r.email,
      role: r.role,
      isActive: r.isActive,
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Error fetching requesters:', error);
    sendApiError(res, 500, 'Unexpected failure');
  }
});

export default router;
