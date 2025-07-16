process.env.JWT_SECRET = 'supersecret';
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { router: authRouter } = require('../routes/auth');
const { router: profileRouter } = require('../routes/profile');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);

let token, userId, uniqueEmail;

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/smart-health-test');
});

beforeEach(async () => {
  await User.deleteMany({});
  await MedicalRecord.deleteMany({});
  await new Promise(r => setTimeout(r, 300)); // Wait for DB cleanup
  // Use unique email for each test
  uniqueEmail = `profile+${Date.now()}@test.com`;
  // Register user via API
  const registerRes = await request(app).post('/api/auth/register').send({ name: 'ProfileUser', email: uniqueEmail, password: 'test1234', role: 'patient' });
  console.log('REGISTER RESPONSE:', registerRes.body);
  userId = registerRes.body.user && registerRes.body.user._id;
  await new Promise(r => setTimeout(r, 600)); // Wait for user to be written
  // Login
  const res = await request(app).post('/api/auth/login').send({ email: uniqueEmail, password: 'test1234' });
  console.log('LOGIN RESPONSE:', res.body);
  token = res.body.token;
  if (!token) throw new Error('Login failed, token not received');
  await new Promise(r => setTimeout(r, 600)); // Wait for login to be processed
  // Add a medical record
  await MedicalRecord.create({ patient: userId, date: new Date(), symptoms: 'Headache', diagnosis: 'Migraine', doctorNotes: 'Rest', fileUrl: '' });
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe('Profile API', () => {
  it('should get user profile', async () => {
    const res = await request(app)
      .get(`/api/profile/${userId}`)
      .set('Authorization', 'Bearer ' + token);
    console.log('PROFILE RESPONSE:', res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body && res.body.email).toBe(uniqueEmail);
  });

  it('should update user profile', async () => {
    const res = await request(app)
      .put(`/api/profile/update/${userId}`)
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'Updated Name', bloodGroup: 'A+', allergies: ['pollen'], chronicDiseases: ['asthma'], emergencyContact: { name: 'Mom', phone: '123', relation: 'Mother' } });
    console.log('UPDATE PROFILE RESPONSE:', res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body && res.body.name).toBe('Updated Name');
    expect(res.body && res.body.bloodGroup).toBe('A+');
  });

  it('should export all records for user', async () => {
    const res = await request(app)
      .get(`/api/profile/export/${userId}`)
      .set('Authorization', 'Bearer ' + token);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0] && res.body[0].symptoms).toBe('Headache');
  });
}); 