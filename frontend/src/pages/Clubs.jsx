// src/pages/Clubs.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

const EMOJIS = {
  Technology: '💻',
  'Arts & Culture': '🎨',
  Sports: '⚽',
  Music: '🎵',
  Science: '🔬',
  Literature: '📚',
  Photography: '📷',
  Dance: '💃',
  Entrepreneurship: '🚀',
  'Social Service': '🤝',
  Gaming: '🎮',
  'Debate & MUN': '🎙️',
  Film: '🎬',
  Environment: '🌱',
  Finance: '📈'
};
const CATS = [
  'Technology', 'Arts & Culture', 'Sports', 'Music', 'Science',
  'Literature', 'Photography', 'Dance', 'Entrepreneurship',
  'Social Service', 'Gaming', 'Debate & MUN', 'Film', 'Environment', 'Finance'
];

const DEFAULT_CLUB_EMOJI = '🏛️';
const EMOJI_CHOICES = [
  '🤖','🚀','💻','🧠','🎨','🎭','🎵','🎸','⚽','🏀','🏏','🏆',
  '📚','✍️','📷','🎬','🌱','🌍','💡','🔬','🧪','💰','🎮','🗣️',
  '🤝','❤️','⭐','🏛️','🧑‍💻','👨‍💻','🧘','🎤','🎯','📰'
];
const emptyCoord = () => ({ name: '', email: '', loginId: '', password: '', confirmPassword: '', contact: '' });

