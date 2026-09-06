import { Router } from 'express';
import { prisma } from '../prisma';
import { sendApiError } from '../http';

const router = Router();

// GET /api/categories - List ticket categories
router.get('/', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    sendApiError(res, 500, 'Unexpected failure');
  }
});

export default router;
