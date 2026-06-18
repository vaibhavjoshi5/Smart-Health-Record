import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AnimatedText from './AnimatedText';
import './App.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    document.title = 'Forgot Password — Smart Health Record';
  }, []);

  const validate = () => {
    if (!email) return 'Email is required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Enter a valid email';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const error = validate();
    if (error) return setMessage(error);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
        setMessage('Password reset email sent! Check your inbox.');
      } else {
        setMessage(data.message || 'Failed to send email');
      }
    } catch (err) {
      setMessage('Error sending email');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="hero-animated-bg" />
      <div className="auth-card-wrapper" style={{ marginTop: '6rem' }}>
        <Box className="auth-card">
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
            <AnimatedText typewriter={true} className="animated-text-color">🔑 Forgot Password</AnimatedText>
          </Typography>
          {sent ? (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="h3" sx={{ mb: 2 }}>📧</Typography>
              <Alert severity="success" sx={{ mt: 1 }}>{message}</Alert>
              <Box className="nav-links" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <Link to="/login">← Back to Sign In</Link>
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
              <Typography variant="body2" sx={{ mb: 2, opacity: 0.8, textAlign: 'center' }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </Typography>
              <TextField
                id="email"
                label="Email Address"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email"
                fullWidth
                margin="normal"
                required
                InputProps={{ startAdornment: <span role="img" aria-label="email">📧</span> }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2, fontWeight: 600, fontSize: '1.1rem' }}
                disabled={loading}
                startIcon={loading ? null : <span role="img" aria-label="send">📤</span>}
              >
                {loading ? '⏳ Sending...' : 'Send Reset Link'}
              </Button>
            </Box>
          )}
          {message && !sent && (
            <Alert severity="error" sx={{ mt: 2 }}>{message}</Alert>
          )}
          {!sent && (
            <Box className="nav-links" sx={{ mt: 2 }}>
              <Typography variant="body2">
                Remember your password? <Link to="/login">Sign In Here</Link>
              </Typography>
            </Box>
          )}
        </Box>
      </div>
    </>
  );
}

export default ForgotPassword;