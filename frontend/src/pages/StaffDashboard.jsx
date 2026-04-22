// src/pages/StaffDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

const STATUS_CLASS = { pending:'badge-amber', approved:'badge-green', rejected:'badge-red' };

export default function StaffDashboard() {
  const { user }      = useAuth();
  const { showToast } = useToast();

  const [activeClub, setActiveClub] = useState('all');
  const [requests,   setRequests]   = useState([]);
  const [events,     setEvents]     = useState([]);
  const [loadingReq, setLoadingReq] = useState(true);
  const [loadingEvt, setLoadingEvt] = useState(true);
  const [form, setForm] = useState({ title:'', clubId:'', date:'', venue:'', description:'' });
  const [formErr, setFormErr] = useState('');

  const assignedClubs = user?.assignedClubs || [];

  const loadRequests = useCallback(async () => {
    setLoadingReq(true);
    try { setRequests(await api.getClubRequests()); }
    catch { setRequests([]); }
    finally { setLoadingReq(false); }
  }, []);

  const loadEvents = useCallback(async () => {
    setLoadingEvt(true);
    try { setEvents(await api.getEvents()); }
    catch { setEvents([]); }
    finally { setLoadingEvt(false); }
  }, []);

  useEffect(() => {
    loadRequests();
    loadEvents();
    // Pre-fill club dropdown
    if (assignedClubs.length > 0) setForm(f=>({...f, clubId: assignedClubs[0]._id}));
  }, []);

  // Filter requests by selected club
  const filteredReqs = activeClub === 'all' ? requests : requests.filter(r => {
    const cid = r.type === 'club' ? r.club?._id : r.event?.club;
    return String(cid) === activeClub;
  });

  const upcomingEvts = events.filter(e => new Date(e.date) > new Date() &&
    (activeClub === 'all' || String(e.clubId) === activeClub)
  );

  // Stats
  const stats = [
    { label:'Assigned Clubs',   val: assignedClubs.length },
    { label:'Pending Requests', val: requests.filter(r=>r.status==='pending').length },
    { label:'Active Events',    val: events.filter(e=>new Date(e.date)>new Date()).length },
    { label:'Approved Members', val: requests.filter(r=>r.status==='approved').length },
  ];

  async function handleStatus(id, status) {
    try {
      await api.updateStatus(id, status);
      showToast(`Request ${status}!`, status==='approved'?'success':'error');
      loadRequests();
    } catch (err) { showToast(err.message||'Error', 'error'); }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    setFormErr('');
    const { title, clubId, date, venue } = form;
    if (!title||!clubId||!date||!venue) { setFormErr('Please fill in title, club, date and venue.'); return; }
    try {
      await api.createEvent(form);
      showToast('Event created!', 'success');
      setForm(f=>({...f, title:'', date:'', venue:'', description:''}));
      loadEvents();
    } catch (err) { setFormErr(err.message||'Failed to create event.'); }
  }

  async function handleDeleteEvent(id, title) {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await api.deleteEvent(id);
      showToast('Event deleted', 'info');
      loadEvents();
    } catch (err) { showToast(err.message||'Error','error'); }
  }

  return (
    <div className="page-wrapper">
      <div style={styles.wrap}>

        {/* Top bar */}
        <div style={styles.topBar}>
          <div>
            <h1 style={styles.h1}>Hello, <span style={{color:'var(--accent)'}}>{user?.name?.split(' ')[0]}</span> 👋</h1>
            <p style={{color:'var(--text-muted)',fontSize:'.88rem',marginTop:'.2rem'}}>
              {user?.role === 'admin' ? 'Admin Dashboard' : 'Coordinator Dashboard'}
            </p>
          </div>
          <span className={`badge ${user?.role==='admin'?'badge-red':'badge-purple'}`}>
            {user?.role === 'admin' ? 'Admin' : 'Coordinator'}
          </span>
        </div>

        {/* Club pills */}
        <div style={{marginBottom:'1.8rem'}}>
          <p style={styles.pillLabel}>Your Assigned Clubs</p>
          <div style={styles.pillRow}>
            <button onClick={()=>setActiveClub('all')} style={{...styles.pill,...(activeClub==='all'?styles.pillActive:{})}}>
              All Clubs
            </button>
            {assignedClubs.map(c=>(
              <button key={c._id} onClick={()=>setActiveClub(String(c._id))}
                style={{...styles.pill,...(activeClub===String(c._id)?styles.pillActive:{})}}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={styles.statsGrid}>
          {stats.map(s=>(
            <div key={s.label} className="glass-card" style={{padding:'1.4rem',textAlign:'center'}}>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:'2rem',fontWeight:900,color:'var(--accent)'}}>{s.val}</div>
              <div style={{fontSize:'.75rem',color:'var(--text-muted)',marginTop:'.25rem'}}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Two columns: Requests | Events */}
        <div style={styles.twoCol}>

          {/* Requests */}
          <div className="glass-card" style={{padding:'1.6rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.2rem',flexWrap:'wrap',gap:'.5rem'}}>
              <h2 style={styles.panelTitle}>Club & Event Requests</h2>
              <span className="badge badge-amber">{filteredReqs.filter(r=>r.status==='pending').length} pending</span>
            </div>
            {loadingReq ? <div className="spinner"/> : (
              <div style={{overflowX:'auto'}}>
                <table className="data-table">
                  <thead>
                    <tr><th>Student</th><th>Type</th><th>For</th><th>Status</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {filteredReqs.length === 0
                      ? <tr><td colSpan={5} style={{textAlign:'center',color:'var(--text-muted)',padding:'2rem'}}>No requests yet</td></tr>
                      : filteredReqs.map(r=>(
                          <tr key={r._id}>
                            <td>
                              <div style={{fontSize:'.82rem',fontWeight:500}}>{r.user?.name||'—'}</div>
                              <div style={{fontSize:'.7rem',color:'var(--text-muted)'}}>{r.user?.enrollment||''}</div>
                            </td>
                            <td><span className="badge badge-blue">{r.type}</span></td>
                            <td style={{fontSize:'.82rem'}}>{r.type==='club'?r.club?.name:r.event?.title}</td>
                            <td><span className={`badge ${STATUS_CLASS[r.status]||'badge-blue'}`}>{r.status}</span></td>
                            <td>
                              {r.status === 'pending'
                                ? <div style={{display:'flex',gap:'.35rem'}}>
                                    <button className="btn btn-success btn-sm" onClick={()=>handleStatus(r._id,'approved')}>✓</button>
                                    <button className="btn btn-danger btn-sm"  onClick={()=>handleStatus(r._id,'rejected')}>✗</button>
                                  </div>
                                : <span style={{fontSize:'.75rem',color:'var(--text-muted)'}}>Done</span>
                              }
                            </td>
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="glass-card" style={{padding:'1.6rem'}}>
            <h2 style={{...styles.panelTitle,marginBottom:'1.2rem'}}>Upcoming Events</h2>
            {loadingEvt ? <div className="spinner"/> :
              upcomingEvts.length === 0
                ? <div className="empty-state"><div className="icon">📅</div><p>No upcoming events</p></div>
                : upcomingEvts.slice(0,6).map(e=>{
                    const d = new Date(e.date);
                    return (
                      <div key={e._id} style={styles.evtRow}>
                        <div style={{textAlign:'center',minWidth:40}}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.6rem',fontWeight:900,color:'var(--accent)',lineHeight:1}}>{d.getDate()}</div>
                          <div style={{fontSize:'.65rem',textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-muted)'}}>{d.toLocaleString('default',{month:'short'})}</div>
                        </div>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'.95rem',fontWeight:600,marginBottom:'.15rem'}}>{e.title}</div>
                          <div style={{fontSize:'.75rem',color:'var(--text-muted)'}}>📍 {e.venue} · 🏛️ {e.clubName}</div>
                        </div>
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDeleteEvent(e._id,e.title)}>🗑</button>
                      </div>
                    );
                  })
            }
          </div>
        </div>

        {/* Create Event */}
        <div className="glass-card" style={{padding:'1.8rem'}}>
          <h2 style={{...styles.panelTitle,marginBottom:'1.4rem'}}>➕ Create New Event</h2>
          {formErr && <div className="error-box">{formErr}</div>}
          <form onSubmit={handleCreateEvent}>
            <div style={styles.formRow}>
              <div className="form-group">
                <label>Event Title</label>
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Annual Hackathon"/>
              </div>
              <div className="form-group">
                <label>Club</label>
                <select value={form.clubId} onChange={e=>setForm({...form,clubId:e.target.value})}>
                  {assignedClubs.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.formRow}>
              <div className="form-group">
                <label>Date & Time</label>
                <input type="datetime-local" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Venue</label>
                <input value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})} placeholder="e.g. Seminar Hall A"/>
              </div>
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <textarea rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Brief event description…" style={{resize:'vertical'}}/>
            </div>
            <button type="submit" className="btn btn-primary">Create Event</button>
          </form>
        </div>

      </div>
    </div>
  );
}

const styles = {
  wrap:      { maxWidth:1140, margin:'0 auto', padding:'2.5rem 1.5rem' },
  topBar:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2.5rem', flexWrap:'wrap', gap:'1rem' },
  h1:        { fontFamily:"'Playfair Display',serif", fontSize:'2rem' },
  pillLabel: { fontSize:'.76rem', color:'var(--text-muted)', marginBottom:'.6rem', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 },
  pillRow:   { display:'flex', flexWrap:'wrap', gap:'.5rem' },
  pill:      { padding:'.35rem 1rem', borderRadius:50, fontSize:'.78rem', fontWeight:600, cursor:'pointer', border:'1.5px solid var(--glass-border)', background:'transparent', color:'var(--text-muted)', transition:'all .2s' },
  pillActive:{ borderColor:'var(--accent)', color:'var(--accent)', background:'rgba(240,165,0,.1)' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem', marginBottom:'1.8rem' },
  twoCol:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.8rem' },
  panelTitle:{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem' },
  evtRow:    { display:'flex', gap:'1rem', alignItems:'flex-start', padding:'.7rem 0', borderBottom:'1px solid rgba(255,255,255,.05)' },
  formRow:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' },
};
