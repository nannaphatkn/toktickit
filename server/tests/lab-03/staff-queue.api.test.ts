import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Lab 03 IT Staff Ticket Queue API Tests', () => {
  let staffToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'michael.brown@toktickit.com', password: 'Password123!' });
    staffToken = res.body.token;
  });

  it('API-07: IT Staff can retrieve queue with pagination metadata', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?page=1&limit=5')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('tickets');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.tickets.length).toBeGreaterThan(0);
    expect(res.body.pagination.page).toBe(1);
  });

  it('API-07: Queue text search filters tickets correctly', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?search=battery')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tickets.length).toBeGreaterThan(0);
    expect(res.body.tickets[0].summary).toMatch(/battery/i);
  });

  it('API-07: Queue status filter returns matching tickets', async () => {
    const res = await request(app)
      .get('/api/staff/tickets?status=IN_PROGRESS')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tickets.every((t: any) => t.currentStatus === 'IN_PROGRESS')).toBe(true);
  });
});
