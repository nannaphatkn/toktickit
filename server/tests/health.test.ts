import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('API Health Check', () => {
  it('should return 200 OK with status and timestamp', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    
    // Verify timestamp is a valid ISO string date
    const date = new Date(response.body.timestamp);
    expect(date.toString()).not.toBe('Invalid Date');
  });
});
