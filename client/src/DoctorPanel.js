import React, { useEffect, useState } from 'react';
import FileUpload from './FileUpload';
import { authFetch } from './utils';
import './App.css';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import AnimatedText from './AnimatedText';

function DoctorPanel() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [entry, setEntry] = useState({ date: '', symptoms: '', diagnosis: '', doctorNotes: '' });
  const [message, setMessage] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState('');

  useEffect(() => {
    // Fetch assigned patients
    authFetch(`/api/doctor/patients/${user._id || user.id}`)
      .then(res => res.json())
      .then(setPatients);
    // Fetch doctor's appointments
    authFetch(`/api/appointment/doctor/${user._id || user.id}`)
      .then(res => res.json())
      .then(setAppointments);
  }, [user]);

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
    setLoading(true);
    try {
      const res = await authFetch('/api/doctor/add-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...entry, patientId: selectedPatient, doctorId: user._id || user.id })
      });
      const data = await res.json();
      if (res.ok) setMessage('Entry added!');
      else setMessage(data.message || 'Failed to add entry');
    } catch (err) {
      setMessage('Error adding entry');
    }
    setLoading(false);
  };

  const handleDownloadSummary = async () => {
    if (!selectedPatient) return setMessage('Select a patient');
    try {
      const res = await authFetch(`/api/doctor/summary/${selectedPatient}`);
      const data = await res.json();
      // Optionally trigger download as file
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
      <div className="App">
        <div style={{ position: 'relative', marginTop: '2.5rem', marginBottom: '1.5rem' }}>
          <div className="welcome-msg">
            Doctor Panel - {user.name}! 👨‍⚕️
          </div>
        </div>
        <div className="form-container" style={{textAlign: 'center', padding: '2rem'}}>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>⏳ Loading doctor panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hero-animated-bg" />
      <div className="App">
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginTop: '3.5rem', marginBottom: '0.5rem' }}>
          <AnimatedText typewriter={true} className="animated-text-color"><h2>Doctor Panel</h2></AnimatedText>
          <Button
            variant="outlined"
            sx={{ marginLeft: 'auto', marginRight: '2rem', color: '#7f5af0', borderColor: '#7f5af0', fontWeight: 600 }}
            onClick={() => window.location.href = '/profile'}
          >
            Profile
          </Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
          <div className="main-content" style={{ flex: 1 }}>
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
                    <button type="submit" disabled={loading} className="btn">{loading ? 'Adding...' : 'Add Entry'}</button>
                  </form>
                  {message && <p style={{ color: message.includes('added') ? 'green' : 'red', marginTop: '1rem' }}>{message}</p>}
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
                  <div style={{maxHeight: '400px', overflowY: 'auto'}}>
                    {appointments.length === 0 ? (
                      <p>No appointments found.</p>
                    ) : (
                      <ul style={{listStyle: 'none', padding: 0}}>
                        {appointments.map(a => (
                          <li key={a._id} style={{
                            background: '#f8f9fa',
                            margin: '0.5rem 0',
                            padding: '1rem',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            flexWrap: 'wrap'
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
        </div>
      </div>
    </>
  );
}

export default DoctorPanel; 