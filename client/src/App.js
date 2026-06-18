import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import PropTypes from 'prop-types';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import Fade from '@mui/material/Fade';
import ScrollToTop from './ScrollToTop';
import Button from '@mui/material/Button';
import AnimatedText from './AnimatedText';
import { getUser } from './utils';

// ─── Lazy Loading: Code-split each route for faster initial load ───
const Login = React.lazy(() => import('./Login'));
const Register = React.lazy(() => import('./Register'));
const PatientDashboard = React.lazy(() => import('./PatientDashboard'));
const DoctorPanel = React.lazy(() => import('./DoctorPanel'));
const Profile = React.lazy(() => import('./Profile'));
const ForgotPassword = React.lazy(() => import('./ForgotPassword'));
const ResetPassword = React.lazy(() => import('./ResetPassword'));
const AIChatbot = React.lazy(() => import('./AIChatbot'));

// ─── Loading Fallback Component ───
function LoadingFallback() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div className="spinner" />
      <p style={{ color: '#b7aaff', fontSize: '1.1rem' }}>Loading...</p>
    </div>
  );
}

function Home() {
  const [faqOpen, setFaqOpen] = React.useState([false, false, false, false, false, false]);

  React.useEffect(() => {
    document.title = 'Smart Health Record — Your Digital Health Platform';
  }, []);

  const toggleFAQ = (index) => {
    setFaqOpen(prev => {
      const newState = [...prev];
      newState[index] = !newState[index];
      return newState;
    });
  };

  React.useEffect(() => {
    const observerOptions = {
      threshold: 0.5,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const statNumbers = entry.target.querySelectorAll('.stat-number');
          statNumbers.forEach(statNumber => {
            const target = parseInt(statNumber.getAttribute('data-target'));
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;
            
            const timer = setInterval(() => {
              current += increment;
              if (current >= target) {
                current = target;
                clearInterval(timer);
              }
              statNumber.textContent = Math.floor(current).toLocaleString();
            }, 16);
          });
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
      observer.observe(statsSection);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="hero-animated-bg" />
      <div className="landing-container fade-in slide-in-up">
        <div className="hero-content">
          <div className="hero-text">
            <h2 className="hero-headline"><AnimatedText className="animated-text-color">Your Health Records, Simplified.</AnimatedText></h2>
            <p className="tagline"><AnimatedText>Securely manage your medical records, appointments, and health information — all in one place.</AnimatedText></p>
            <div className="hero-cta-group">
              <Link to="/register" className="cta-button primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <span>Get Started Free</span>
                <span>🚀</span>
              </Link>
              <Link to="/login" className="cta-button secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                <span>Sign In</span>
                <span>→</span>
              </Link>
            </div>
            <div className="intro-section" style={{ marginTop: '2rem' }}>
              <h2><AnimatedText>What is Smart Health Record?</AnimatedText></h2>
              <p>
                <AnimatedText><b>Smart Health Record</b> is a digital platform to securely manage your medical records, appointments, and health information. Patients and doctors can easily access, upload, and share health data anytime, anywhere.</AnimatedText>
              </p>
            </div>
          </div>
          
          <div className="hero-illustration">
            <svg width="400" height="400" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Background Circle */}
              <circle cx="200" cy="200" r="180" fill="url(#gradient1)" opacity="0.1"/>
              
              {/* Medical Cross */}
              <g transform="translate(200, 200)">
                <rect x="-15" y="-60" width="30" height="120" rx="5" fill="url(#gradient2)"/>
                <rect x="-60" y="-15" width="120" height="30" rx="5" fill="url(#gradient2)"/>
              </g>
              
              {/* Heart */}
              <path d="M200 280 Q160 240 140 260 Q120 280 200 320 Q280 280 260 260 Q240 240 200 280" fill="url(#gradient3)"/>
              
              {/* Pulse Lines */}
              <g stroke="url(#gradient4)" strokeWidth="3" fill="none">
                <path d="M80 150 Q100 130 120 150 Q140 170 160 150 Q180 130 200 150 Q220 170 240 150 Q260 130 280 150 Q300 170 320 150" opacity="0.8"/>
                <path d="M80 180 Q100 160 120 180 Q140 200 160 180 Q180 160 200 180 Q220 200 240 180 Q260 160 280 180 Q300 200 320 180" opacity="0.6"/>
              </g>
              
              {/* Floating Dots */}
              <circle cx="100" cy="100" r="4" fill="url(#gradient5)">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="300" cy="120" r="3" fill="url(#gradient5)">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="80" cy="300" r="5" fill="url(#gradient5)">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="2.5s" repeatCount="indefinite"/>
              </circle>
              <circle cx="320" cy="280" r="3" fill="url(#gradient5)">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="1.8s" repeatCount="indefinite"/>
              </circle>
              
              {/* Gradients */}
              <defs>
                <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea"/>
                  <stop offset="100%" stopColor="#764ba2"/>
                </linearGradient>
                <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4fc3f7"/>
                  <stop offset="100%" stopColor="#29b6f6"/>
                </linearGradient>
                <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f06292"/>
                  <stop offset="100%" stopColor="#e91e63"/>
                </linearGradient>
                <linearGradient id="gradient4" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#81c784"/>
                  <stop offset="100%" stopColor="#66bb6a"/>
                </linearGradient>
                <linearGradient id="gradient5" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffd54f"/>
                  <stop offset="100%" stopColor="#ffb300"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
        
        <div className="news-banner">
          <div className="news-icon">📢</div>
          <div className="news-ticker">
            <div className="ticker-content">
              <span className="news-item">🚀 New: AI-powered symptom analysis now available!</span>
              <span className="news-item">🔒 Enhanced security with biometric authentication</span>
              <span className="news-item">📱 Mobile app now available on iOS and Android</span>
              <span className="news-item">🏥 Partnered with 50+ new hospitals this month</span>
              <span className="news-item">⚡ Lightning-fast upload speeds with new compression</span>
              <span className="news-item">🎉 10,000+ new users joined this week!</span>
            </div>
          </div>
        </div>
        
        <div className="social-proof-section">
          <h2><AnimatedText>Trusted by Healthcare Professionals</AnimatedText></h2>
          <div className="trust-badges">
            <div className="trust-badge">
              <div className="badge-icon">🏆</div>
              <h3><AnimatedText>HIPAA Compliant</AnimatedText></h3>
              <p><AnimatedText>100% compliant with healthcare data regulations</AnimatedText></p>
            </div>
            <div className="trust-badge">
              <div className="badge-icon">🔐</div>
              <h3><AnimatedText>ISO 27001</AnimatedText></h3>
              <p><AnimatedText>International security standard certified</AnimatedText></p>
            </div>
            <div className="trust-badge">
              <div className="badge-icon">🛡️</div>
              <h3><AnimatedText>End-to-End Encryption</AnimatedText></h3>
              <p><AnimatedText>Military-grade AES-256 encryption</AnimatedText></p>
            </div>
            <div className="trust-badge">
              <div className="badge-icon">✅</div>
              <h3><AnimatedText>FDA Approved</AnimatedText></h3>
              <p><AnimatedText>Cleared for medical device integration</AnimatedText></p>
            </div>
          </div>
          
          <div className="trusted-by">
            <h3><AnimatedText>Trusted by Leading Healthcare Institutions</AnimatedText></h3>
            <div className="hospital-logos">
              <div className="hospital-logo"><AnimatedText>🏥 Mayo Clinic</AnimatedText></div>
              <div className="hospital-logo"><AnimatedText>🏥 Johns Hopkins</AnimatedText></div>
              <div className="hospital-logo"><AnimatedText>🏥 Cleveland Clinic</AnimatedText></div>
              <div className="hospital-logo"><AnimatedText>🏥 Stanford Health</AnimatedText></div>
              <div className="hospital-logo"><AnimatedText>🏥 Massachusetts General</AnimatedText></div>
              <div className="hospital-logo"><AnimatedText>🏥 UCLA Medical</AnimatedText></div>
            </div>
            <p className="trust-stats"><AnimatedText>+500 hospitals and clinics trust Smart Health Record</AnimatedText></p>
          </div>
        </div>
        
        <div className="features-section">
          <h2>Why use Smart Health Record?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure</h3>
              <p>Your health data is encrypted and protected with industry-standard security measures</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Easy Access</h3>
              <p>Access your medical records anytime, anywhere with our user-friendly interface</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Doctor-Patient Collaboration</h3>
              <p>Seamless communication and data sharing between healthcare providers and patients</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏰</div>
              <h3>24x7 Availability</h3>
              <p>Round-the-clock access to your health information whenever you need it</p>
            </div>
          </div>
        </div>
        
        <div className="demo-section">
          <h2>See it in Action</h2>
          <p className="demo-subtitle">Watch how Smart Health Record simplifies your medical data management</p>
          <div className="demo-container">
            <div className="demo-video-container">
              <div className="demo-screenshots">
                <div className="screenshot screenshot-1">
                  <div className="screenshot-content">
                    <div className="app-header-demo">
                      <span>🏥 Smart Health Record</span>
                    </div>
                    <div className="demo-dashboard">
                      <div className="demo-card">
                        <div className="demo-icon">📋</div>
                        <span>Medical Records</span>
                      </div>
                      <div className="demo-card">
                        <div className="demo-icon">📅</div>
                        <span>Appointments</span>
                      </div>
                      <div className="demo-card">
                        <div className="demo-icon">👨‍⚕️</div>
                        <span>Doctors</span>
                      </div>
                      <div className="demo-card">
                        <div className="demo-icon">📊</div>
                        <span>Analytics</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="screenshot screenshot-2">
                  <div className="screenshot-content">
                    <div className="app-header-demo">
                      <span>📋 Upload Records</span>
                    </div>
                    <div className="upload-demo">
                      <div className="upload-area">
                        <div className="upload-icon">📤</div>
                        <span>Drag & Drop Files Here</span>
                        <div className="upload-progress">
                          <div className="progress-bar"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="screenshot screenshot-3">
                  <div className="screenshot-content">
                    <div className="app-header-demo">
                      <span>🔒 Secure Sharing</span>
                    </div>
                    <div className="share-demo">
                      <div className="share-card">
                        <div className="share-icon">👨‍⚕️</div>
                        <span>Dr. Sarah Johnson</span>
                        <div className="share-status">Shared ✓</div>
                      </div>
                      <div className="share-card">
                        <div className="share-icon">🏥</div>
                        <span>City General Hospital</span>
                        <div className="share-status">Shared ✓</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="play-button-overlay">
                <div className="play-icon">▶️</div>
                <span>Watch Demo</span>
              </div>
            </div>
            <div className="demo-features">
              <div className="demo-feature">
                <div className="demo-feature-icon">⚡</div>
                <h3>Lightning Fast</h3>
                <p>Upload and access records in seconds</p>
              </div>
              <div className="demo-feature">
                <div className="demo-feature-icon">🔐</div>
                <h3>Bank-Level Security</h3>
                <p>Your data is protected with military-grade encryption</p>
              </div>
              <div className="demo-feature">
                <div className="demo-feature-icon">📱</div>
                <h3>Mobile Optimized</h3>
                <p>Works perfectly on all devices</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="stats-section">
          <h2>Our Impact in Numbers</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-number" data-target="15000">0</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📋</div>
              <div className="stat-number" data-target="50000">0</div>
              <div className="stat-label">Records Managed</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👨‍⚕️</div>
              <div className="stat-number" data-target="500">0</div>
              <div className="stat-label">Doctors Registered</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏥</div>
              <div className="stat-number" data-target="100">0</div>
              <div className="stat-label">Hospitals Partnered</div>
            </div>
          </div>
        </div>
        
        <div className="how-it-works-section">
          <h2>How It Works</h2>
          <p className="section-subtitle">Simple 4-step process to manage your health records</p>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-icon">📤</div>
              <h3>Upload</h3>
              <p>Upload your medical records, test results, and health documents securely</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-icon">🔒</div>
              <h3>Secure</h3>
              <p>Your data is encrypted with military-grade security and stored safely</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-icon">📤</div>
              <h3>Share</h3>
              <p>Share records with doctors, hospitals, or family members with one click</p>
            </div>
            <div className="step-arrow">→</div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-icon">📱</div>
              <h3>Access</h3>
              <p>Access your complete health history anytime, anywhere on any device</p>
            </div>
          </div>
        </div>
        
        <div className="testimonials-section">
          <h2>What our users say</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="quote-icon">💬</div>
              <blockquote>
                &ldquo;Smart Health Record has revolutionized how I manage my family&apos;s medical information. Everything is now just a click away!&rdquo;
              </blockquote>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍⚕️</div>
                <div className="author-info">
                  <h4>Dr. Sarah Johnson</h4>
                  <p>Family Physician</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="quote-icon">💬</div>
              <blockquote>
                &ldquo;As a patient, I love how easy it is to share my records with different doctors. No more carrying around paper files!&rdquo;
              </blockquote>
              <div className="testimonial-author">
                <div className="author-avatar">👨‍🦳</div>
                <div className="author-info">
                  <h4>Robert Chen</h4>
                  <p>Patient</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="quote-icon">💬</div>
              <blockquote>
                &ldquo;The security features give me peace of mind knowing my sensitive health data is protected. Highly recommended!&rdquo;
              </blockquote>
              <div className="testimonial-author">
                <div className="author-avatar">👩‍💼</div>
                <div className="author-info">
                  <h4>Emily Rodriguez</h4>
                  <p>Healthcare Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="faq-section">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-container">
            <div className="faq-item">
              <button className="faq-question" onClick={() => toggleFAQ(0)}>
                <span>How secure is my health data?</span>
                <span className="faq-icon">+</span>
              </button>
              <div className={`faq-answer ${faqOpen[0] ? 'open' : ''}`}>
                <p>Your health data is protected with military-grade AES-256 encryption, HIPAA compliance, and ISO 27001 certification. We use end-to-end encryption, meaning your data is encrypted before it leaves your device and remains encrypted in transit and at rest. Only you and authorized healthcare providers can access your information.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={() => toggleFAQ(1)}>
                <span>Can I share my records with multiple doctors?</span>
                <span className="faq-icon">+</span>
              </button>
              <div className={`faq-answer ${faqOpen[1] ? 'open' : ''}`}>
                <p>Yes! You have complete control over who can access your medical records. You can share specific records or your entire health history with any healthcare provider. Each sharing action is logged, and you can revoke access at any time. This makes it easy to get second opinions or switch doctors without losing your medical history.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={() => toggleFAQ(2)}>
                <span>What types of medical records can I upload?</span>
                <span className="faq-icon">+</span>
              </button>
              <div className={`faq-answer ${faqOpen[2] ? 'open' : ''}`}>
                <p>You can upload virtually any type of medical document: lab results, imaging reports, prescriptions, vaccination records, medical certificates, insurance documents, and more. We support PDF, JPG, PNG, and other common file formats. Our AI automatically categorizes and organizes your documents for easy access.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={() => toggleFAQ(3)}>
                <span>Is Smart Health Record free to use?</span>
                <span className="faq-icon">+</span>
              </button>
              <div className={`faq-answer ${faqOpen[3] ? 'open' : ''}`}>
                <p>We offer a free tier with basic features and 1GB storage. Premium plans start at $9.99/month and include unlimited storage, advanced AI features, priority support, and family accounts. Healthcare providers have special enterprise plans with additional features for managing multiple patients.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={() => toggleFAQ(4)}>
                <span>What if I lose my phone or device?</span>
                <span className="faq-icon">+</span>
              </button>
              <div className={`faq-answer ${faqOpen[4] ? 'open' : ''}`}>
                <p>Your data is safely stored in the cloud, so you can access it from any device. Simply log in to your account from a new device, and all your records will be available. We also offer two-factor authentication and biometric login options for additional security.</p>
              </div>
            </div>
            
            <div className="faq-item">
              <button className="faq-question" onClick={() => toggleFAQ(5)}>
                <span>How do I get started with Smart Health Record?</span>
                <span className="faq-icon">+</span>
              </button>
              <div className={`faq-answer ${faqOpen[5] ? 'open' : ''}`}>
                <p>Getting started is easy! Simply create an account, verify your email, and start uploading your medical records. You can import existing records from your current healthcare providers or upload documents manually. Our AI will help organize everything automatically.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="cta-section">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of users who trust Smart Health Record for their medical data management</p>
          <div className="cta-buttons">
            <Link to="/register" className="cta-button primary">
              <span>Get Started Now</span>
              <span className="cta-icon">🚀</span>
            </Link>
            <Link to="/login" className="cta-button secondary">
              <span>Already have an account?</span>
              <span className="cta-icon">→</span>
            </Link>
          </div>
        </div>
        
        <footer className="footer">
          <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} Smart Health Record</p>
            <div className="footer-links">
              <Link to="/" className="footer-link">Privacy Policy</Link>
              <span className="footer-separator">|</span>
              <Link to="/" className="footer-link">Contact Us</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function LoginWithForgot() {
  return <Login />;
}

// ─── Auth Route Guards (Industry Standard) ───

/**
 * PrivateRoute — Protects routes that require authentication.
 * - Not logged in → Redirect to /login (saves intended destination)
 * - Wrong role → Redirect to correct dashboard
 */
function PrivateRoute({ children, role }) {
  const user = getUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role && user.role !== role) {
    // Redirect to correct dashboard instead of dead-end
    const correctPath = user.role === 'doctor' ? '/doctor' : '/patient';
    return <Navigate to={correctPath} replace />;
  }
  return children;
}

PrivateRoute.propTypes = {
  children: PropTypes.node,
  role: PropTypes.string,
};

/**
 * GuestRoute — Protects routes that should only be visible to non-logged-in users.
 * - Logged in → Redirect to dashboard
 * - Not logged in → Show the page
 */
function GuestRoute({ children }) {
  const user = getUser();
  if (user) {
    const dashboardPath = user.role === 'doctor' ? '/doctor' : '/patient';
    return <Navigate to={dashboardPath} replace />;
  }
  return children;
}

GuestRoute.propTypes = {
  children: PropTypes.node,
};

/**
 * HomeRoute — Landing page logic:
 * - Logged in → Redirect to dashboard (don't show marketing page)
 * - Not logged in → Show the landing/marketing page
 */
function HomeRoute() {
  const user = getUser();
  if (user) {
    const dashboardPath = user.role === 'doctor' ? '/doctor' : '/patient';
    return <Navigate to={dashboardPath} replace />;
  }
  return <div className="main-content center-content home-page"><Home /></div>;
}

function App() {
  const theme = React.useMemo(() => createTheme({
    palette: {
      primary: { main: '#764ba2' },
      secondary: { main: '#667eea' },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  }), []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <ScrollToTop />
        <AppWithFade />
      </Router>
    </ThemeProvider>
  );
}

function AppWithFade() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isPatient = user && user.role === 'patient';
  const isDoctor = user && user.role === 'doctor';
  const dashboardPath = isDoctor ? '/doctor' : '/patient';

  return (
    <div className="App">
      <div className="app-header">
        <div className="header-left">
          <h1>
            <Link to={user ? dashboardPath : '/'} style={{ color: '#fff', textDecoration: 'none' }}>
              🏥 Smart Health Record
            </Link>
          </h1>
          {user && (
            <span className="accent-welcome">
              {isDoctor ? `Dr. ${user.name}` : user.name} 👋
            </span>
          )}
        </div>
        <div className="header-nav">
          {user && (
            <>
              <Button
                className={`header-nav-btn ${location.pathname === dashboardPath ? 'active' : ''}`}
                onClick={() => navigate(dashboardPath)}
              >
                📊 Dashboard
              </Button>
              <Button
                className={`header-nav-btn ${location.pathname === '/profile' ? 'active' : ''}`}
                onClick={() => navigate('/profile')}
              >
                👤 Profile
              </Button>
              {isPatient && (
                <Button
                  className={`header-nav-btn ${location.pathname === '/ai-chatbot' ? 'active' : ''}`}
                  onClick={() => navigate('/ai-chatbot')}
                >
                  🤖 AI Chat
                </Button>
              )}
              <Button
                className="header-nav-btn logout-btn"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          )}
          {!user && (
            <>
              <Button
                className={`header-nav-btn ${location.pathname === '/login' ? 'active' : ''}`}
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                className={`header-nav-btn ${location.pathname === '/register' ? 'active' : ''}`}
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>
      <Fade in={true} timeout={500} key={location.key}>
        <div>
          <Suspense fallback={<LoadingFallback />}>
            <Routes location={location}>
              {/* Public — Landing page (redirects to dashboard if logged in) */}
              <Route path="/" element={<HomeRoute />} />

              {/* Guest-only — Login/Register (redirects to dashboard if already logged in) */}
              <Route path="/login" element={<GuestRoute><div className="main-content center-content login-page"><LoginWithForgot /></div></GuestRoute>} />
              <Route path="/register" element={<GuestRoute><div className="main-content center-content"><Register /></div></GuestRoute>} />
              <Route path="/forgot-password" element={<GuestRoute><div className="main-content center-content"><ForgotPassword /></div></GuestRoute>} />
              <Route path="/reset-password/:token" element={<div className="main-content center-content"><ResetPassword /></div>} />

              {/* Private — Requires authentication */}
              <Route path="/patient" element={<div className="main-content left-content"><PrivateRoute role="patient"><PatientDashboard /></PrivateRoute></div>} />
              <Route path="/doctor" element={<div className="main-content left-content"><PrivateRoute role="doctor"><DoctorPanel /></PrivateRoute></div>} />
              <Route path="/profile" element={<div className="main-content left-content"><PrivateRoute><Profile /></PrivateRoute></div>} />
              <Route path="/ai-chatbot" element={<PrivateRoute><AIChatbot /></PrivateRoute>} />

              {/* Catch-all — Redirect unknown routes */}
              <Route path="*" element={<Navigate to={user ? dashboardPath : '/'} replace />} />
            </Routes>
          </Suspense>
        </div>
      </Fade>
    </div>
  );
}

export default App;
