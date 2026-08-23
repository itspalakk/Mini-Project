// src/pages/StaffDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';
import DashboardSidebar from '../components/DashboardSidebar';

const STATUS_CLASS = { pending:'badge-amber', approved:'badge-green', rejected:'badge-red' };

export default function StaffDashboard() {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const location      = useLocation();

  const [activeClub, setActiveClub] = useState('all');
  const [requests,   setRequests]   = useState([]);
  const [events,     setEvents]     = useState([]);
  const [loadingReq, setLoadingReq] = useState(true);
  const [loadingEvt, setLoadingEvt] = useState(true);
  const [form, setForm] = useState({ title:'', clubId:'', date:'', venue:'', description:'' });
  const [eventPoster, setEventPoster] = useState(null);
  const [formErr, setFormErr] = useState('');

  // Modal State for Approval/Rejection with message
  const [selectedReq,      setSelectedReq]      = useState(null);
  const [targetStatus,     setTargetStatus]     = useState('');
  const [coordMessage,     setCoordMessage]     = useState('');
  const [submittingStatus, setSubmittingStatus] = useState(false);

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
    if (assignedClubs.length > 0) setForm(f=>({...f, clubId: assignedClubs[0]._id}));
  }, []);

  const filteredReqs = activeClub === 'all' ? requests : requests.filter(r => {
    const cid = r.type === 'club' ? r.club?._id : r.event?.club;
    return String(cid) === activeClub;
  });

  const upcomingEvts = events.filter(e => new Date(e.date) > new Date() &&
    (activeClub === 'all' || String(e.clubId) === activeClub)
  );

  const stats = [
    { label:'Assigned Clubs',   val: assignedClubs.length },
    { label:'Pending Requests', val: requests.filter(r=>r.status==='pending').length },
    { label:'Active Events',    val: events.filter(e=>new Date(e.date)>new Date()).length },
    { label:'Approved Members', val: requests.filter(r=>r.status==='approved').length },
  ];

  const activeSection = location.hash.replace('#', '');
  const showHome = !activeSection;
  const showRequests = activeSection === 'requests-panel';
  const showCreateEvent = activeSection === 'create-event';

  function openStatusModal(req, status) {
    setSelectedReq(req);
    setTargetStatus(status);
    setCoordMessage(
      status === 'approved'
        ? 'Congratulations! Your registration has been approved. We look forward to your participation.'
        : 'Thank you for your application. Unfortunately, your registration request was not approved at this time.'
    );
  }

  async function handleConfirmStatus() {
    if (!selectedReq || !targetStatus) return;
    setSubmittingStatus(true);
    try {
      await api.updateStatus(selectedReq._id, targetStatus, coordMessage);
      showToast(`Request ${targetStatus} and email notification sent!`, targetStatus === 'approved' ? 'success' : 'error');
      setSelectedReq(null);
      setCoordMessage('');
      loadRequests();
    } catch (err) {
      showToast(err.message || 'Error updating status', 'error');
    } finally {
      setSubmittingStatus(false);
    }
  }

  async function handleCreateEvent(e) {
    e.preventDefault();
    setFormErr('');

    const { title, clubId, date, venue, description } = form;

    if (!title || !clubId || !date || !venue) {
      setFormErr('Please fill in title, club, date and venue.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('clubId', clubId);
      formData.append('date', date);
      formData.append('venue', venue);
      formData.append('description', description || '');

      if (eventPoster) {
        formData.append('poster', eventPoster);
      }

      await api.createEvent(formData);

      showToast('Event created!', 'success');
      setForm(f=>({...f, title:'', date:'', venue:'', description:''}));
      setEventPoster(null);
      loadEvents();
    } catch (err) {
      setFormErr(err.message || 'Failed to create event.');
    }
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
  {(showHome || showRequests) && (
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
  )}

  {/* Stats */}
  {showHome && (
  <div style={styles.statsGrid}>
    {stats.map(s=>(
      <div key={s.label} className="glass-card" style={{padding:'1.4rem',textAlign:'center'}}>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:'2rem',fontWeight:900,color:'var(--accent)'}}>{s.val}</div>
        <div style={{fontSize:'.75rem',color:'var(--text-muted)',marginTop:'.25rem'}}>{s.label}</div>
      </div>
    ))}
  </div>
  )}

  {/* Staff dashboard sections */}
  {(showHome || showRequests) && (
  <div style={showRequests ? styles.singleCol : styles.twoCol}>

    {/* Requests */}
    {showRequests && (
    <div id="requests-panel" className="glass-card" style={{padding:'1.6rem'}}>
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
                              <button className="btn btn-success btn-sm" onClick={()=>openStatusModal(r,'approved')} title="Approve Request">✓</button>
                              <button className="btn btn-danger btn-sm"  onClick={()=>openStatusModal(r,'rejected')} title="Reject Request">✗</button>
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
    )}

    {/* Upcoming Events */}
    {showHome && (
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
    )}
  </div>
  )}

  {/* Create Event */}
  {showCreateEvent && (
  <div id="create-event" className="glass-card" style={{padding:'1.8rem'}}>
    <h2 style={{...styles.panelTitle,marginBottom:'1.4rem'}}>➕ Create New Event</h2>
    {formErr && <div className="error-box">{formErr}</div>}
    <form onSubmit={handleCreateEvent} encType="multipart/form-data">
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

      <div className="form-group">
        <label>Event Poster / Image</label>
        <label style={styles.posterUploadBox}>
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={e=>setEventPoster(e.target.files[0] || null)}
          />
          <span style={styles.posterIcon}>📷</span>
          <span style={styles.posterText}>
            {eventPoster ? eventPoster.name : 'Click to upload event poster'}
          </span>
        </label>
      </div>

      <button type="submit" className="btn btn-primary">Create Event</button>
    </form>
  </div>
  )}

  {/* Modal for Approval/Rejection & Coordinator Message */}
  {selectedReq && (
    <div style={styles.modalBackdrop}>
      <div className="glass-card" style={styles.modalContent}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',color:'var(--text-light)'}}>
            {targetStatus === 'approved' ? '✅ Approve Registration' : '❌ Reject Registration'}
          </h3>
          <button
            onClick={()=>setSelectedReq(null)}
            style={{background:'none',border:'none',color:'var(--text-muted)',fontSize:'1.3rem',cursor:'pointer'}}
          >
            ✕
          </button>
        </div>

        <div style={{fontSize:'.88rem',color:'var(--text-muted)',marginBottom:'1rem',lineHeight:1.5}}>
          <div><strong>Student:</strong> {selectedReq.user?.name} ({selectedReq.user?.email || 'No email'})</div>
          <div><strong>Request For:</strong> {selectedReq.type === 'club' ? selectedReq.club?.name : selectedReq.event?.title} ({selectedReq.type})</div>
        </div>

        <div className="form-group" style={{marginBottom:'1.5rem'}}>
          <label style={{fontWeight:600,fontSize:'.85rem',display:'block',marginBottom:'.4rem'}}>
            ✉️ Message to Student (Included in Email Notification):
          </label>
          <textarea
            rows={4}
            value={coordMessage}
            onChange={e=>setCoordMessage(e.target.value)}
            placeholder="Type custom note or message to the student..."
            style={{
              width:'100%',
              padding:'.75rem',
              borderRadius:8,
              border:'1px solid var(--glass-border)',
              background:'#fff',
              color:'var(--text-light)',
              fontSize:'.88rem',
              fontFamily:'inherit',
              resize:'vertical'
            }}
          />
        </div>

        <div style={{display:'flex',justifyContent:'flex-end',gap:'.75rem'}}>
          <button
            type="button"
            className="btn"
            onClick={()=>setSelectedReq(null)}
            style={{background:'#fff',color:'var(--primary)',border:'1px solid var(--glass-border)'}}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn ${targetStatus === 'approved' ? 'btn-success' : 'btn-danger'}`}
            onClick={handleConfirmStatus}
            disabled={submittingStatus}
          >
            {submittingStatus ? 'Sending...' : targetStatus === 'approved' ? 'Approve & Send Email' : 'Reject & Send Email'}
          </button>
        </div>
      </div>
    </div>
  )}

    </div>
  );
}

const styles = {
  wrap:      { maxWidth:1140, margin:'0 auto', padding:'1rem 0 2.5rem' },
  topBar:    { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'2.5rem', flexWrap:'wrap', gap:'1rem' },
  h1:        { fontFamily:"'Playfair Display',serif", fontSize:'2rem' },
  pillLabel: { fontSize:'.76rem', color:'var(--text-muted)', marginBottom:'.6rem', textTransform:'uppercase', letterSpacing:'.06em', fontWeight:600 },
  pillRow:   { display:'flex', flexWrap:'wrap', gap:'.5rem' },
  pill:      { padding:'.35rem 1rem', borderRadius:50, fontSize:'.78rem', fontWeight:600, cursor:'pointer', border:'1.5px solid var(--glass-border)', background:'transparent', color:'var(--text-muted)', transition:'all .2s' },
  pillActive:{ borderColor:'var(--accent)', color:'var(--accent)', background:'rgba(37,99,235,.08)' },
  statsGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:'1rem', marginBottom:'1.8rem' },
  twoCol:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.8rem' },
  singleCol: { display:'grid', gridTemplateColumns:'1fr', gap:'1.5rem', marginBottom:'1.8rem' },
  panelTitle:{ fontFamily:"'Playfair Display',serif", fontSize:'1.15rem' },
  evtRow:    { display:'flex', gap:'1rem', alignItems:'flex-start', padding:'.7rem 0', borderBottom:'1px solid rgba(255,255,255,.05)' },
  formRow:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' },

  posterUploadBox: {
    minHeight: 118,
    border: '1px dashed #cbd5e1',
    borderRadius: 14,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    cursor: 'pointer',
    color: 'var(--text-muted)',
    background: 'rgba(255,255,255,.03)',
    marginBottom: '1rem',
    padding: '1rem',
    textAlign: 'center',
  },
  posterIcon: {
    fontSize: '1.7rem',
  },
  posterText: {
    fontSize: '.88rem',
    wordBreak: 'break-word',
  },

  // Modal styles
  modalBackdrop: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modalContent: {
    width: '100%',
    maxWidth: 520,
    padding: '1.8rem',
    borderRadius: 8,
    border: '1px solid var(--glass-border)',
    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.24)',
  },
};





