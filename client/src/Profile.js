import React, { useEffect, useState } from 'react';
import { authFetch } from './utils';
import AnimatedText from './AnimatedText';

function Profile() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ name: '', bloodGroup: '', allergies: '', chronicDiseases: '', emergencyContact: { name: '', phone: '', relation: '' } });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authFetch(`/api/profile/${user._id || user.id}`)
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setForm({
          name: data.name || '',
          bloodGroup: data.bloodGroup || '',
          allergies: (data.allergies || []).join(', '),
          chronicDiseases: (data.chronicDiseases || []).join(', '),
          emergencyContact: data.emergencyContact || { name: '', phone: '', relation: '' }
        });
      });
  }, [user]);

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
      const res = await authFetch(`/api/profile/update/${user._id || user.id}`, {
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
      const res = await authFetch(`/api/profile/export/${user._id || user.id}`);
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

  if (!profile) return <p>Loading...</p>;

  return (
    <>
      <div className="hero-animated-bg" />
      <div>
        <AnimatedText typewriter={true} className="animated-text-color"><h2>Profile</h2></AnimatedText>
        {!edit ? (
          <div>
            <p><b>Name:</b> {profile.name}</p>
            <p><b>Email:</b> {profile.email}</p>
            <p><b>Blood Group:</b> {profile.bloodGroup}</p>
            <p><b>Allergies:</b> {(profile.allergies || []).join(', ')}</p>
            <p><b>Chronic Diseases:</b> {(profile.chronicDiseases || []).join(', ')}</p>
            <p><b>Emergency Contact:</b> {profile.emergencyContact ? `${profile.emergencyContact.name} (${profile.emergencyContact.relation}) - ${profile.emergencyContact.phone}` : 'N/A'}</p>
            <button onClick={() => setEdit(true)}>Edit Profile</button>
            <button onClick={handleExport}>Export All Records</button>
          </div>
        ) : (
          <form onSubmit={handleUpdate}>
            <div>
              <label>Name:</label>
              <input name="name" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label>Blood Group:</label>
              <input name="bloodGroup" value={form.bloodGroup} onChange={handleChange} />
            </div>
            <div>
              <label>Allergies (comma separated):</label>
              <input name="allergies" value={form.allergies} onChange={handleChange} />
            </div>
            <div>
              <label>Chronic Diseases (comma separated):</label>
              <input name="chronicDiseases" value={form.chronicDiseases} onChange={handleChange} />
            </div>
            <div>
              <label>Emergency Contact Name:</label>
              <input name="emergencyContact.name" value={form.emergencyContact.name} onChange={handleChange} />
            </div>
            <div>
              <label>Emergency Contact Phone:</label>
              <input name="emergencyContact.phone" value={form.emergencyContact.phone} onChange={handleChange} />
            </div>
            <div>
              <label>Emergency Contact Relation:</label>
              <input name="emergencyContact.relation" value={form.emergencyContact.relation} onChange={handleChange} />
            </div>
            <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
            <button type="button" onClick={() => setEdit(false)}>Cancel</button>
          </form>
        )}
        {message && <p style={{ color: message.includes('updated') ? 'green' : 'red' }}>{message}</p>}
      </div>
    </>
  );
}

export default Profile; 