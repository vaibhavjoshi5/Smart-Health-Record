import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import AppointmentBooking from './AppointmentBooking';
import { authFetch, getUser } from './utils';
import './App.css';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import AnimatedText from './AnimatedText';

function PatientDashboard() {
  const user = useMemo(() => getUser(), []);
  const userId = user?._id || user?.id;
  const navigate = useNavigate();
  
  const [timeline, setTimeline] = useState([]);
  const [searchDate, setSearchDate] = useState('');
  const [searchSymptom, setSearchSymptom] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [graphs, setGraphs] = useState({ bp: [], sugar: [] });
  const [emergencyContact, setEmergencyContact] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    document.title = 'Patient Dashboard — Smart Health Record';
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchAll = async () => {
      const startTime = Date.now();

      // ⚡ Parallel fetch with Promise.allSettled - 3x faster than sequential
      const [timelineResult, graphsResult, contactResult] = await Promise.allSettled([
        authFetch(`/api/patient/timeline/${userId}`, { signal }).then(r => r.ok ? r.json() : []),
        authFetch(`/api/patient/health-graphs/${userId}`, { signal }).then(r => r.ok ? r.json() : { bp: [], sugar: [] }),
        authFetch(`/api/patient/emergency-contact/${userId}`, { signal }).then(r => r.ok ? r.json() : null),
      ]);

      // Process results - each can succeed/fail independently
      if (timelineResult.status === 'fulfilled') setTimeline(timelineResult.value);
      if (graphsResult.status === 'fulfilled') setGraphs(graphsResult.value);
      if (contactResult.status === 'fulfilled') setEmergencyContact(contactResult.value);

      // Ensure minimum loading time to prevent flash
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(400 - elapsed, 0);
      setTimeout(() => setVisible(true), remaining);
    };

    fetchAll().catch(() => {
      setTimeout(() => setVisible(true), 400);
    });

    return () => controller.abort(); // Cleanup on unmount
  }, [userId]);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      let url = `/api/patient/search/${userId}?`;
      if (searchDate) url += `date=${searchDate}&`;
      if (searchSymptom) url += `symptom=${searchSymptom}`;
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <>
      <div className="hero-animated-bg" />
      <div style={{ width: '100%', opacity: visible ? 1 : 0, transition: 'opacity 0.6s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginTop: '0.5rem', marginBottom: '1rem' }}>
          <AnimatedText typewriter={true} className="animated-text-color"><h2>Patient Dashboard</h2></AnimatedText>
        </div>
        <div className="dashboard-grid">
          {/* Upload Medical Documents */}
          <div>
            <Card className="dashboard-card-equal" elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>📄 Upload Medical Documents</Typography>
                <FileUpload isDoctor={false} />
              </CardContent>
            </Card>
          </div>
          {/* Medical Timeline */}
          <div>
            <Card className="dashboard-card-equal" elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>📅 Medical Timeline</Typography>
                {timeline.length > 0 ? (
                  <Box component="ul" sx={{ listStyle: 'none', p: 0 }}>
                    {timeline.map(r => (
                      <Box component="li" key={r._id} sx={{ mb: 1.5, p: 1.2, bgcolor: 'rgba(127,90,240,0.10)', borderRadius: 2, border: '1px solid rgba(127,90,240,0.15)' }}>
                        <Typography variant="subtitle2">📅 {new Date(r.date).toLocaleDateString()}</Typography>
                        <Typography variant="body2">🩺 {r.symptoms}</Typography>
                        <Typography variant="body2">💊 {r.diagnosis}</Typography>
                        <Typography variant="body2">👨‍⚕️ Dr. {r.doctor?.name}</Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">No medical records yet. Upload your first document!</Alert>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Search Medical Records */}
          <div>
            <Card className="dashboard-card-equal" elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>🔍 Search Medical Records</Typography>
                <Box component="form" onSubmit={handleSearch} sx={{ mb: 2 }}>
                  <TextField
                    label="Date"
                    type="date"
                    value={searchDate}
                    onChange={e => setSearchDate(e.target.value)}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Symptom"
                    value={searchSymptom}
                    onChange={e => setSearchSymptom(e.target.value)}
                    placeholder="Enter symptom"
                    fullWidth
                    margin="normal"
                  />
                  <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 1 }} startIcon={<span role="img" aria-label="search">🔍</span>}>
                    Search
                  </Button>
                </Box>
                {searchResults.length > 0 && (
                  <Box component="ul" sx={{ listStyle: 'none', p: 0, mt: 2 }}>
                    {searchResults.map(r => (
                      <Box component="li" key={r._id} sx={{ mb: 1, p: 1.2, bgcolor: 'rgba(0,180,216,0.10)', borderRadius: 2, border: '1px solid rgba(0,180,216,0.15)' }}>
                        <Typography variant="subtitle2">📅 {new Date(r.date).toLocaleDateString()}</Typography>
                        <Typography variant="body2">🩺 {r.symptoms}</Typography>
                        <Typography variant="body2">💊 {r.diagnosis}</Typography>
                        <Typography variant="body2">👨‍⚕️ Dr. {r.doctor?.name}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Health Monitoring */}
          <div>
            <Card className="dashboard-card-equal" elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>🩸 Health Monitoring</Typography>
                <Typography variant="subtitle2" color="text.secondary">Blood Pressure:</Typography>
                {graphs.bp.length > 0 ? (
                  <Typography variant="body2">{graphs.bp[graphs.bp.length-1].value} mmHg</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">No BP records yet</Typography>
                )}
                <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Blood Sugar:</Typography>
                {graphs.sugar.length > 0 ? (
                  <Typography variant="body2">{graphs.sugar[graphs.sugar.length-1].value} mg/dL</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">No sugar records yet</Typography>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Emergency Contact */}
          <div>
            <Card className="dashboard-card-equal" elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>📞 Emergency Contact</Typography>
                {emergencyContact ? (
                  <>
                    <Typography variant="subtitle2">{emergencyContact.name}</Typography>
                    <Typography variant="body2">{emergencyContact.phone}</Typography>
                  </>
                ) : (
                  <Typography variant="body2" color="text.secondary">No emergency contact set</Typography>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Appointment Booking */}
          <div>
            <Card className="dashboard-card-equal" elevation={3}>
              <CardContent>
                <Typography variant="h6" gutterBottom>📅 Book Appointment</Typography>
                <AppointmentBooking />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default PatientDashboard;