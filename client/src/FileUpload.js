import React, { useState, useEffect } from 'react';
import { authFetch } from './utils';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';

function FileUpload({ isDoctor }) {
  const user = JSON.parse(localStorage.getItem('user'));
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({
    patientId: user.role === 'patient' ? user._id || user.id : '',
    doctorId: user._id || user.id,
    date: '',
    symptoms: '',
    diagnosis: '',
    doctorNotes: '',
    file: null
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatients = async () => {
      if (isDoctor) {
        try {
          const res = await authFetch(`/api/doctor/patients/${user._id || user.id}`);
          if (res.ok) {
            const data = await res.json();
            setPatients(data);
          }
        } catch (err) {
          console.log('Failed to fetch patients:', err);
          setPatients([]); // Set empty array if fails
        }
      }
    };
    
    fetchPatients();
  }, [isDoctor, user]);

  const validate = () => {
    if (isDoctor && !form.patientId) return 'Select a patient';
    if (!form.date) return 'Date is required';
    if (!form.symptoms) return 'Symptoms are required';
    if (!form.diagnosis) return 'Diagnosis is required';
    if (!form.file) return 'File is required';
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (form.file && !allowedTypes.includes(form.file.type)) return 'File must be PDF or image';
    return null;
  };

  const handleChange = e => {
    if (e.target.name === 'file') {
      setForm({ ...form, file: e.target.files[0] });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const error = validate();
    if (error) return setMessage(error);
    setLoading(true);
    const data = new FormData();
    data.append('patientId', form.patientId);
    data.append('doctorId', form.doctorId);
    data.append('date', form.date);
    data.append('symptoms', form.symptoms);
    data.append('diagnosis', form.diagnosis);
    data.append('doctorNotes', form.doctorNotes);
    if (form.file) data.append('file', form.file);
    try {
      const res = await authFetch('/api/medical-records/upload', {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (res.ok) setMessage('File uploaded successfully!');
      else setMessage(result.message || 'Upload failed');
    } catch (err) {
      setMessage('Error uploading file');
    }
    setLoading(false);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Upload Medical Record</Typography>
      <Box component="form" onSubmit={handleSubmit} encType="multipart/form-data" sx={{ width: '100%' }}>
        {isDoctor && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>Patient:</Typography>
            <Select
              id="patientId"
              name="patientId"
              value={form.patientId}
              onChange={handleChange}
              fullWidth
              required
              displayEmpty
            >
              <MenuItem value="">Select a patient</MenuItem>
              {patients.map(p => (
                <MenuItem key={p._id} value={p._id}>{p.name} ({p.email})</MenuItem>
              ))}
            </Select>
          </Box>
        )}
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
        />
        <TextField
          id="symptoms"
          name="symptoms"
          label="Symptoms"
          value={form.symptoms}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          id="diagnosis"
          name="diagnosis"
          label="Diagnosis"
          value={form.diagnosis}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          id="doctorNotes"
          name="doctorNotes"
          label="Doctor Notes"
          value={form.doctorNotes}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>File (PDF/Image):</Typography>
          <input
            id="file"
            type="file"
            name="file"
            accept=".pdf,image/*"
            onChange={handleChange}
            required
            style={{ display: 'block', marginTop: 4 }}
          />
        </Box>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading} sx={{ fontWeight: 600, fontSize: '1.05rem' }}>
          {loading ? 'Uploading...' : 'Upload'}
        </Button>
      </Box>
      {message && <Alert severity={message.includes('success') ? 'success' : 'error'} sx={{ mt: 2 }}>{message}</Alert>}
    </Box>
  );
}

FileUpload.propTypes = {
  isDoctor: PropTypes.bool,
};

export default FileUpload; 