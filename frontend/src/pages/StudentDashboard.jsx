// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import DashboardSidebar from '../components/DashboardSidebar';

const ALL_INTERESTS = [
  'Technology','Arts & Culture','Sports','Music','Science','Literature',
  'Photography','Dance','Entrepreneurship','Social Service','Gaming',
  'Debate & MUN','Film','Environment','Finance',
];

const STATUS_CLASS = { pending:'badge-amber', approved:'badge-green', rejected:'badge-red' };

export default function StudentDashboard() {
  const { user }      = useAuth();
  const { showToast } = useToast();

  const [selected,  setSelected]  = useState([]);
  const [recClubs,  setRecClubs]  = useState([]);
  const [recLoad,   setRecLoad]   = useState(true);
  const [requests,  setRequests]  = useState([]);
  const [reqLoad,   setReqLoad]   = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);

  useEffect(() => {
    api.getInterests().then(d => setSelected(d.interests || [])).catch(()=>{});
    loadRec();
    loadRequests();
    loadLiveEvents();
  }, []);

  async function loadRec() {
    setRecLoad(true);
    try { const d = await api.getRecommended(); setRecClubs(d.clubs || []); }
    catch (err) { /* silent if no interests yet */ }
    finally { setRecLoad(false); }
  }

  async function loadRequests() {
    setReqLoad(true);
    try { const d = await api.getMyRequests(); setRequests(d.registrations || []); }
    catch (err) { showToast(err.message || 'Failed to load requests', 'error'); }
    finally { setReqLoad(false); }
  }

  async function loadLiveEvents() {
    try {
      const events = await api.getLiveEvents();
      setLiveEvents(events || []);
    } catch {
      setLiveEvents([]);
    }
  }

  function toggleInterest(i) {
    setSelected(prev => prev.includes(i) ? prev.filter(x=>x!==i) : [...prev, i]);
  }

  async function saveInterests() {
    try {
      await api.saveInterests(selected);
      showToast('Interests saved!', 'success');
      loadRec();
    } catch { showToast('Failed to save interests', 'error'); }
  }

  async function registerClub(clubId, name) {
    try {
      await api.registerClub(clubId);
      showToast(`Request sent for "${name}"!`, 'success');
      loadRequests();
    } catch (err) { showToast(err.message || 'Error', 'error'); }
  }

  const mainLiveEvent = liveEvents[0];
  const activeSection = location.hash.replace('#', '');
  const showHome = !activeSection;
  const showInterests = activeSection === 'interests-sec';
  const showRequests = activeSection === 'requests-sec';

  return (
    <div style={styles.wrap}>

  {/* Welcome */}
  <div style={styles.topBar}>
    <div>
      <h1 style={styles.h1}>Hello, <span style={{color:'var(--accent)'}}>{user?.name?.split(' ')[0]}</span> 👋</h1>
      <p style={{color:'var(--text-muted)',fontSize:'.88rem',marginTop:'.2rem'}}>Student Dashboard</p>
    </div>
    <div style={{display:'flex',gap:'.6rem',alignItems:'center'}}>
      <span className="badge badge-blue">{user?.enrollment}</span>
      <span className="badge badge-green">Student</span>
    </div>
  </div>

  {/* Live Event Notification */}
  {mainLiveEvent && (
    <Link to="/events" style={styles.liveBanner}>
      <div style={styles.liveIcon}>📡</div>
      <div style={{flex:1}}>
        <div style={styles.liveTitle}>
          {mainLiveEvent.title} is Live!
        </div>
        <div style={styles.liveText}>
          The event is happening now at {mainLiveEvent.venue || 'campus venue'}.
          {' '}Click here to view event details.
        </div>
      </div>
      {liveEvents.length > 1 && (
        <span style={styles.liveCount}>+{liveEvents.length - 1} more</span>
      )}
    </Link>
  )}

  {/* Nav cards */}
  {showHome && (
  <div style={styles.navGrid}>
    {[
      {icon:'🏛️',title:'Explore Clubs', desc:'Browse and join campus clubs', to:'/clubs'},
      {icon:'📅',title:'View Events',   desc:'Upcoming events & workshops',   to:'/events'},
    ].map(c=>(
      <Link key={c.title} to={c.to} className="glass-card" style={styles.navCard}>
        <span style={{fontSize:'1.9rem',marginBottom:'.8rem',display:'block'}}>{c.icon}</span>
        <h3 style={{fontSize:'.97rem',fontWeight:600,marginBottom:'.25rem'}}>{c.title}</h3>
        <p style={{fontSize:'.78rem',color:'var(--text-muted)'}}>{c.desc}</p>
        <span style={{position:'absolute',top:'1rem',right:'1rem',color:'var(--text-muted)',fontSize:'.85rem'}}>↗</span>
      </Link>
    ))}
    <Link to="/dashboard#interests-sec" className="glass-card" style={styles.navCard}>
      <span style={{fontSize:'1.9rem',marginBottom:'.8rem',display:'block'}}>🎯</span>
      <h3 style={{fontSize:'.97rem',fontWeight:600,marginBottom:'.25rem'}}>Your Interests</h3>
      <p style={{fontSize:'.78rem',color:'var(--text-muted)'}}>Get personalised recommendations</p>
      <span style={{position:'absolute',top:'1rem',right:'1rem',color:'var(--text-muted)',fontSize:'.85rem'}}>↗</span>
    </Link>
    <Link to="/dashboard#requests-sec" className="glass-card" style={styles.navCard}>
      <span style={{fontSize:'1.9rem',marginBottom:'.8rem',display:'block'}}>📋</span>
      <h3 style={{fontSize:'.97rem',fontWeight:600,marginBottom:'.25rem'}}>My Requests</h3>
      <p style={{fontSize:'.78rem',color:'var(--text-muted)'}}>Track registration statuses</p>
      <span style={{position:'absolute',top:'1rem',right:'1rem',color:'var(--text-muted)',fontSize:'.85rem'}}>↗</span>
    </Link>
  </div>
  )}

  {/* Interests */}
  {showInterests && (
  <div id="interests-sec" className="glass-card" style={{padding:'1.7rem',marginBottom:'2rem'}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'1rem',marginBottom:'1rem'}}>
      <div>
        <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.2rem',marginBottom:'.2rem'}}>Your Interests</h2>
        <p style={{color:'var(--text-muted)',fontSize:'.83rem'}}>Select what excites you — we'll recommend matching clubs</p>
      </div>
      <button className="btn btn-primary btn-sm" onClick={saveInterests}>Save Interests</button>
    </div>
    <div style={styles.chips}>
      {ALL_INTERESTS.map(i=>(
        <button key={i}
          onClick={()=>toggleInterest(i)}
          style={{...styles.chip,...(selected.includes(i)?styles.chipActive:{})}}>
          {i}
        </button>
      ))}
    </div>
  </div>
  )}

  {/* Recommended */}
  {showInterests && (
  <div style={{marginBottom:'2.5rem'}}>
    <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.2rem',marginBottom:'.2rem'}}>Recommended Clubs</h2>
    <p style={{color:'var(--text-muted)',fontSize:'.83rem',marginBottom:'1rem'}}>Based on your interests</p>
    {recLoad ? <div className="spinner"/> :
      recClubs.length === 0
        ? <div className="empty-state"><div className="icon">🎯</div><p>Select interests above to get recommendations</p></div>
        : <div style={styles.recGrid}>
            {recClubs.map(c=>(
              <div key={c._id} className="glass-card" style={{padding:'1.3rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.4rem'}}>
                  <h4 style={{fontSize:'.95rem',fontWeight:600}}>{c.name}</h4>
                  <span className="badge badge-amber">{c.category}</span>
                </div>
                <p style={{fontSize:'.8rem',color:'var(--text-muted)',lineHeight:1.5,marginBottom:'.9rem'}}>{c.description}</p>
                <button className="btn btn-primary btn-sm" onClick={()=>registerClub(c._id,c.name)}>Join Club</button>
              </div>
            ))}
          </div>
    }
  </div>
  )}

  {/* My Requests */}
  {showRequests && (
  <div id="requests-sec">
    <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.2rem',marginBottom:'.2rem'}}>My Requests</h2>
    <p style={{color:'var(--text-muted)',fontSize:'.83rem',marginBottom:'1rem'}}>Club & event registration status</p>
    <div className="glass-card" style={{overflow:'hidden'}}>
      {reqLoad ? <div className="spinner"/> :
        <table className="data-table">
          <thead><tr><th>Type</th><th>Name</th><th>Date Applied</th><th>Status</th></tr></thead>
          <tbody>
            {requests.length === 0
              ? <tr><td colSpan={4} style={{textAlign:'center',color:'var(--text-muted)',padding:'2rem'}}>No registrations yet</td></tr>
              : requests.map(r=>(
                  <tr key={r._id}>
                    <td><span className="badge badge-blue">{r.type}</span></td>
                    <td>{r.name}</td>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td><span className={`badge ${STATUS_CLASS[r.status]||'badge-blue'}`}>{r.status}</span></td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      }
    </div>
  </div>
  )}

    </div>
  );
}

const styles = {
  wrap:    { maxWidth:1100, margin:'0 auto', padding:'1rem 0 2.5rem' },
  topBar:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' },
  h1:      { fontFamily:"'Playfair Display',serif", fontSize:'2rem' },

  liveBanner: {
    display:'flex',
    alignItems:'center',
    gap:'1rem',
    textDecoration:'none',
    color:'#fff',
    background:'linear-gradient(135deg,#1d4ed8,#0f766e)',
    border:'1px solid rgba(255,255,255,.18)',
    borderRadius:12,
    padding:'1rem 1.2rem',
    marginBottom:'2rem',
    boxShadow:'0 14px 34px rgba(0,0,0,.28)',
  },
  liveIcon: {
    width:38,
    height:38,
    borderRadius:'50%',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    background:'rgba(255,255,255,.12)',
    fontSize:'1.2rem',
    flexShrink:0,
  },
  liveTitle: {
    fontSize:'1rem',
    fontWeight:800,
    marginBottom:'.18rem',
  },
  liveText: {
    fontSize:'.88rem',
    lineHeight:1.45,
    color:'rgba(255,255,255,.92)',
  },
  liveCount: {
    fontSize:'.76rem',
    fontWeight:700,
    color:'#fff',
    background:'rgba(255,255,255,.14)',
    border:'1px solid rgba(255,255,255,.18)',
    borderRadius:50,
    padding:'.32rem .7rem',
    whiteSpace:'nowrap',
  },

  navGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1.2rem', marginBottom:'2.5rem' },
  navCard: { padding:'1.7rem 1.4rem', textDecoration:'none', display:'block', position:'relative', overflow:'hidden', cursor:'pointer' },
  chips:   { display:'flex', flexWrap:'wrap', gap:'.6rem', marginTop:'.6rem' },
  chip:    { padding:'.38rem 1rem', borderRadius:50, border:'1.5px solid var(--glass-border)', background:'transparent', color:'var(--text-muted)', fontFamily:"'DM Sans',sans-serif", fontSize:'.8rem', fontWeight:500, cursor:'pointer', transition:'all .2s' },
  chipActive: { borderColor:'var(--accent)', color:'var(--accent)', background:'rgba(37,99,235,.08)' },
  recGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' },
};




