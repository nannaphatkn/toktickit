import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/index';

describe('Lab 03 Administrator User Management API Tests', () => {
  let adminToken: string;
  let adminUserId: number;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john.smith@toktickit.com', password: 'Password123!' });
    adminToken = res.body.token;
    adminUserId = res.body.user.id;
  });

  it('API-14: Admin can retrieve user list and search by email', async () => {
    const res = await request(app)
      .get('/api/admin/users?search=jennifer')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.users.length).toBeGreaterThan(0);
    expect(res.body.users[0].email).toMatch(/jennifer/i);
  });

  it('API-15: Admin creating user with duplicate email returns 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Duplicate User',
        email: 'jennifer.anderson@toktickit.com',
        role: 'REQUESTER',
        initialPassword: 'Password123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
  });

  it('API-16: Admin self-deactivation attempt returns 400 Bad Request', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/safety rule violation/i);
  });

  it('API-17: Admin deactivating last active Admin returns 400 Bad Request', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminUserId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'REQUESTER' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/last active administrator/i);
  });
});
