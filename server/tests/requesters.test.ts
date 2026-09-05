import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('GET /api/requesters', () => {
  it('should return only active requesters', async () => {
    const res = await request(app).get('/api/requesters');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // All returned requesters must be active
    for (const requester of res.body) {
      expect(requester.isActive).toBe(true);
    }
  });

  it('should not include inactive requesters', async () => {
    const res = await request(app).get('/api/requesters');

    expect(res.status).toBe(200);

    // Robert Taylor is inactive and should not be returned
    const names = res.body.map((r: { name: string }) => r.name);
    expect(names).not.toContain('Robert Taylor');
  });

  it('should return requesters with correct fields', async () => {
    const res = await request(app).get('/api/requesters');

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);

    const requester = res.body[0];
    expect(requester).toHaveProperty('id');
    expect(requester).toHaveProperty('name');
    expect(requester).toHaveProperty('email');
    expect(requester).toHaveProperty('isActive');
  });

  it('should return requesters sorted by name ascending', async () => {
    const res = await request(app).get('/api/requesters');

    expect(res.status).toBe(200);

    const names = res.body.map((r: { name: string }) => r.name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });
});
