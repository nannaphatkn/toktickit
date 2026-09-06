import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { prisma } from './prisma';
import requesterRoutes from './routes/requesterRoutes';
import relatedSystemRoutes from './routes/relatedSystemRoutes';
import ticketRoutes from './routes/ticketRoutes';
import categoryRoutes from './routes/categoryRoutes';
import attachmentRoutes from './routes/attachmentRoutes';
import referenceDataRoutes from './routes/referenceDataRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('TokTickIT API Server');
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TokTickIT API',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/requesters', requesterRoutes);
app.use('/api/related-systems', relatedSystemRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/attachments', attachmentRoutes);
app.use('/api/reference-data', referenceDataRoutes);

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled API error:', error);
  res.status(500).json({ error: 'Unexpected failure', details: {} });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