export default function Clubs() {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();
  const isStudent     = user?.role === 'student';
  const isManager     = user?.role === 'club_manager';

  const [clubs,         setClubs]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [category,      setCategory]      = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [form,          setForm]          = useState({
    name: '',
    description: '',
    category: 'Technology',
    status: 'active',
    logoUrl: DEFAULT_CLUB_EMOJI
  });
  const [coord,         setCoord]         = useState(emptyCoord());
  const [creating,      setCreating]      = useState(false);
  const [formErr,       setFormErr]       = useState('');
  
  // Deletion state
  const [clubToDelete,  setClubToDelete]  = useState(null);
  const [password,      setPassword]      = useState('');
  const [deleteErr,     setDeleteErr]     = useState('');
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    loadClubs();
  }, [user]);

  async function loadClubs() {
    setLoading(true);
    try {
      setClubs(await api.getClubs());
    } catch {
      showToast('Could not load clubs', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function registerClub(clubId, name) {
    try {
      await api.registerClub(clubId);
      showToast(`Request sent for "${name}"!`, 'success');
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormErr('');

    // ── Club validation ──
    if (!form.name.trim()) { setFormErr('Club name is required.'); return; }
    if (!form.description.trim()) { setFormErr('Description is required.'); return; }
    if (!form.category) { setFormErr('Category is required.'); return; }

    // ── Coordinator validation ──
    if (!coord.name.trim()) { setFormErr('Coordinator name is required.'); return; }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!coord.email.trim() || !emailRegex.test(coord.email.trim())) {
      setFormErr('Please enter a valid coordinator email.');
      return;
    }
    if (!coord.loginId.trim()) { setFormErr('Coordinator Login ID is required.'); return; }
    if (!coord.password || coord.password.length < 6) {
      setFormErr('Coordinator password must be at least 6 characters.');
      return;
    }
    if (coord.password !== coord.confirmPassword) {
      setFormErr('Passwords do not match.');
      return;
    }

    setCreating(true);
    try {
      await api.createClub({
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        logoUrl: form.logoUrl || DEFAULT_CLUB_EMOJI,
        status: form.status,
        coordinator: {
          name: coord.name.trim(),
          email: coord.email.trim(),
          loginId: coord.loginId.trim(),
          password: coord.password,
          contact: coord.contact.trim(),
        },
      });
      showToast(`Club "${form.name.trim()}" created with its coordinator!`, 'success');
      setShowModal(false);
      setForm({ name: '', description: '', category: 'Technology', status: 'active', logoUrl: DEFAULT_CLUB_EMOJI });
      setCoord(emptyCoord());
      loadClubs();
    } catch (err) {
      setFormErr(err.message || 'Error creating club');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(e) {
    e.preventDefault();
    setDeleteErr('');
    if (!password) {
      setDeleteErr('Password is required.');
      return;
    }
    setDeleting(true);
    try {
      await api.deleteClub(clubToDelete._id, password);
      showToast(`Club "${clubToDelete.name}" deleted successfully`, 'success');
      setClubToDelete(null);
      setPassword('');
      loadClubs();
    } catch (err) {
      setDeleteErr(err.message || 'Deletion failed');
    } finally {
      setDeleting(false);
    }
  }

  const filtered = clubs.filter(c =>
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())) &&
    (!category || c.category === category)
  );

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 className="section-title">Campus Clubs</h1>
          <p className="section-sub">
            {isManager 
              ? 'Organize, coordinate, and manage campus clubs'
              : !isStudent 
              ? 'Your assigned clubs' 
              : 'Discover your community'}
          </p>
        </div>
        <div style={styles.filterBar}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search clubs…"
            style={styles.filterInput}
          />
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            style={styles.filterInput}
          >
            <option value="">All Categories</option>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
          {isManager && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              + Create Club
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="spinner" />
      ) : (
        <div style={styles.grid}>
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1/-1' }}>
              <div className="icon">🏛️</div>
              <p>No clubs found</p>
            </div>
          ) : (
            filtered.map(c => (
              <div
                key={c._id}
                className="glass-card"
                style={{ ...styles.card, cursor: 'pointer' }}
                onClick={() => navigate(`/clubs/${c._id}`)}
              >
                <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'flex-start', marginBottom: '.8rem', justifyContent: 'space-between' }}>
                  <div style={styles.emojiBox}>
                    {c.logoUrl ? (
                      <span style={{ fontSize: '1.4rem' }}>{c.logoUrl}</span>
                    ) : (
                      EMOJIS[c.category] || '🏛️'
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {c.status === 'inactive' && <span className="badge badge-red">Inactive</span>}
                    <span className="badge badge-amber">{c.category}</span>
                  </div>
                </div>
                <h3 style={{ fontSize: '1.02rem', fontWeight: 600, marginBottom: '.4rem' }}>{c.name}</h3>
                <p style={{ fontSize: '.82rem', color: 'var(--text-muted)', lineHeight: 1.6, flex: 1, marginBottom: '.9rem' }}>
                  {c.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', gap: '0.5rem' }}>
                  <span className="badge badge-blue">👥 {c.memberCount || 0} members</span>
                  {isStudent ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={e => {
                        e.stopPropagation();
                        registerClub(c._id, c.name);
                      }}
                    >
                      Register
                    </button>
                  ) : isManager ? (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={e => {
                        e.stopPropagation();
                        setClubToDelete(c);
                        setPassword('');
                        setDeleteErr('');
                      }}
                    >
                      Delete
                    </button>
                  ) : (
                    <span className="badge badge-green">Your Club</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Club Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div className="modal-box" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', marginBottom: '1.4rem' }}>
              Create New Club
            </h3>
            {formErr && <div className="error-box">{formErr}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Club Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Robotics Club"
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{ resize: 'vertical' }}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Club Logo / Icon</label>
                <div style={styles.emojiSelectedRow}>
                  <span style={styles.emojiPreview}>{form.logoUrl || DEFAULT_CLUB_EMOJI}</span>
                  <span style={styles.emojiHint}>Click an emoji below to choose the club icon</span>
                </div>
                <div style={styles.emojiGrid}>
                  {EMOJI_CHOICES.map(em => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setForm({ ...form, logoUrl: em })}
                      style={{
                        ...styles.emojiBtn,
                        ...(form.logoUrl === em ? styles.emojiBtnActive : {})
                      }}
                      title={`Use ${em}`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Club Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {/* ── CLUB COORDINATOR — new account created with this club ── */}
              <div style={styles.coordSection}>
                <div style={styles.coordSectionTitle}>🧑‍💼 Club Coordinator</div>
                <p style={styles.coordSectionSub}>
                  A brand-new coordinator account will be created for this club.
                  They will log in with the Login ID & password you set here — no separate signup needed.
                </p>

                <div style={styles.coordRow}>
                  <div className="form-group">
                    <label>Coordinator Name *</label>
                    <input
                      value={coord.name}
                      onChange={e => setCoord({ ...coord, name: e.target.value })}
                      placeholder="e.g. Priya Sharma"
                    />
                  </div>
                  <div className="form-group">
                    <label>Coordinator Email *</label>
                    <input
                      type="email"
                      value={coord.email}
                      onChange={e => setCoord({ ...coord, email: e.target.value })}
                      placeholder="coordinator@email.com"
                    />
                  </div>
                </div>

                <div style={styles.coordRow}>
                  <div className="form-group">
                    <label>Coordinator Login ID *</label>
                    <input
                      value={coord.loginId}
                      onChange={e => setCoord({ ...coord, loginId: e.target.value })}
                      placeholder="e.g. COORD010"
                    />
                  </div>
                  <div className="form-group">
                    <label>Coordinator Password *</label>
                    <input
                      type="password"
                      value={coord.password}
                      onChange={e => setCoord({ ...coord, password: e.target.value })}
                      placeholder="Min. 6 characters"
                    />
                  </div>
                </div>

                <div style={styles.coordRow}>
                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input
                      type="password"
                      value={coord.confirmPassword}
                      onChange={e => setCoord({ ...coord, confirmPassword: e.target.value })}
                      placeholder="Repeat password"
                    />
                  </div>
                  <div className="form-group">
                    <label>Coordinator Contact Details (optional)</label>
                    <input
                      value={coord.contact}
                      onChange={e => setCoord({ ...coord, contact: e.target.value })}
                      placeholder="e.g. email or phone number"
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={creating}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clubToDelete && (
        <div className="modal-overlay" onClick={() => setClubToDelete(null)}>
          <div className="modal-box">
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', marginBottom: '0.8rem', color: 'var(--danger)' }}>
              🗑 Delete Club
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
              Are you sure you want to permanently delete <strong>{clubToDelete.name}</strong>?
              This will also delete all associated events and registrations.
            </p>
            {deleteErr && <div className="error-box">{deleteErr}</div>}
            <form onSubmit={handleDelete}>
              <div className="form-group">
                <label>Enter Password to Confirm</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your account password"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setClubToDelete(null)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 1100, margin: '0 auto', padding: '1rem 0 2.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  filterBar: { display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' },
  filterInput: { padding: '.55rem .95rem', borderRadius: 50, border: '1.5px solid var(--glass-border)', background: 'var(--card-bg)', color: 'var(--text-light)', fontFamily: "'DM Sans',sans-serif", fontSize: '.85rem', outline: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1.4rem' },
  card: { padding: '1.7rem', display: 'flex', flexDirection: 'column' },
  emojiBox: { width: 48, height: 48, borderRadius: 12, background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' },

  // Emoji picker
  emojiSelectedRow: { display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.5rem' },
  emojiPreview: { width: 44, height: 44, borderRadius: 10, background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', flexShrink: 0 },
  emojiHint: { fontSize: '.72rem', color: 'var(--text-muted)' },
  emojiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))', gap: '.35rem', maxHeight: 132, overflowY: 'auto', padding: '.45rem', border: '1.5px solid var(--glass-border)', borderRadius: 10, background: 'rgba(255,255,255,.03)' },
  emojiBtn: { aspectRatio: '1 / 1', minHeight: 38, border: '1.5px solid transparent', borderRadius: 8, background: 'transparent', fontSize: '1.15rem', cursor: 'pointer', lineHeight: 1, transition: 'all .15s' },
  emojiBtnActive: { borderColor: 'var(--accent)', background: 'rgba(37,99,235,.1)', boxShadow: '0 0 0 2px rgba(37,99,235,.15)' },

  // Club Coordinator creation section
  coordSection: { borderTop: '1px dashed var(--glass-border)', marginTop: '.4rem', paddingTop: '1rem' },
  coordSectionTitle: { fontFamily: "'Playfair Display',serif", fontSize: '1.05rem', fontWeight: 700, marginBottom: '.2rem' },
  coordSectionSub: { fontSize: '.74rem', color: 'var(--text-muted)', marginBottom: '.9rem', lineHeight: 1.5 },
  coordRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.8rem' },
};
