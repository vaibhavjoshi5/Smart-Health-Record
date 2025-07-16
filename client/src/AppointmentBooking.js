import React, { useEffect, useState } from 'react';
import { authFetch } from './utils';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';

function AppointmentBooking() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState({ doctorId: '', date: '', time: '' });
  const [message, setMessage] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch all doctors with error handling
      try {
        const res = await authFetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setDoctors(data.filter(u => u.role === 'doctor'));
          }
        }
      } catch (err) {
        console.log('Failed to fetch doctors:', err);
        setDoctors([]); // Set empty array if fails
      }
      
      // Fetch patient's appointments with error handling
      try {
        const res = await authFetch(`/api/appointment/patient/${user._id || user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch (err) {
        console.log('Failed to fetch appointments:', err);
        setAppointments([]); // Set empty array if fails
      }
    };
    
    fetchData();
  }, [user]);

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
        body: JSON.stringify({ ...form, patientId: user._id || user.id })
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
    <div style={{ height: 600, overflowY: 'auto' }}>
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
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', borderRadius: 6, background: '#7c4dff', color: '#fff', border: '2px solid red', fontWeight: 'bold', cursor: 'pointer', marginTop: 8 }}>
          {loading ? 'Booking...' : 'Book'}
        </button>
      </form>
      {message && <p style={{ color: message.includes('booked') ? 'green' : 'red' }}>{message}</p>}
      <h4>Your Appointments</h4>
      <ul style={{ maxHeight: 120, overflowY: 'auto', paddingRight: 8 }}>
        {appointments.map(a => (
          <li key={a._id}>
            {a.date ? new Date(a.date).toLocaleDateString() : ''} {a.time} with Dr. {a.doctor?.name || a.doctor} ({a.status})
          </li>
        ))}
      </ul>
    </div>
  );
}

/* Date/Time input icon color fix for dark mode */
const style = document.createElement('style');
style.innerHTML = `
  input[type="date"]::-webkit-calendar-picker-indicator,
  input[type="time"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
`;
document.head.appendChild(style);

export default AppointmentBooking; 