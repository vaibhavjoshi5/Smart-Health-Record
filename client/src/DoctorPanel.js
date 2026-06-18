import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import { authFetch, getUser } from './utils';
import './App.css';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import AnimatedText from './AnimatedText';

function DoctorPanel() {
  const user = useMemo(() => getUser(), []);
  const userId = user?._id || user?.id;
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [entry, setEntry] = useState({ date: '', symptoms: '', diagnosis: '', doctorNotes: '' });
  const [message, setMessage] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusLoading, setStatusLoading] = useState('');

  useEffect(() => {
    document.title = 'Doctor Panel — Smart Health Record';
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchAll = async () => {
      // ⚡ Parallel fetch - patients + appointments load simultaneously
      const [patientsResult, appointmentsResult] = await Promise.allSettled([
        authFetch(`/api/doctor/patients/${userId}`, { signal }).then(r => r.ok ? r.json() : []),
        authFetch(`/api/appointment/doctor/${userId}`, { signal }).then(r => r.ok ? r.json() : []),
      ]);

      if (patientsResult.status === 'fulfilled') setPatients(patientsResult.value);
      if (appointmentsResult.status === 'fulfilled') setAppointments(appointmentsResult.value);
      setLoading(false);
    };

    fetchAll().catch(() => setLoading(false));

    return () => controller.abort();
  }, [userId]);

  const validate = () => {
    if (!selectedPatient) return 'Select a patient';
    if (!entry.date) return 'Date is required';
    if (!entry.symptoms) return 'Symptoms are required';
    if (!entry.diagnosis) return 'Diagnosis is required';
    return null;
  };

  const handleEntryChange = e => {
    setEntry({ ...entry, [e.target.name]: e.target.value });
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    setMessage('');
    const error = validate();
    if (error) return setMessage(error);
    setSubmitting(true);
    try {
      const res = await authFetch('/api/doctor/add-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry, patientId: selectedPatient, doctorId: userId })
      });
      const data = await res.json();
      if (res.ok) setMessage('Entry added!');
      else setMessage(data.message || 'Failed to add entry');
    } catch (err) {
      setMessage('Error adding entry');
    }
    setSubmitting(false);
  };

  const handleDownloadSummary = async () => {
    if (!selectedPatient) return setMessage('Select a patient');
    try {
      const res = await authFetch(`/api/doctor/summary/${selectedPatient}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'summary.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage('Error downloading summary');
    }
  };

  const handleStatusChange = async (id, status) => {
    setStatusLoading(id);
    try {
      const res = await authFetch(`/api/appointment/status/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setAppointments(apps => apps.map(a => a._id === id ? { ...a, status } : a));
        setMessage('Appointment status updated successfully');
      } else {
        const data = await res.json();
        setMessage(data.message || 'Failed to update status');
      }
    } catch (err) {
      setMessage('Error updating status');
    }
    setStatusLoading('');
  };

  const handleCancel = async (id) => {
    setStatusLoading(id);
    try {
      const res = await authFetch(`/api/appointment/cancel/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAppointments(apps => apps.filter(a => a._id !== id));
      }
    } catch (err) {
      setMessage('Error cancelling appointment');
    }
    setStatusLoading('');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" />
        <p style={{ color: '#b7aaff', fontSize: '1.1rem' }}>⏳ Loading doctor panel...</p>
      </div>
    );
  }

  return (
    <>
      <div className="hero-animated-bg" />
      <div style={{ width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '0.5rem', marginBottom: '1rem' }}>
          <AnimatedText typewriter={true} className="animated-text-color"><h2>Doctor Panel</h2></AnimatedText>
        </div>
        <div className="dashboard-grid">
          <Card className="dashboard-card-equal" elevation={3}>
            <CardContent>
              <h3>📄 Upload Medical Documents</h3>
              <FileUpload isDoctor={true} />
            </CardContent>
          </Card>
          <Card className="dashboard-card-equal" elevation={3}>
            <CardContent>
              <h3>👥 Assigned Patients</h3>
              <select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} className="input">
                <option value="">Select a patient</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                ))}
              </select>
            </CardContent>
          </Card>
          <Card className="dashboard-card-equal" elevation={3}>
            <CardContent>
              <h3>➕ Add Medical Entry</h3>
              <form onSubmit={handleAddEntry}>
                <input type="date" name="date" value={entry.date} onChange={handleEntryChange} required className="input" />
                <input type="text" name="symptoms" placeholder="Symptoms" value={entry.symptoms} onChange={handleEntryChange} required className="input" />
                <input type="text" name="diagnosis" placeholder="Diagnosis" value={entry.diagnosis} onChange={handleEntryChange} required className="input" />
                <input type="text" name="doctorNotes" placeholder="Doctor Notes" value={entry.doctorNotes} onChange={handleEntryChange} className="input" />
                <button type="submit" disabled={submitting} className="btn">{submitting ? 'Adding...' : 'Add Entry'}</button>
              </form>
              {message && <p style={{ color: message.includes('added') || message.includes('updated') ? '#81c784' : '#ef5350', marginTop: '1rem' }}>{message}</p>}
            </CardContent>
          </Card>
          <Card className="dashboard-card-equal" elevation={3}>
            <CardContent>
              <h3>📋 Download Patient Summary</h3>
              <button onClick={handleDownloadSummary} className="btn">Download Summary (JSON)</button>
            </CardContent>
          </Card>
          <Card className="dashboard-card-equal" elevation={3}>
            <CardContent>
              <h3>📅 Manage Appointments</h3>
              <div style={{maxHeight: '350px', overflowY: 'auto'}}>
                {appointments.length === 0 ? (
                  <p style={{ color: '#b0b3bc', textAlign: 'center', padding: '1rem' }}>No appointments found.</p>
                ) : (
                  <ul style={{listStyle: 'none', padding: 0}}>
                    {appointments.map(a => (
                      <li key={a._id} style={{
                        background: 'rgba(127,90,240,0.10)',
                        border: '1px solid rgba(127,90,240,0.15)',
                        margin: '0.5rem 0',
                        padding: '1rem',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        color: '#f5f6fa'
                      }}>
                        <span style={{flex: 1, textAlign: 'left'}}>
                          📅 {a.date ? new Date(a.date).toLocaleDateString() : ''} ⏰ {a.time} 
                          <br />👤 {a.patient?.name || a.patient} 
                          <br />📊 Status: <strong>{a.status}</strong>
                        </span>
                        <select 
                          value={a.status} 
                          onChange={e => handleStatusChange(a._id, e.target.value)} 
                          disabled={statusLoading === a._id}
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <button onClick={() => handleCancel(a._id)} disabled={statusLoading === a._id} className="btn btn-cancel">Cancel</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

export default DoctorPanel;