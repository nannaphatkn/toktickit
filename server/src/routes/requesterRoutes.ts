import { Router } from 'express';
import { prisma } from '../prisma';
import { sendApiError } from '../http';

const router = Router();


// GET /api/requesters - Retrieve all active requesters
router.get('/', async (_req, res) => {
  try {
    const requesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });
    res.json(requesters);
  } catch (error) {
    console.error('Error fetching requesters:', error);
    sendApiError(res, 500, 'Unexpected failure');
  }
});

export default router;
