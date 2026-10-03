import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Lab 03 Authentication API Tests', () => {
  it('API-01: Valid login returns JWT token and user details', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jennifer.anderson@toktickit.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({
      email: 'jennifer.anderson@toktickit.com',
      role: 'REQUESTER',
      mustChangePassword: false,
    });
  });

  it('API-02: Invalid password returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jennifer.anderson@toktickit.com',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('API-02: Inactive account login returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'kevin.patel@toktickit.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/inactive/i);
  });

  it('API-03: User with initial password receives mustChangePassword: true flag', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'emily.davis@toktickit.com',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.user.mustChangePassword).toBe(true);
  });
});
