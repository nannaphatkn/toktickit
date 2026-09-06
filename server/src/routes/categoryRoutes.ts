import { Router } from 'express';
import { prisma } from '../prisma';

const router = Router();

// GET /api/categories - List ticket categories
router.get('/', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error', details: {} });
  }
});

export default router;
