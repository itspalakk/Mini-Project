import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

export default function ClubDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [club, setClub] = useState(null);
  const [events, setEvents] = useState({ upcoming: [], past: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const clubData = await api.getClub(id);
        setClub(clubData);

        const allEvents = await api.getEvents();
        const clubEvents = allEvents.filter(e => String(e.clubId) === String(id));
        
        const now = new Date();
        const upcoming = clubEvents.filter(e => new Date(e.date) >= now);
        const past = clubEvents.filter(e => new Date(e.date) < now);
        
        setEvents({ upcoming, past });
      } catch (err) {
        showToast(err.message || 'Error loading club details', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) return <div className="page-wrapper"><div style={{display:'flex',justifyContent:'center',padding:'5rem'}}><div className="spinner" /></div></div>;
  if (!club) return <div className="page-wrapper"><div className="empty-state">Club not found</div></div>;

  // Staff data comes directly from the backend (fetched from DB via User.find)
  // No fragile merging needed — the backend returns all assigned admins & coordinators
  const staff = club.staff || [];
  const admins = staff.filter(s => s.role === 'admin');
  const coordinators = staff.filter(s => s.role === 'coordinator');

  return (
    <div className="page-wrapper">
      <div style={styles.wrap}>
        <button className="btn btn-outline btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1.5rem' }}>
          ← Back
        </button>

        <div className="glass-card" style={styles.headerCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>{club.name}</h1>
            <span className="badge badge-amber">{club.category}</span>
          </div>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-light)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {club.description}
          </p>
          
          {/* ── Admin Details Section ── */}
          <div style={styles.staffSection}>
            <div style={styles.staffSectionHeader}>
              <span style={styles.staffIcon}>⚙️</span>
              <h3 style={styles.staffSectionTitle}>Admin Details</h3>
              <span style={styles.staffCount}>{admins.length} {admins.length === 1 ? 'admin' : 'admins'}</span>
            </div>
            {admins.length > 0 ? (
              <div style={styles.staffGrid}>
                {admins.map(s => (
                  <StaffCard key={s._id} staff={s} variant="admin" />
                ))}
              </div>
            ) : (
              <div style={styles.emptyStaff}>
                <span style={{ fontSize: '1.5rem', marginBottom: '0.4rem', display: 'block' }}>👤</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>No admin assigned yet.</p>
              </div>
            )}
          </div>

          {/* ── Coordinator Details Section ── */}
          <div style={{ ...styles.staffSection, marginTop: '1.2rem' }}>
            <div style={styles.staffSectionHeader}>
              <span style={styles.staffIcon}>🧑‍💼</span>
              <h3 style={styles.staffSectionTitle}>Coordinator Details</h3>
              <span style={styles.staffCount}>{coordinators.length} {coordinators.length === 1 ? 'coordinator' : 'coordinators'}</span>
            </div>
            {coordinators.length > 0 ? (
              <div style={styles.staffGrid}>
                {coordinators.map(s => (
                  <StaffCard key={s._id} staff={s} variant="coordinator" />
                ))}
              </div>
            ) : (
              <div style={styles.emptyStaff}>
                <span style={{ fontSize: '1.5rem', marginBottom: '0.4rem', display: 'block' }}>👤</span>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>No coordinator assigned yet.</p>
              </div>
            )}
          </div>
        </div>

        <div style={styles.eventsSection}>
          <h2 style={{ fontSize: '1.4rem', fontFamily: "'Playfair Display',serif", marginBottom: '1.2rem', color:'var(--text-light)' }}>Upcoming Events</h2>
          {events.upcoming.length === 0 ? (
            <p className="empty-state" style={{ padding: '2rem' }}><span className="icon" style={{fontSize:'2rem',marginBottom:'0.5rem',display:'block'}}>📅</span>No upcoming events.</p>
          ) : (
            <div style={styles.grid}>
              {events.upcoming.map(e => (
                <div key={e._id} className="glass-card" style={styles.eventCard}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{e.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', flex: 1 }}>{e.description}</p>
                  <p style={{ fontSize: '0.85rem', marginBottom:'0.3rem' }}><strong>Date:</strong> {new Date(e.date).toLocaleDateString()}</p>
                  <p style={{ fontSize: '0.85rem' }}><strong>Venue:</strong> {e.venue}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.eventsSection}>
          <h2 style={{ fontSize: '1.4rem', fontFamily: "'Playfair Display',serif", marginBottom: '1.2rem', color:'var(--text-light)' }}>Past Events</h2>
          {events.past.length === 0 ? (
            <p className="empty-state" style={{ padding: '2rem' }}><span className="icon" style={{fontSize:'2rem',marginBottom:'0.5rem',display:'block'}}>⏳</span>No past events.</p>
          ) : (
            <div style={styles.grid}>
              {events.past.map(e => (
                <div key={e._id} className="glass-card" style={{...styles.eventCard, opacity: 0.7}}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>{e.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', flex: 1 }}>{e.description}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom:'0.3rem' }}><strong>Date:</strong> {new Date(e.date).toLocaleDateString()}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><strong>Venue:</strong> {e.venue}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Staff Card Component ─────────────────────────────────────────────────── */
function StaffCard({ staff, variant }) {
  const isAdmin = variant === 'admin';
  const accentColor = isAdmin ? 'rgba(240,165,0,0.9)' : 'rgba(59,130,246,0.9)';
  const accentBg = isAdmin ? 'rgba(240,165,0,0.08)' : 'rgba(59,130,246,0.08)';
  const accentBorder = isAdmin ? 'rgba(240,165,0,0.25)' : 'rgba(59,130,246,0.25)';

  // Generate initials for avatar
  const initials = (staff.name || '')
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div style={{ ...staffStyles.card, borderColor: accentBorder }}>
      {/* Avatar + Name row */}
      <div style={staffStyles.topRow}>
        <div style={{ ...staffStyles.avatar, background: accentBg, color: accentColor }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
            <strong style={staffStyles.name}>{staff.name}</strong>
            <span className={isAdmin ? 'badge badge-amber' : 'badge badge-blue'}
              style={{ fontSize: '0.68rem', padding: '0.18rem 0.5rem', flexShrink: 0 }}>
              {isAdmin ? 'Admin' : 'Coordinator'}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={staffStyles.detailsGrid}>
        <div style={staffStyles.detailRow}>
          <span style={staffStyles.detailIcon}>✉️</span>
          <span style={staffStyles.detailLabel}>Email</span>
          <span style={staffStyles.detailValue}>{staff.email}</span>
        </div>
        {staff.loginId && (
          <div style={staffStyles.detailRow}>
            <span style={staffStyles.detailIcon}>🔑</span>
            <span style={staffStyles.detailLabel}>Staff ID</span>
            <span style={staffStyles.detailValue}>{staff.loginId}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Page Styles ──────────────────────────────────────────────────────────── */
const styles = {
  wrap: { maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem' },
  headerCard: { padding: '2.2rem', marginBottom: '2.5rem' },
  staffSection: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid var(--glass-border)',
    borderRadius: 12,
    padding: '1.4rem',
    marginTop: '1.5rem',
  },
  staffSectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '1rem',
  },
  staffIcon: { fontSize: '1.2rem' },
  staffSectionTitle: { fontSize: '1.1rem', fontWeight: 600, margin: 0, flex: 1 },
  staffCount: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    background: 'rgba(255,255,255,0.06)',
    padding: '0.2rem 0.6rem',
    borderRadius: 20,
  },
  staffGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
  },
  emptyStaff: {
    textAlign: 'center',
    padding: '1.5rem',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 8,
  },
  eventsSection: { marginBottom: '3rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.4rem' },
  eventCard: { padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' },
};

/* ── Staff Card Styles ────────────────────────────────────────────────────── */
const staffStyles = {
  card: {
    background: 'rgba(255,255,255,0.05)',
    padding: '1rem 1.1rem',
    borderRadius: 10,
    border: '1px solid',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.8rem',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.85rem',
    fontWeight: 700,
    flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  name: {
    fontSize: '0.95rem',
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  detailsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.82rem',
  },
  detailIcon: { fontSize: '0.85rem', flexShrink: 0 },
  detailLabel: {
    color: 'var(--text-muted)',
    minWidth: 52,
    flexShrink: 0,
  },
  detailValue: {
    color: 'var(--text-light)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
};
