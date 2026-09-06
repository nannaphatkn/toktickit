import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('Reference Data API Endpoint', () => {
  it('GET /api/reference-data returns categories and related systems without authentication', async () => {
    const response = await request(app).get('/api/reference-data');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('categories');
    expect(response.body).toHaveProperty('relatedSystems');
    expect(Array.isArray(response.body.categories)).toBe(true);
    expect(Array.isArray(response.body.relatedSystems)).toBe(true);

    if (response.body.categories.length > 0) {
      expect(response.body.categories[0]).toHaveProperty('id');
      expect(response.body.categories[0]).toHaveProperty('name');
    }
    if (response.body.relatedSystems.length > 0) {
      expect(response.body.relatedSystems[0]).toHaveProperty('id');
      expect(response.body.relatedSystems[0]).toHaveProperty('name');
    }
  });
});
