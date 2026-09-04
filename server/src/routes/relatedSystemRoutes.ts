import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const systems = await prisma.relatedSystem.findMany({ orderBy: { name: 'asc' } });
    res.json(systems);
  } catch (error) {
    console.error('Error fetching related systems:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
