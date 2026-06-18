import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authFetch } from './utils';
import './App.css';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AnimatedText from './AnimatedText';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    document.title = 'Sign In — Smart Health Record';
  }, []);

  const validate = () => {
    if (!email) return 'Email is required';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Enter a valid email';
    if (!password) return 'Password is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const error = validate();
    if (error) return setMessage(error);
    setLoading(true);
    try {
      const res = await authFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Login successful!');
        localStorage.setItem('user', JSON.stringify({ ...data.user, token: data.token }));
        // Redirect to intended page (if redirected from PrivateRoute) or dashboard
        const from = location.state?.from?.pathname;
        const defaultPath = data.user?.role === 'doctor' ? '/doctor' : '/patient';
        navigate(from || defaultPath, { replace: true });
      } else {
        setMessage(data.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage('Error connecting to server. Please check if backend is running.');
    }
    setLoading(false);
  };

  return (
    <>
      <div className="hero-animated-bg" />
      <div className="auth-card-wrapper" style={{ marginTop: '6rem' }}>
        <Box className="auth-card">
          <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
            <AnimatedText typewriter={true} className="animated-text-color"><span role="img" aria-label="lock">🔒</span> Sign In</AnimatedText>
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', mt: 1 }}>
            <TextField
              id="email"
              label="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              fullWidth
              margin="normal"
              required
              InputProps={{ startAdornment: <span role="img" aria-label="email">📧</span> }}
            />
            <TextField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              fullWidth
              margin="normal"
              required
              InputProps={{ startAdornment: <span role="img" aria-label="lock">🔒</span> }}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2, fontWeight: 600, fontSize: '1.1rem' }}
              disabled={loading}
              startIcon={loading ? null : <span role="img" aria-label="rocket">🚀</span>}
            >
              {loading ? '⏳ Signing In...' : 'Sign In'}
            </Button>
          </Box>
          {message && (
            <Alert severity={message.includes('successful') ? 'success' : 'error'} sx={{ mt: 2 }}>{message}</Alert>
          )}
          <Box className="nav-links" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <Link to="/forgot-password">🔑 Forgot Password?</Link>
            </Typography>
            <Typography variant="body2">
              Don&apos;t have an account? <Link to="/register">Create Account Here</Link>
            </Typography>
          </Box>
        </Box>
      </div>
    </>
  );
}

export default Login; 