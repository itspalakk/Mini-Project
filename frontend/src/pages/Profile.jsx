import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';


export default function Profile() {
  const { user, login, token } = useAuth();
  const { showToast } = useToast();

  const [name,            setName]            = useState(user?.name || '');
  const [email,           setEmail]           = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [err,             setErr]             = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');

    if (!currentPassword) { setErr('Current password is required.'); return; }
    if (newPassword && newPassword.length < 6) { setErr('New password must be at least 6 characters.'); return; }
    if (newPassword && newPassword !== confirmPassword) { setErr('New passwords do not match.'); return; }

    setLoading(true);
    try {
      const data = await api.updateProfile({
        name, email, currentPassword,
        newPassword: newPassword || undefined,
      });
      // Update auth context with new user info
      login(data.user, token);
      showToast('Profile updated successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErr(err.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper" style={{ padding: '2rem', maxWidth: 540, margin: '0 auto' }}>
      <h2 style={{ fontFamily: "'Playfair Display',serif", marginBottom: '0.3rem' }}>Edit Profile</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginBottom: '1.5rem' }}>
        Update your name, email, or password.
      </p>

      <form onSubmit={handleSubmit}>
        {err && <div className="error-box" style={{ marginBottom: '1rem' }}>{err}</div>}

        <div className="form-group">
          <label>Full Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1.2rem 0' }} />
        <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Leave "New Password" blank if you don't want to change it.
        </p>

        <div className="form-group">
          <label>Current Password <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Required to save any changes" />
        </div>

        <div className="form-group">
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min. 6 characters (optional)" />
        </div>

        <div className="form-group">
          <label>Confirm New Password</label>
          <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '.5rem' }} disabled={loading}>
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}