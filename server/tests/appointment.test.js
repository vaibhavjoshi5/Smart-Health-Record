process.env.JWT_SECRET = 'supersecret';
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { router: authRouter } = require('../routes/auth');
const { router: appointmentRouter } = require('../routes/appointment');
const User = require('../models/User');
const Appointment = require('../models/Appointment');

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/appointment', appointmentRouter);

let patientToken, doctorToken, patientId, doctorId, appointmentId;

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/smart-health-test');
});

beforeEach(async () => {
  await User.deleteMany({});
  await Appointment.deleteMany({});
  await new Promise(r => setTimeout(r, 100)); // Wait for DB cleanup
  // Use unique emails for each test
  const unique = Date.now() + Math.random();
  global.patientEmail = `apptpatient+${unique}@test.com`;
  global.doctorEmail = `apptdoctor+${unique}@test.com`;
  // Register patient and doctor via API
  const patientRes = await request(app).post('/api/auth/register').send({ name: 'Patient', email: global.patientEmail, password: 'test1234', role: 'patient' });
  console.log('PATIENT REGISTER RESPONSE:', patientRes.body);
  patientId = patientRes.body.user && patientRes.body.user._id;
  await new Promise(r => setTimeout(r, 600)); // Wait for patient to be written
  const doctorRes = await request(app).post('/api/auth/register').send({ name: 'Doctor', email: global.doctorEmail, password: 'test1234', role: 'doctor' });
  console.log('DOCTOR REGISTER RESPONSE:', doctorRes.body);
  doctorId = doctorRes.body.user && doctorRes.body.user._id;
  await new Promise(r => setTimeout(r, 600)); // Wait for doctor to be written
  // Login as patient and doctor
  const res1 = await request(app).post('/api/auth/login').send({ email: global.patientEmail, password: 'test1234' });
  console.log('PATIENT LOGIN RESPONSE:', res1.body);
  patientToken = res1.body.token;
  if (!patientToken) throw new Error('Patient login failed, token not received');
  const res2 = await request(app).post('/api/auth/login').send({ email: global.doctorEmail, password: 'test1234' });
  console.log('DOCTOR LOGIN RESPONSE:', res2.body);
  doctorToken = res2.body.token;
  if (!doctorToken) throw new Error('Doctor login failed, token not received');
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.disconnect();
});

describe('Appointment API', () => {
  it('should book an appointment', async () => {
    const res = await request(app)
      .post('/api/appointment/book')
      .set('Authorization', 'Bearer ' + patientToken)
      .send({ patientId, doctorId, date: new Date().toISOString(), time: '10:00' });
    expect(res.statusCode).toBe(201);
    expect(res.body.appointment && res.body.appointment.patient).toBe(patientId.toString());
    appointmentId = res.body.appointment && res.body.appointment._id;
    if (!appointmentId) throw new Error('Appointment not created');
  });

  it('should fetch appointments by patient', async () => {
    // Book an appointment first
    const bookRes = await request(app)
      .post('/api/appointment/book')
      .set('Authorization', 'Bearer ' + patientToken)
      .send({ patientId, doctorId, date: new Date().toISOString(), time: '10:00' });
    appointmentId = bookRes.body.appointment && bookRes.body.appointment._id;
    const res = await request(app)
      .get(`/api/appointment/patient/${patientId}`)
      .set('Authorization', 'Bearer ' + patientToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0] && res.body[0]._id).toBe(appointmentId);
  });

  it('should fetch appointments by doctor', async () => {
    // Book an appointment first
    const bookRes = await request(app)
      .post('/api/appointment/book')
      .set('Authorization', 'Bearer ' + patientToken)
      .send({ patientId, doctorId, date: new Date().toISOString(), time: '10:00' });
    appointmentId = bookRes.body.appointment && bookRes.body.appointment._id;
    const res = await request(app)
      .get(`/api/appointment/doctor/${doctorId}`)
      .set('Authorization', 'Bearer ' + doctorToken);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0] && res.body[0]._id).toBe(appointmentId);
  });

  it('should update appointment status', async () => {
    // Book an appointment first
    const bookRes = await request(app)
      .post('/api/appointment/book')
      .set('Authorization', 'Bearer ' + patientToken)
      .send({ patientId, doctorId, date: new Date().toISOString(), time: '10:00' });
    appointmentId = bookRes.body.appointment && bookRes.body.appointment._id;
    const res = await request(app)
      .put(`/api/appointment/status/${appointmentId}`)
      .set('Authorization', 'Bearer ' + doctorToken)
      .send({ status: 'confirmed' });
    expect(res.statusCode).toBe(200);
    expect(res.body && res.body.status).toBe('confirmed');
  });

  it('should cancel appointment', async () => {
    // Book an appointment first
    const bookRes = await request(app)
      .post('/api/appointment/book')
      .set('Authorization', 'Bearer ' + patientToken)
      .send({ patientId, doctorId, date: new Date().toISOString(), time: '10:00' });
    appointmentId = bookRes.body.appointment && bookRes.body.appointment._id;
    const res = await request(app)
      .delete(`/api/appointment/cancel/${appointmentId}`)
      .set('Authorization', 'Bearer ' + doctorToken);
    expect(res.statusCode).toBe(200);
    expect(res.body && res.body.message).toMatch(/cancelled/i);
  });
}); 