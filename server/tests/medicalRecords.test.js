process.env.JWT_SECRET = 'supersecret';
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { router: authRouter, authMiddleware } = require('../routes/auth');
const { router: medicalRecordsRouter } = require('../routes/medicalRecords');
const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/medical-records', medicalRecordsRouter);

let token, patientId, doctorId, recordId;

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/smart-health-test');
});

beforeEach(async () => {
  await User.deleteMany({});
  await MedicalRecord.deleteMany({});
  await new Promise(r => setTimeout(r, 100)); // Wait for DB cleanup
  // Register patient and doctor via API
  const patientRes = await request(app).post('/api/auth/register').send({ name: 'Patient', email: 'patient@test.com', password: 'test1234', role: 'patient' });
  console.log('PATIENT REGISTER RESPONSE:', patientRes.body);
  patientId = patientRes.body.user && patientRes.body.user._id;
  const doctorRes = await request(app).post('/api/auth/register').send({ name: 'Doctor', email: 'doctor@test.com', password: 'test1234', role: 'doctor' });
  console.log('DOCTOR REGISTER RESPONSE:', doctorRes.body);
  doctorId = doctorRes.body.user && doctorRes.body.user._id;
  // Login as doctor
  const res = await request(app).post('/api/auth/login').send({ email: 'doctor@test.com', password: 'test1234' });
  console.log('DOCTOR LOGIN RESPONSE:', res.body);
  token = res.body.token;
  if (!token) throw new Error('Doctor login failed, token not received');
  // Ensure uploads dir exists
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  // Create a dummy file
  fs.writeFileSync(path.join('uploads', 'dummy.pdf'), 'dummy content');
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
  // Clean up dummy file
  try { fs.unlinkSync(path.join('uploads', 'dummy.pdf')); } catch {}
});

describe('Medical Records API', () => {
  it('should upload a medical record', async () => {
    const res = await request(app)
      .post('/api/medical-records/upload')
      .set('Authorization', 'Bearer ' + token)
      .field('patientId', patientId.toString())
      .field('doctorId', doctorId.toString())
      .field('date', new Date().toISOString())
      .field('symptoms', 'Cough')
      .field('diagnosis', 'Flu')
      .attach('file', path.join('uploads', 'dummy.pdf'));
    expect(res.statusCode).toBe(201);
    expect(res.body.record && res.body.record.symptoms).toBe('Cough');
    recordId = res.body.record && res.body.record._id;
    if (!recordId) throw new Error('Medical record not created');
  });

  it('should fetch all records for a patient', async () => {
    // Upload a record first
    const uploadRes = await request(app)
      .post('/api/medical-records/upload')
      .set('Authorization', 'Bearer ' + token)
      .field('patientId', patientId.toString())
      .field('doctorId', doctorId.toString())
      .field('date', new Date().toISOString())
      .field('symptoms', 'Cough')
      .field('diagnosis', 'Flu')
      .attach('file', path.join('uploads', 'dummy.pdf'));
    recordId = uploadRes.body.record && uploadRes.body.record._id;
    const res = await request(app)
      .get(`/api/medical-records/patient/${patientId}`)
      .set('Authorization', 'Bearer ' + token);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0] && res.body[0].symptoms).toBe('Cough');
  });

  it('should download a record file', async () => {
    // Upload a record first
    const uploadRes = await request(app)
      .post('/api/medical-records/upload')
      .set('Authorization', 'Bearer ' + token)
      .field('patientId', patientId.toString())
      .field('doctorId', doctorId.toString())
      .field('date', new Date().toISOString())
      .field('symptoms', 'Cough')
      .field('diagnosis', 'Flu')
      .attach('file', path.join('uploads', 'dummy.pdf'));
    recordId = uploadRes.body.record && uploadRes.body.record._id;
    const res = await request(app)
      .get(`/api/medical-records/download/${recordId}`)
      .set('Authorization', 'Bearer ' + token);
    expect(res.statusCode).toBe(200);
    expect(res.header['content-type']).toMatch(/application\/pdf/);
  });
}); 