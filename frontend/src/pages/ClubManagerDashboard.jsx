// src/pages/ClubManagerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

export default function ClubManagerDashboard() {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [data, setData] = useState(null);
  const [coordinators, setCoordinators] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clubs'); // 'clubs', 'coordinators', 'admins'

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const analytics = await api.getManagerAnalytics();
      setData(analytics);

      const coords = await api.getCoordinators();
      setCoordinators(coords);

      const adminsData = await api.getAdmins();
      setAdmins(adminsData);
    } catch (err) {
      showToast(err.message || 'Error loading manager data', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  const { totalStudents, totalCoordinators, totalAdmins, pendingRequests, clubs } = data || {};
  const activeClubs = clubs?.active || 0;
  const inactiveClubs = clubs?.inactive || 0;
  const totalClubs = clubs?.total || 0;
  
  // Calculate percentage of active clubs for the SVG doughnut
  const activePct = totalClubs > 0 ? Math.round((activeClubs / totalClubs) * 100) : 0;
  
  // SVG Circle stroke parameters
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activePct / 100) * circumference;

  return (
    <div style={styles.wrap}>
      {/* Welcome Banner */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.h1}>Hello, <span style={{ color: 'var(--accent)' }}>{user?.name?.split(' ')[0]}</span> ⚙️</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', marginTop: '.2rem' }}>
            EduEvent Manager organizational metrics and controls
          </p>
        </div>
        <span className="badge badge-blue">
          System Manager
        </span>
      </div>

      {/* Metrics Grid */}
      <div style={styles.statsGrid}>
        {/* Total Students */}
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={{ fontSize: '1.5rem' }}>🎓</span>
            <span className="badge badge-green">Students</span>
          </div>
          <div style={styles.metricValue}>{totalStudents}</div>
          <div style={styles.metricLabel}>Total Registered Students</div>
        </div>

        {/* Pending Request Volume */}
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={{ fontSize: '1.5rem' }}>⏳</span>
            <span className={pendingRequests > 0 ? 'badge badge-red' : 'badge badge-green'}>
              {pendingRequests > 0 ? 'Urgent' : 'Clear'}
            </span>
          </div>
          <div style={styles.metricValue}>{pendingRequests}</div>
          <div style={styles.metricLabel}>Pending Registrations</div>
        </div>

        {/* Staff Counts */}
        <div className="glass-card" style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={{ fontSize: '1.5rem' }}>💼</span>
            <span className="badge badge-purple">Staff</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'baseline', marginTop: '0.5rem' }}>
            <div>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-light)' }}>{totalCoordinators}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', block: 'inline', marginLeft: '0.2rem' }}>Coords</span>
            </div>
            <div style={{ width: '1px', height: '20px', background: 'var(--glass-border)' }} />
            <div>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-light)' }}>{totalAdmins}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', block: 'inline', marginLeft: '0.2rem' }}>Admins</span>
            </div>
          </div>
          <div style={{ ...styles.metricLabel, marginTop: '0.85rem' }}>Total Active Management Staff</div>
        </div>

        {/* Active/Inactive Clubs Visualization */}
        <div className="glass-card" style={{ ...styles.metricCard, display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1.2rem' }}>
          <div style={{ position: 'relative', width: 90, height: 90 }}>
            <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="45"
                cy="45"
                r={radius}
                fill="transparent"
                stroke="var(--glass-border)"
                strokeWidth="7"
              />
              {/* Active circle indicator */}
              <circle
                cx="45"
                cy="45"
                r={radius}
                fill="transparent"
                stroke="var(--success)"
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
              />
            </svg>
            <div style={styles.doughnutCenterText}>
              {activePct}%
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-light)' }}>{activeClubs} / {totalClubs}</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Active Campus Clubs</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.68rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--success)' }}>
                ● {activeClubs} Active
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', color: 'var(--danger)' }}>
                ● {inactiveClubs} Inactive
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={styles.tabsRow}>
        <button
          onClick={() => setActiveTab('clubs')}
          style={{ ...styles.tabButton, ...(activeTab === 'clubs' ? styles.tabButtonActive : {}) }}
        >
          🏛️ Clubs List ({totalClubs})
        </button>
        <button
          onClick={() => setActiveTab('coordinators')}
          style={{ ...styles.tabButton, ...(activeTab === 'coordinators' ? styles.tabButtonActive : {}) }}
        >
          🧑‍💼 Coordinators ({coordinators.length})
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          style={{ ...styles.tabButton, ...(activeTab === 'admins' ? styles.tabButtonActive : {}) }}
        >
          ⚙️ Admins ({admins.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="glass-card" style={styles.tabContentContainer}>
        {activeTab === 'clubs' && (
          <div>
            <h2 style={styles.panelTitle}>Campus Clubs Status</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Club Details</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Members</th>
                    <th>Assigned Coordinator ID</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.clubsList?.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No clubs registered in the system.
                      </td>
                    </tr>
                  ) : (
                    data?.clubsList?.map(c => (
                      <tr key={c._id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{c.name}</div>
                          <div style={{ fontSize: '.72rem', color: 'var(--text-muted)' }}>
                            {c.description.slice(0, 70)}{c.description.length > 70 ? '...' : ''}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-amber">{c.category}</span>
                        </td>
                        <td>
                          <span className={`badge ${c.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                            {c.status || 'active'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--accent)' }}>{c.memberCount || 0}</strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '.78rem', color: 'var(--text-muted)' }}>
                            {c.coordinator ? String(c.coordinator) : '—'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'coordinators' && (
          <div>
            <h2 style={styles.panelTitle}>Assigned Club Coordinators</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Coordinator Name</th>
                    <th>Login ID</th>
                    <th>Email Address</th>
                    <th>Assigned Clubs</th>
                  </tr>
                </thead>
                <tbody>
                  {coordinators.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No coordinators registered.
                      </td>
                    </tr>
                  ) : (
                    coordinators.map(c => (
                      <tr key={c._id}>
                        <td style={{ fontWeight: 600, fontSize: '.9rem' }}>{c.name}</td>
                        <td>
                          <span className="badge badge-purple">{c.loginId}</span>
                        </td>
                        <td>{c.email}</td>
                        <td>
                          {c.assignedClubs?.length === 0 ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>None</span>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                              {c.assignedClubs.map(club => (
                                <span key={club._id} className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                                  {club.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'admins' && (
          <div>
            <h2 style={styles.panelTitle}>Assigned Club Administrators</h2>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admin Name</th>
                    <th>Login ID</th>
                    <th>Email Address</th>
                    <th>Assigned Clubs</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No administrators registered.
                      </td>
                    </tr>
                  ) : (
                    admins.map(a => (
                      <tr key={a._id}>
                        <td style={{ fontWeight: 600, fontSize: '.9rem' }}>{a.name}</td>
                        <td>
                          <span className="badge badge-red">{a.loginId}</span>
                        </td>
                        <td>{a.email}</td>
                        <td>
                          {a.assignedClubs?.length === 0 ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>None</span>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                              {a.assignedClubs.map(club => (
                                <span key={club._id} className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                                  {club.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 1100, margin: '0 auto', padding: '1rem 0 2.5rem' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' },
  h1: { fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-.02em', color: 'var(--text-light)', fontFamily: "'Playfair Display', serif" },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.4rem', marginBottom: '2.5rem' },
  metricCard: { padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 135 },
  metricHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  metricValue: { fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-light)', fontFamily: "'Playfair Display', serif", lineHeight: 1 },
  metricLabel: { fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' },
  doughnutCenterText: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-light)' },
  tabsRow: { display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', flexWrap: 'wrap' },
  tabButton: { background: 'none', border: 'none', padding: '0.6rem 1.1rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s', borderRadius: 8 },
  tabButtonActive: { background: 'var(--accent)', color: '#ffffff' },
  tabContentContainer: { padding: '2rem' },
  panelTitle: { fontSize: '1.2rem', fontFamily: "'Playfair Display', serif", fontWeight: 800, marginBottom: '1.2rem', color: 'var(--text-light)' }
};
