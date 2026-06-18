import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authFetch } from './utils';
import './App.css';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AnimatedText from './AnimatedText';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  React.useEffect(() => {
    document.title = 'Create Account — Smart Health Record';
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) newErrors.email = 'Invalid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setLoading(true);
    try {
      const res = await authFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        setMessage(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setMessage('Error connecting to server. Please check if backend is running.');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="hero-animated-bg" />
      <div className="auth-card-wrapper">
        <div className="auth-card">
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            <AnimatedText typewriter={true} className="animated-text-color">📝 Create Account</AnimatedText>
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
            <TextField
              id="name"
              label="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your full name"
              fullWidth
              margin="normal"
              required
              error={!!errors.name}
              helperText={errors.name}
              InputProps={{ startAdornment: <span role="img" aria-label="user">👤</span> }}
            />
            <TextField
              id="email"
              label="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              fullWidth
              margin="normal"
              required
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{ startAdornment: <span role="img" aria-label="email">📧</span> }}
            />
            <TextField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password (min 6 characters)"
              fullWidth
              margin="normal"
              required
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{ startAdornment: <span role="img" aria-label="lock">🔒</span> }}
            />
            <Box sx={{ mt: 2, mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                👨‍⚕️ Account Type:
              </Typography>
              <Select
                id="role"
                value={role}
                onChange={e => setRole(e.target.value)}
                fullWidth
              >
                <MenuItem value="patient">🧑‍🤝‍🧑 Patient</MenuItem>
                <MenuItem value="doctor">👨‍⚕️ Doctor</MenuItem>
              </Select>
            </Box>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, fontWeight: 600, fontSize: '1.1rem' }}
              disabled={loading}
              startIcon={loading ? null : <span role="img" aria-label="sparkles">✨</span>}
            >
              {loading ? '⏳ Creating Account...' : 'Create Account'}
            </Button>
          </Box>
          {message && <Alert severity={message.includes('successful') ? 'success' : 'error'} sx={{ mt: 2 }}>{message}</Alert>}
          <Box className="nav-links" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Already have an account? <Link to="/login">Sign In Here</Link>
            </Typography>
          </Box>
        </div>
      </div>
    </>
  );
}

export default Register; 