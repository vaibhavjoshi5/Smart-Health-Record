import React, { useEffect, useState } from 'react';
import FileUpload from './FileUpload';
import AppointmentBooking from './AppointmentBooking';
import { authFetch } from './utils';
import './App.css';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import AnimatedText from './AnimatedText';

function PatientDashboard() {
  const user = React.useMemo(() => JSON.parse(localStorage.getItem('user')), []);
  const [timeline, setTimeline] = useState([]);
  const [searchDate, setSearchDate] = useState('');
  const [searchSymptom, setSearchSymptom] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [graphs, setGraphs] = useState({ bp: [], sugar: [] });
  const [emergencyContact, setEmergencyContact] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Minimum loading time to prevent flash
        const startTime = Date.now();
        
        // Fetch timeline with error handling
        try {
          const timelineRes = await authFetch(`/api/patient/timeline/${user._id || user.id}`);
          if (timelineRes.ok) {
            const timelineData = await timelineRes.json();
            setTimeline(timelineData);
          }
        } catch (err) {
          console.log('Timeline fetch failed:', err);
          setTimeline([]); // Set empty array if fails
        }
        
        // Fetch health graphs with error handling
        try {
          const graphsRes = await authFetch(`/api/patient/health-graphs/${user._id || user.id}`);
          if (graphsRes.ok) {
            const graphsData = await graphsRes.json();
            setGraphs(graphsData);
          }
        } catch (err) {
          console.log('Graphs fetch failed:', err);
          setGraphs({ bp: [], sugar: [] }); // Set empty arrays if fails
        }
        
        // Fetch emergency contact with error handling
        try {
          const contactRes = await authFetch(`/api/patient/emergency-contact/${user._id || user.id}`);
          if (contactRes.ok) {
            const contactData = await contactRes.json();
            setEmergencyContact(contactData);
          }
        } catch (err) {
          console.log('Emergency contact fetch failed:', err);
          setEmergencyContact(null); // Set null if fails
        }
        
        // Ensure minimum loading time (500ms) to prevent jarring flash
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(500 - elapsedTime, 0);
        
        setTimeout(() => {
          setVisible(true);
        }, remainingTime);
        
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setTimeout(() => {
          setVisible(true);
        }, 500);
      }
    };
    
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    let url = `/api/patient/search/${user._id || user.id}?`;
    if (searchDate) url += `date=${searchDate}&`;
    if (searchSymptom) url += `symptom=${searchSymptom}`;
    authFetch(url)
      .then(res => res.json())
      .then(setSearchResults);
  };

  return (
    <>
      <div className="hero-animated-bg" />
      <div className="App" style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s cubic-bezier(.4,0,.2,1)' }}>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', marginTop: '3.5rem', marginBottom: '0.5rem' }}>
          <AnimatedText typewriter={true} className="animated-text-color"><h2>Patient Dashboard</h2></AnimatedText>
          <Button
            variant="outlined"
            sx={{ marginLeft: 'auto', marginRight: '2rem', color: '#7f5af0', borderColor: '#7f5af0', fontWeight: 600 }}
            onClick={() => window.location.href = '/profile'}
          >
            Profile
          </Button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
          <div className="main-content" style={{ flex: 1 }}>
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
                          <Box component="li" key={r._id} sx={{ mb: 1.5, p: 1, bgcolor: '#f8f9fa', borderRadius: 2 }}>
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
                          <Box component="li" key={r._id} sx={{ mb: 1, p: 1, bgcolor: '#e8f5e8', borderRadius: 2 }}>
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
        </div>
      </div>
    </>
  );
}

export default PatientDashboard; 