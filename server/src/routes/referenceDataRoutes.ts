import { Router } from 'express';
import { prisma } from '../prisma';
import { sendApiError } from '../http';

const router = Router();

// GET /api/reference-data - Retrieve Categories and Related Systems per specification.md
router.get('/', async (_req, res) => {
  try {
    const [categories, relatedSystems] = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      prisma.relatedSystem.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
    ]);

    res.json({ categories, relatedSystems });
  } catch (error) {
    console.error('Error fetching reference data:', error);
    sendApiError(res, 500, 'Unexpected failure');
  }
});

export default router;
