import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AnimatedText from './AnimatedText';
import './App.css';

function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const error = validate();
    if (error) return setMessage(error);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setMessage('Error resetting password');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="hero-animated-bg" />
      <div className="auth-card-wrapper" style={{ marginTop: '10rem' }}>
        <Box className="auth-card">
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
            <AnimatedText typewriter={true} className="animated-text-color">🔐 Reset Password</AnimatedText>
          </Typography>
          {success ? (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="h3" sx={{ mb: 2 }}>✅</Typography>
              <Alert severity="success" sx={{ mt: 1 }}>{message}</Alert>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.8, textAlign: 'center' }}>
                Enter your new password below.
              </Typography>
              <TextField
                id="password"
                label="New Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                fullWidth
                margin="normal"
                required
                InputProps={{ startAdornment: <span role="img" aria-label="lock">🔒</span> }}
              />
              <TextField
                id="confirmPassword"
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                fullWidth
                margin="normal"
                required
                InputProps={{ startAdornment: <span role="img" aria-label="check">✅</span> }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2, fontWeight: 600, fontSize: '1.1rem' }}
                disabled={loading}
                startIcon={loading ? null : <span role="img" aria-label="key">🔑</span>}
              >
                {loading ? '⏳ Resetting...' : 'Set New Password'}
              </Button>
            </Box>
          )}
          {message && !success && (
            <Alert severity="error" sx={{ mt: 2 }}>{message}</Alert>
          )}
          <Box className="nav-links" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <Link to="/login">← Back to Sign In</Link>
            </Typography>
          </Box>
        </Box>
      </div>
    </>
  );
}

export default ResetPassword;