import { Router } from 'express';
import { prisma } from '../prisma';
import { sendApiError } from '../http';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const systems = await prisma.relatedSystem.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    res.json(systems);
  } catch (error) {
    console.error('Error fetching related systems:', error);
    sendApiError(res, 500, 'Unexpected failure');
  }
});

export default router;
