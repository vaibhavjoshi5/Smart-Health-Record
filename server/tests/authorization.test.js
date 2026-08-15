process.env.JWT_SECRET = 'test-only-secret';

const express = require('express');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { authMiddleware, requireRole, requireSelfOrRole } = require('../routes/auth');

const app = express();
app.get('/doctor-only', authMiddleware, requireRole('doctor'), (_req, res) => res.json({ ok: true }));
app.get('/users/:userId', authMiddleware, requireSelfOrRole('doctor'), (_req, res) => res.json({ ok: true }));

const tokenFor = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET);

describe('authorization middleware', () => {
  it('rejects a patient from doctor-only endpoints', async () => {
    const response = await request(app)
      .get('/doctor-only')
      .set('Authorization', `Bearer ${tokenFor('patient-1', 'patient')}`);

    expect(response.statusCode).toBe(403);
  });

  it('rejects a patient reading another user profile', async () => {
    const response = await request(app)
      .get('/users/patient-2')
      .set('Authorization', `Bearer ${tokenFor('patient-1', 'patient')}`);

    expect(response.statusCode).toBe(403);
  });

  it('allows a patient to read their own profile', async () => {
    const response = await request(app)
      .get('/users/patient-1')
      .set('Authorization', `Bearer ${tokenFor('patient-1', 'patient')}`);

    expect(response.statusCode).toBe(200);
  });
});
