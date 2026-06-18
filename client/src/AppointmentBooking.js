import React, { useEffect, useState, useMemo } from 'react';
import { authFetch, getUser } from './utils';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

function AppointmentBooking() {
  const user = useMemo(() => getUser(), []);
  const userId = user?._id || user?.id;

  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctorId: '', date: '', time: '' });
  const [message, setMessage] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchData = async () => {
      // ⚡ Parallel fetch - doctors + appointments load simultaneously
      const [doctorsResult, appointmentsResult] = await Promise.allSettled([
        authFetch('/api/profile', { signal }).then(r => r.ok ? r.json() : []),
        authFetch(`/api/appointment/patient/${userId}`, { signal }).then(r => r.ok ? r.json() : []),
      ]);

      if (doctorsResult.status === 'fulfilled') {
        const data = doctorsResult.value;
        if (Array.isArray(data)) {
          setDoctors(data.filter(u => u.role === 'doctor'));
        }
      }

      if (appointmentsResult.status === 'fulfilled') {
        setAppointments(appointmentsResult.value);
      }
    };

    fetchData().catch(err => {
      if (err.name !== 'AbortError') console.error('Failed to fetch data:', err);
    });

    return () => controller.abort();
  }, [userId]);

  const validate = () => {
    if (!form.doctorId) return 'Select a doctor';
    if (!form.date) return 'Date is required';
    if (!form.time) return 'Time is required';
    return null;
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setMessage('');
    const error = validate();
    if (error) return setMessage(error);
    setLoading(true);
    try {
      const res = await authFetch('/api/appointment/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, patientId: userId })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Appointment booked!');
        setAppointments(a => [...a, data.appointment]);
      } else {
        setMessage(data.message || 'Booking failed');
      }
    } catch (err) {
      setMessage('Error booking appointment');
    }
    setLoading(false);
  };

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <form onSubmit={handleBook} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%', paddingBottom: 16 }}>
        <div style={{ width: '100%' }}>
          <label style={{ display: 'block', marginBottom: 4, textAlign: 'left' }}>Doctor:</label>
          <Select
            id="doctorId"
            name="doctorId"
            value={form.doctorId}
            onChange={handleChange}
            fullWidth
            required
            displayEmpty
            sx={{
              background: '#181c24',
              color: '#fff',
              borderRadius: 1,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#444',
              },
            }}
          >
            <MenuItem value="">
              <em>Select a doctor</em>
            </MenuItem>
            {doctors.map(d => (
              <MenuItem key={d._id} value={d._id}>{d.name} ({d.email})</MenuItem>
            ))}
          </Select>
        </div>
        <div style={{ width: '100%' }}>
          <TextField
            id="date"
            name="date"
            label="Date"
            type="date"
            value={form.date}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiInputBase-root': {
                background: '#181c24',
                color: '#fff',
                borderRadius: 1,
              },
              '& .MuiInputLabel-root': {
                color: '#aaa',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#444',
              },
            }}
          />
        </div>
        <div style={{ width: '100%' }}>
          <TextField
            id="time"
            name="time"
            label="Time"
            type="time"
            value={form.time}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
            InputLabelProps={{ shrink: true }}
            sx={{
              '& .MuiInputBase-root': {
                background: '#181c24',
                color: '#fff',
                borderRadius: 1,
              },
              '& .MuiInputLabel-root': {
                color: '#aaa',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#444',
              },
            }}
          />
        </div>
        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{
            mt: 1,
            background: 'linear-gradient(90deg, #7f5af0 0%, #00b4d8 100%)',
            color: '#fff',
            fontWeight: 'bold',
            borderRadius: '8px',
            padding: '10px',
            '&:hover': {
              background: 'linear-gradient(90deg, #5f3dc4 0%, #0096c7 100%)',
            },
          }}
        >
          {loading ? 'Booking...' : '📅 Book Appointment'}
        </Button>
      </form>
      {message && <p style={{ color: message.includes('booked') ? '#81c784' : '#ef5350' }}>{message}</p>}
      <h4 style={{ color: '#e0e0e0', marginTop: '1rem' }}>Your Appointments</h4>
      {appointments.length === 0 ? (
        <p style={{ color: '#b0b3bc', textAlign: 'center', padding: '0.5rem', fontSize: '0.9rem' }}>No appointments booked yet.</p>
      ) : (
        <ul style={{ maxHeight: 150, overflowY: 'auto', paddingRight: 8, listStyle: 'none', padding: 0 }}>
          {appointments.map(a => (
            <li key={a._id} style={{ background: 'rgba(127,90,240,0.10)', border: '1px solid rgba(127,90,240,0.15)', borderRadius: '8px', padding: '0.6rem 0.8rem', marginBottom: '0.5rem', color: '#f5f6fa', fontSize: '0.9rem' }}>
              {a.date ? new Date(a.date).toLocaleDateString() : ''} {a.time} with Dr. {a.doctor?.name || a.doctor} ({a.status})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AppointmentBooking;