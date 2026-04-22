// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

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

  // Load saved interests + recommendations + requests
  useEffect(() => {
    api.getInterests().then(d => setSelected(d.interests || [])).catch(()=>{});
    loadRec();
    loadRequests();
  }, []);

  async function loadRec() {
    setRecLoad(true);
    try { const d = await api.getRecommended(); setRecClubs(d.clubs || []); }
    catch {}
    finally { setRecLoad(false); }
  }

  async function loadRequests() {
    setReqLoad(true);
    try { const d = await api.getMyRequests(); setRequests(d.registrations || []); }
    catch {}
    finally { setReqLoad(false); }
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

  return (
    <div className="page-wrapper">
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

        {/* Nav cards */}
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
          <div className="glass-card" style={styles.navCard} onClick={()=>document.getElementById('interests-sec').scrollIntoView({behavior:'smooth'})}>
            <span style={{fontSize:'1.9rem',marginBottom:'.8rem',display:'block'}}>🎯</span>
            <h3 style={{fontSize:'.97rem',fontWeight:600,marginBottom:'.25rem'}}>Your Interests</h3>
            <p style={{fontSize:'.78rem',color:'var(--text-muted)'}}>Get personalised recommendations</p>
            <span style={{position:'absolute',top:'1rem',right:'1rem',color:'var(--text-muted)',fontSize:'.85rem'}}>↗</span>
          </div>
          <div className="glass-card" style={styles.navCard} onClick={()=>document.getElementById('requests-sec').scrollIntoView({behavior:'smooth'})}>
            <span style={{fontSize:'1.9rem',marginBottom:'.8rem',display:'block'}}>📋</span>
            <h3 style={{fontSize:'.97rem',fontWeight:600,marginBottom:'.25rem'}}>My Requests</h3>
            <p style={{fontSize:'.78rem',color:'var(--text-muted)'}}>Track registration statuses</p>
            <span style={{position:'absolute',top:'1rem',right:'1rem',color:'var(--text-muted)',fontSize:'.85rem'}}>↗</span>
          </div>
        </div>

        {/* Interests */}
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

        {/* Recommended */}
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

        {/* My Requests */}
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

      </div>
    </div>
  );
}

const styles = {
  wrap:    { maxWidth:1100, margin:'0 auto', padding:'2.5rem 1.5rem' },
  topBar:  { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2.5rem', flexWrap:'wrap', gap:'1rem' },
  h1:      { fontFamily:"'Playfair Display',serif", fontSize:'2rem' },
  navGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1.2rem', marginBottom:'2.5rem' },
  navCard: { padding:'1.7rem 1.4rem', textDecoration:'none', display:'block', position:'relative', overflow:'hidden', cursor:'pointer' },
  chips:   { display:'flex', flexWrap:'wrap', gap:'.6rem', marginTop:'.6rem' },
  chip:    { padding:'.38rem 1rem', borderRadius:50, border:'1.5px solid var(--glass-border)', background:'transparent', color:'var(--text-muted)', fontFamily:"'DM Sans',sans-serif", fontSize:'.8rem', fontWeight:500, cursor:'pointer', transition:'all .2s' },
  chipActive: { borderColor:'var(--accent)', color:'var(--accent)', background:'rgba(240,165,0,.1)' },
  recGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' },
};
