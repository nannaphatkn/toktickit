import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Lab 03 Comments & Internal Notes API Tests', () => {
  let requesterToken: string;
  let staffToken: string;

  beforeAll(async () => {
    const reqRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jennifer.anderson@toktickit.com', password: 'Password123!' });
    requesterToken = reqRes.body.token;

    const staffRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'michael.brown@toktickit.com', password: 'Password123!' });
    staffToken = staffRes.body.token;
  });

  it('API-12: Requester can post and view public comments on owned ticket', async () => {
    const postRes = await request(app)
      .post('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({ content: 'Test public comment by requester.' });

    expect(postRes.status).toBe(201);
    expect(postRes.body.comment.content).toBe('Test public comment by requester.');

    const getRes = await request(app)
      .get('/api/tickets/1/comments')
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.comments.some((c: any) => c.content === 'Test public comment by requester.')).toBe(true);
  });

  it('API-13: Requester accessing internal notes returns 403 Forbidden', async () => {
    const getRes = await request(app)
      .get('/api/tickets/1/notes')
      .set('Authorization', `Bearer ${requesterToken}`);

    expect(getRes.status).toBe(403);
    expect(getRes.body.error).toMatch(/forbidden/i);

    const postRes = await request(app)
      .post('/api/tickets/1/notes')
      .set('Authorization', `Bearer ${requesterToken}`)
      .send({ content: 'Unauthorized internal note attempt' });

    expect(postRes.status).toBe(403);
  });

  it('API-13: IT Staff can post and view internal notes', async () => {
    const postRes = await request(app)
      .post('/api/tickets/1/notes')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({ content: 'Internal staff note regarding diagnostics.' });

    expect(postRes.status).toBe(201);

    const getRes = await request(app)
      .get('/api/tickets/1/notes')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.notes.some((n: any) => n.content === 'Internal staff note regarding diagnostics.')).toBe(true);
  });
});
