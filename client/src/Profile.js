import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authFetch, getUser } from './utils';
import AnimatedText from './AnimatedText';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';

function Profile() {
  const user = useMemo(() => getUser(), []);
  const userId = user?._id || user?.id;
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', bloodGroup: '', allergies: '', chronicDiseases: '', emergencyContact: { name: '', phone: '', relation: '' } });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    authFetch(`/api/profile/${userId}`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          setProfile(data);
          setForm({
            name: data.name || '',
            bloodGroup: data.bloodGroup || '',
            allergies: (data.allergies || []).join(', '),
            chronicDiseases: (data.chronicDiseases || []).join(', '),
            emergencyContact: data.emergencyContact || { name: '', phone: '', relation: '' }
          });
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') console.error('Failed to fetch profile:', err);
      });

    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    document.title = 'Profile — Smart Health Record';
  }, []);

  const validate = () => {
    if (!form.name) return 'Name is required';
    return null;
  };

  const handleChange = e => {
    if (e.target.name.startsWith('emergencyContact.')) {
      setForm({
        ...form,
        emergencyContact: {
          ...form.emergencyContact,
          [e.target.name.split('.')[1]]: e.target.value
        }
      });
    } else {
      setForm({ ...form, [e.target.name]: e.target.value });
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    const error = validate();
    if (error) return setMessage(error);
    setLoading(true);
    try {
      const res = await authFetch(`/api/profile/update/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          bloodGroup: form.bloodGroup,
          allergies: form.allergies.split(',').map(a => a.trim()),
          chronicDiseases: form.chronicDiseases.split(',').map(c => c.trim()),
          emergencyContact: form.emergencyContact
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Profile updated!');
        setProfile(data);
        setEdit(false);
      } else {
        setMessage(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setMessage('Error updating profile');
    }
    setLoading(false);
  };

  const handleExport = async () => {
    try {
      const res = await authFetch(`/api/profile/export/${userId}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'records.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage('Error exporting records');
    }
  };

  if (!profile) {
    return (
      <>
        <div className="hero-animated-bg" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', flexDirection: 'column', gap: '1rem' }}>
          <div className="spinner" />
          <Typography variant="body1" sx={{ color: '#b7aaff' }}>Loading profile...</Typography>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hero-animated-bg" />
      <div style={{ maxWidth: 600, margin: '0 auto', paddingTop: '7rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
          <Button
            variant="text"
            onClick={() => navigate(-1)}
            sx={{ color: '#7f5af0', fontWeight: 600, fontSize: '1rem', minWidth: 'auto', mr: 1 }}
          >
            ← Back
          </Button>
          <AnimatedText typewriter={true} className="animated-text-color"><h2>Profile</h2></AnimatedText>
        </div>
        <Card elevation={3} sx={{ background: '#23272f !important', borderRadius: '16px', mt: 1, border: '1px solid rgba(127,90,240,0.15)' }}>
          <CardContent>
            {!edit ? (
              <Box>
                <Typography variant="body1" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}><span style={{ fontSize: '1.2rem' }}>👤</span> <b>Name:</b> {profile.name}</Typography>
                <Typography variant="body1" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}><span style={{ fontSize: '1.2rem' }}>📧</span> <b>Email:</b> {profile.email}</Typography>
                <Typography variant="body1" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}><span style={{ fontSize: '1.2rem' }}>🩸</span> <b>Blood Group:</b> {profile.bloodGroup || 'Not set'}</Typography>
                <Typography variant="body1" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}><span style={{ fontSize: '1.2rem' }}>⚠️</span> <b>Allergies:</b> {(profile.allergies || []).join(', ') || 'None'}</Typography>
                <Typography variant="body1" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}><span style={{ fontSize: '1.2rem' }}>🏥</span> <b>Chronic Diseases:</b> {(profile.chronicDiseases || []).join(', ') || 'None'}</Typography>
                <Typography variant="body1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}><span style={{ fontSize: '1.2rem' }}>📞</span> <b>Emergency Contact:</b> {profile.emergencyContact ? `${profile.emergencyContact.name} (${profile.emergencyContact.relation}) - ${profile.emergencyContact.phone}` : 'Not set'}</Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button variant="contained" onClick={() => setEdit(true)} sx={{ fontWeight: 600, background: 'linear-gradient(90deg, #7f5af0 0%, #00b4d8 100%)', '&:hover': { background: 'linear-gradient(90deg, #5f3dc4 0%, #0096c7 100%)' } }}>✏️ Edit Profile</Button>
                  <Button variant="outlined" onClick={handleExport} sx={{ fontWeight: 600, color: '#7f5af0', borderColor: '#7f5af0' }}>📥 Export Records</Button>
                </Box>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleUpdate}>
                <TextField name="name" label="Name" value={form.name} onChange={handleChange} fullWidth margin="normal" required />
                <TextField name="bloodGroup" label="Blood Group" value={form.bloodGroup} onChange={handleChange} fullWidth margin="normal" />
                <TextField name="allergies" label="Allergies (comma separated)" value={form.allergies} onChange={handleChange} fullWidth margin="normal" />
                <TextField name="chronicDiseases" label="Chronic Diseases (comma separated)" value={form.chronicDiseases} onChange={handleChange} fullWidth margin="normal" />
                <TextField name="emergencyContact.name" label="Emergency Contact Name" value={form.emergencyContact.name} onChange={handleChange} fullWidth margin="normal" />
                <TextField name="emergencyContact.phone" label="Emergency Contact Phone" value={form.emergencyContact.phone} onChange={handleChange} fullWidth margin="normal" />
                <TextField name="emergencyContact.relation" label="Emergency Contact Relation" value={form.emergencyContact.relation} onChange={handleChange} fullWidth margin="normal" />
                <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                  <Button type="submit" variant="contained" disabled={loading} sx={{ fontWeight: 600, background: 'linear-gradient(90deg, #7f5af0 0%, #00b4d8 100%)', '&:hover': { background: 'linear-gradient(90deg, #5f3dc4 0%, #0096c7 100%)' } }}>{loading ? '⏳ Saving...' : '✅ Save'}</Button>
                  <Button variant="outlined" onClick={() => setEdit(false)} sx={{ fontWeight: 600, color: '#7f5af0', borderColor: '#7f5af0' }}>❌ Cancel</Button>
                </Box>
              </Box>
            )}
            {message && <Alert severity={message.includes('updated') ? 'success' : 'error'} sx={{ mt: 2 }}>{message}</Alert>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default Profile;