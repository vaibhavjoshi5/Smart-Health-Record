process.env.JWT_SECRET = 'supersecret';
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { router: authRouter, authMiddleware } = require('../routes/auth');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

// Dummy protected route
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Protected content', user: req.user });
});

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/smart-health-test');
});

beforeEach(async () => {
  await User.deleteMany({}); // Clean users before each test
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe('Auth API', () => {
  const testUser = { name: 'Test', email: 'test@example.com', password: 'test1234', role: 'patient' };
  let token;

  it('should register a new user', async () => {
    // Use a unique email for registration test
    const uniqueUser = { ...testUser, email: 'unique_' + Date.now() + '@example.com' };
    const res = await request(app).post('/api/auth/register').send(uniqueUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe(uniqueUser.email);
  });

  it('should login and return a token', async () => {
    // Register user first
    await request(app).post('/api/auth/register').send(testUser);
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
    token = res.body.token;
  });

  it('should access a protected route with token', async () => {
    // Register and login user first
    await request(app).post('/api/auth/register').send(testUser);
    const loginRes = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
    token = loginRes.body.token;
    const res = await request(app).get('/api/protected').set('Authorization', 'Bearer ' + token);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });
}); 