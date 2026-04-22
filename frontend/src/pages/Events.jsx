// src/pages/Events.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

export default function Events() {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const isStaff       = user?.role !== 'student';

  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('');   // '' | 'upcoming' | 'past'
  const [showModal, setShowModal] = useState(false);
  const [clubs,     setClubs]     = useState([]);
  const [form,      setForm]      = useState({ title:'', description:'', clubId:'', date:'', venue:'' });
  const [formErr,   setFormErr]   = useState('');

  useEffect(() => {
    loadEvents();
    if (isStaff) api.getClubs().then(c=>{ setClubs(c); if(c[0]) setForm(f=>({...f,clubId:c[0]._id})); }).catch(()=>{});
  }, []);

  async function loadEvents() {
    setLoading(true);
    try { setEvents(await api.getEvents()); }
    catch { showToast('Could not load events','error'); }
    finally { setLoading(false); }
  }

  async function registerEvent(id, title) {
    try {
      await api.registerEvent(id);
      showToast(`Registered for "${title}"!`,'success');
    } catch (err) { showToast(err.message||'Error','error'); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormErr('');
    const { title, clubId, date, venue } = form;
    if (!title||!clubId||!date||!venue) { setFormErr('Title, club, date and venue are required.'); return; }
    try {
      await api.createEvent(form);
      showToast('Event created!','success');
      setShowModal(false);
      setForm(f=>({...f,title:'',date:'',venue:'',description:''}));
      loadEvents();
    } catch (err) { setFormErr(err.message||'Error'); }
  }

  const now = new Date();
  const filtered = events.filter(e => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || (e.venue||'').toLowerCase().includes(search.toLowerCase());
    const past = new Date(e.date) < now;
    const matchFilter = !filter || (filter==='upcoming'&&!past) || (filter==='past'&&past);
    return matchSearch && matchFilter;
  });

  function fmtDate(ds) {
    const d = new Date(ds);
    return { day:d.getDate().toString().padStart(2,'0'), month:d.toLocaleString('default',{month:'short'}).toUpperCase(), time:d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}), year:d.getFullYear(), past:d<now };
  }

  return (
    <div className="page-wrapper">
      <div style={styles.wrap}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 className="section-title">Campus Events</h1>
            <p className="section-sub">{isStaff ? 'Events for your assigned clubs' : 'Workshops, hackathons, fests & more'}</p>
          </div>
          <div style={styles.filterBar}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search events…" style={styles.filterInput}/>
            <select value={filter} onChange={e=>setFilter(e.target.value)} style={styles.filterInput}>
              <option value="">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
            {isStaff && <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}>+ Create Event</button>}
          </div>
        </div>

        {/* Grid */}
        {loading ? <div className="spinner"/> : (
          <div style={styles.grid}>
            {filtered.length === 0
              ? <div className="empty-state" style={{gridColumn:'1/-1'}}><div className="icon">📅</div><p>No events found</p></div>
              : filtered.map(e=>{
                  const f = fmtDate(e.date);
                  return (
                    <div key={e._id} className="glass-card" style={styles.card}>
                      {/* Date banner */}
                      <div style={styles.banner}>
                        <div style={{textAlign:'center',minWidth:40}}>
                          <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.7rem',fontWeight:900,color:'var(--accent)',lineHeight:1}}>{f.day}</div>
                          <div style={{fontSize:'.65rem',textTransform:'uppercase',letterSpacing:'.08em',color:'var(--text-muted)'}}>{f.month}</div>
                        </div>
                        <div style={{width:1,height:34,background:'var(--glass-border)'}}/>
                        <div>
                          <div style={{fontSize:'.75rem',color:'var(--text-muted)'}}>⏰ {f.time} · {f.year}</div>
                          <div style={{fontSize:'.72rem',color:'var(--accent)',fontWeight:600}}>🏛️ {e.clubName}</div>
                        </div>
                      </div>
                      {/* Body */}
                      <div style={styles.body}>
                        <h3 style={{fontSize:'1rem',fontWeight:600}}>{e.title}</h3>
                        <p style={{fontSize:'.78rem',color:'var(--text-muted)'}}>📍 {e.venue||'TBD'}</p>
                        {e.description && <p style={{fontSize:'.8rem',color:'var(--text-muted)',lineHeight:1.5,flex:1}}>{e.description}</p>}
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'auto'}}>
                          <span style={{fontSize:'.74rem',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:'.3rem'}}>
                            <span style={{width:7,height:7,borderRadius:'50%',background:f.past?'#888':'var(--success)',display:'inline-block'}}/>
                            {f.past?'Concluded':'Upcoming'}
                          </span>
                          {!f.past && !isStaff && <button className="btn btn-primary btn-sm" onClick={()=>registerEvent(e._id,e.title)}>Register</button>}
                          {f.past  && <span className="badge badge-red">Closed</span>}
                          {!f.past && isStaff && <span className="badge badge-green">Your Event</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div className="modal-box">
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',marginBottom:'1.4rem'}}>Create New Event</h3>
            {formErr && <div className="error-box">{formErr}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Event Title</label>
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Annual Hackathon"/>
              </div>
              <div className="form-group">
                <label>Club</label>
                <select value={form.clubId} onChange={e=>setForm({...form,clubId:e.target.value})}>
                  {clubs.map(c=><option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Date & Time</label>
                <input type="datetime-local" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
              </div>
              <div className="form-group">
                <label>Venue</label>
                <input value={form.venue} onChange={e=>setForm({...form,venue:e.target.value})} placeholder="e.g. Seminar Hall A"/>
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{resize:'vertical'}}/>
              </div>
              <div style={{display:'flex',gap:'.6rem',justifyContent:'flex-end',marginTop:'1rem'}}>
                <button type="button" className="btn btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrap:        { maxWidth:1100, margin:'0 auto', padding:'2.5rem 1.5rem' },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' },
  filterBar:   { display:'flex', gap:'.6rem', flexWrap:'wrap', alignItems:'center' },
  filterInput: { padding:'.55rem .95rem', borderRadius:50, border:'1.5px solid var(--glass-border)', background:'var(--card-bg)', color:'var(--text-light)', fontFamily:"'DM Sans',sans-serif", fontSize:'.85rem', outline:'none' },
  grid:        { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:'1.4rem' },
  card:        { overflow:'hidden', display:'flex', flexDirection:'column' },
  banner:      { background:'linear-gradient(135deg,rgba(240,165,0,.2),rgba(224,95,44,.1))', borderBottom:'1px solid rgba(240,165,0,.18)', padding:'.85rem 1.3rem', display:'flex', alignItems:'center', gap:'.85rem' },
  body:        { padding:'1.3rem', flex:1, display:'flex', flexDirection:'column', gap:'.55rem' },
};
