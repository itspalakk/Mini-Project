// src/pages/Events.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

const API_ORIGIN = 'http://localhost:5000';
const DESCRIPTION_LIMIT = 170;

export default function Events() {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const isStaff       = user?.role === 'admin' || user?.role === 'coordinator';
  const isManager     = user?.role === 'club_manager';

  const [events,    setEvents]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [clubs,     setClubs]     = useState([]);
  const [form,      setForm]      = useState({ title:'', description:'', clubId:'', date:'', venue:'' });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState('');
  const [formErr,   setFormErr]   = useState('');

  useEffect(() => {
    loadEvents();
    if (isStaff) {
      api.getClubs()
        .then(c => {
          setClubs(c);
          if (c[0]) setForm(f => ({ ...f, clubId: c[0]._id }));
        })
        .catch(() => {});
    }
  }, []);

  async function loadEvents() {
    setLoading(true);
    try {
      setEvents(await api.getEvents());
    } catch {
      showToast('Could not load events','error');
    } finally {
      setLoading(false);
    }
  }

  async function registerEvent(id, title) {
    try {
      await api.registerEvent(id);
      showToast(`Registered for "${title}"!`,'success');
    } catch (err) {
      showToast(err.message || 'Error','error');
    }
  }

  async function deleteClosedEvent(id, title) {
    if (!window.confirm(`Delete closed event "${title}"?`)) return;

    try {
      await api.deleteEvent(id);
      showToast('Closed event deleted successfully', 'info');
      setSelectedEvent(null);
      loadEvents();
    } catch (err) {
      showToast(err.message || 'Failed to delete event', 'error');
    }
  }

  function handlePosterChange(e) {
    const file = e.target.files[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormErr('');

    const { title, clubId, date, venue, description } = form;

    if (!title || !clubId || !date || !venue) {
      setFormErr('Title, club, date and venue are required.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('clubId', clubId);
      formData.append('date', date);
      formData.append('venue', venue);
      formData.append('description', description || '');

      if (posterFile) {
        formData.append('poster', posterFile);
      }

      await api.createEvent(formData);

      showToast('Event created!','success');
      setShowModal(false);
      setForm(f => ({ ...f, title:'', date:'', venue:'', description:'' }));
      setPosterFile(null);
      setPosterPreview('');
      loadEvents();
    } catch (err) {
      setFormErr(err.message || 'Error');
    }
  }

  function getPosterSrc(e) {
    if (e.posterUrl) return `${API_ORIGIN}${e.posterUrl}`;
    if (e.image) return e.image;
    return '';
  }

  function getShortDescription(description) {
    if (!description) return '';
    if (description.length <= DESCRIPTION_LIMIT) return description;
    return `${description.slice(0, DESCRIPTION_LIMIT).trim()}... see more`;
  }

  const now = new Date();

  const filtered = events.filter(e => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.venue || '').toLowerCase().includes(search.toLowerCase());

    const past = new Date(e.date) < now;
    const matchFilter = !filter || (filter === 'upcoming' && !past) || (filter === 'past' && past);

    return matchSearch && matchFilter;
  });

  function fmtDate(ds) {
    const d = new Date(ds);
    return {
      day: d.getDate().toString().padStart(2,'0'),
      month: d.toLocaleString('default',{month:'short'}).toUpperCase(),
      time: d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),
      year: d.getFullYear(),
      past: d < now
    };
  }

  return (
    <>
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div>
          <h1 className="section-title">Campus Events</h1>
          <p className="section-sub">{isStaff ? 'Events for your assigned clubs' : isManager ? 'All campus events' : 'Workshops, hackathons, fests & more'}</p>
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

      {loading ? <div className="spinner"/> : (
        <div style={styles.grid}>
          {filtered.length === 0
            ? <div className="empty-state" style={{gridColumn:'1/-1'}}><div className="icon">📅</div><p>No events found</p></div>
            : filtered.map(e => {
                const f = fmtDate(e.date);
                const posterSrc = getPosterSrc(e);

                return (
                  <div
                    key={e._id}
                    className="glass-card"
                    style={styles.card}
                    onClick={() => setSelectedEvent(e)}
                  >
                    <div style={styles.posterFrame}>
                      {posterSrc ? (
                        <img src={posterSrc} alt={e.title} style={styles.poster} />
                      ) : (
                        <div style={styles.posterPlaceholder}>
                          <span>Campus Event</span>
                        </div>
                      )}
                    </div>

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

                    <div style={styles.body}>
                      <h3 style={{fontSize:'1rem',fontWeight:600}}>{e.title}</h3>
                      <p style={{fontSize:'.78rem',color:'var(--text-muted)'}}>📍 {e.venue || 'TBD'}</p>

                      {e.description && (
                        <p style={styles.descriptionPreview}>
                          {getShortDescription(e.description)}
                        </p>
                      )}

                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'auto'}}>
                        <span style={{fontSize:'.74rem',color:'var(--text-muted)',display:'flex',alignItems:'center',gap:'.3rem'}}>
                          <span style={{width:7,height:7,borderRadius:'50%',background:f.past?'#888':'var(--success)',display:'inline-block'}}/>
                          {f.past ? 'Concluded' : 'Upcoming'}
                        </span>

                        {!f.past && !isStaff && !isManager && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              registerEvent(e._id, e.title);
                            }}
                          >
                            Register
                          </button>
                        )}

                        {f.past && !isStaff && <span className="badge badge-red">Closed</span>}
                        {f.past && isStaff && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={(event) => {
                              event.stopPropagation();
                              deleteClosedEvent(e._id, e.title);
                            }}
                          >
                            Delete
                          </button>
                        )}
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

    {selectedEvent && (
      <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
        <div
          className="modal-box"
          style={styles.eventDetailModal}
          onClick={(e) => e.stopPropagation()}
        >
          {getPosterSrc(selectedEvent) ? (
            <img
              src={getPosterSrc(selectedEvent)}
              alt={selectedEvent.title}
              style={styles.detailPoster}
            />
          ) : (
            <div style={styles.detailPosterPlaceholder}>
              Campus Event
            </div>
          )}

          <div style={styles.detailContent}>
            <h2 style={styles.detailTitle}>{selectedEvent.title}</h2>
            <p style={styles.detailMeta}>🏛️ {selectedEvent.clubName}</p>
            <p style={styles.detailMeta}>📍 {selectedEvent.venue || 'TBD'}</p>
            <p style={styles.detailMeta}>⏰ {new Date(selectedEvent.date).toLocaleString()}</p>

            {selectedEvent.description && (
              <p style={styles.detailDescription}>{selectedEvent.description}</p>
            )}

            <div style={{display:'flex',justifyContent:'flex-end',gap:'.7rem',marginTop:'1.2rem'}}>
              {isStaff && new Date(selectedEvent.date) < now && (
                <button
                  className="btn btn-danger"
                  onClick={() => deleteClosedEvent(selectedEvent._id, selectedEvent.title)}
                >
                  Delete Closed Event
                </button>
              )}
              <button className="btn btn-outline" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {showModal && (
      <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
        <div className="modal-box" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',marginBottom:'1.4rem'}}>Create New Event</h3>
          {formErr && <div className="error-box">{formErr}</div>}

          <form onSubmit={handleCreate} encType="multipart/form-data">
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

            <div className="form-group">
              <label>Event Poster / Image</label>

              {posterPreview ? (
                <div style={styles.previewBox}>
                  <img src={posterPreview} alt="Preview" style={styles.previewImage} />
                  <button
                    type="button"
                    onClick={() => {
                      setPosterFile(null);
                      setPosterPreview('');
                    }}
                    style={styles.removeImageBtn}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <label style={styles.uploadBox}>
                  <span style={{ fontSize: '1.4rem', display: 'block', marginBottom: '0.3rem' }}>📷</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Click to upload event poster</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterChange}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>

            <div style={{display:'flex',gap:'.6rem',justifyContent:'flex-end',marginTop:'1rem'}}>
              <button type="button" className="btn btn-outline" onClick={()=>setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create</button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}

const styles = {
  wrap:        { maxWidth:1100, margin:'0 auto', padding:'1rem 0 2.5rem' },
  header:      { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'2rem', flexWrap:'wrap', gap:'1rem' },
  filterBar:   { display:'flex', gap:'.6rem', flexWrap:'wrap', alignItems:'center' },
  filterInput: { padding:'.55rem .95rem', borderRadius:50, border:'1.5px solid var(--glass-border)', background:'var(--card-bg)', color:'var(--text-light)', fontFamily:"'DM Sans',sans-serif", fontSize:'.85rem', outline:'none' },

  grid:        { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:'1.4rem', alignItems:'stretch' },
  card:        { overflow:'hidden', display:'flex', flexDirection:'column', minHeight:560, cursor:'pointer' },
  posterFrame: { width:'100%', height:230, background:'rgba(255,255,255,.04)', borderBottom:'1px solid rgba(255,255,255,.08)' },
  poster:      { width:'100%', height:'100%', objectFit:'cover', display:'block' },
  posterPlaceholder: {
    width:'100%',
    height:'100%',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    color:'var(--text-muted)',
    fontFamily:"'Playfair Display',serif",
    fontSize:'1.2rem',
    background:'linear-gradient(135deg,rgba(37,99,235,.08),rgba(255,255,255,.04))',
  },
  banner:      { background:'linear-gradient(135deg,rgba(37,99,235,.1),rgba(15,118,110,.08))', borderBottom:'1px solid rgba(37,99,235,.1)', padding:'.85rem 1.3rem', display:'flex', alignItems:'center', gap:'.85rem' },
  body:        { padding:'1.3rem', flex:1, display:'flex', flexDirection:'column', gap:'.55rem' },
  descriptionPreview: {
    fontSize: '.8rem',
    color: 'var(--text-muted)',
    lineHeight: 1.5,
    flex: 1,
    overflow: 'hidden',
  },
  uploadBox:   { border:'1.5px dashed var(--glass-border)', borderRadius:10, padding:'1.2rem', textAlign:'center', cursor:'pointer', background:'rgba(255,255,255,.03)', display:'block' },
  previewBox:  { position:'relative', marginTop:'.5rem', borderRadius:8, overflow:'hidden', height:140, border:'1.5px dashed var(--accent)' },
  previewImage:{ width:'100%', height:'100%', objectFit:'cover' },
  removeImageBtn: {
    position:'absolute',
    top:8,
    right:8,
    background:'rgba(231,76,60,.9)',
    border:'none',
    color:'var(--text-light)',
    borderRadius:'50%',
    width:24,
    height:24,
    cursor:'pointer',
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    fontSize:'.8rem',
    fontWeight:'bold',
  },
 eventDetailModal: {
  width:'92%',
  maxWidth:760,
  padding:0,
  overflowY:'auto',
  overflowX:'hidden',
  maxHeight:'90vh',
},
  detailPoster: {
  width:'100%',
  maxHeight:320,
  objectFit:'contain',
  background:'#07152a',
  display:'block',
},
  detailPosterPlaceholder: {
    height:260,
    display:'flex',
    alignItems:'center',
    justifyContent:'center',
    background:'linear-gradient(135deg,rgba(37,99,235,.09),rgba(255,255,255,.05))',
    color:'var(--text-muted)',
    fontFamily:"'Playfair Display',serif",
    fontSize:'1.5rem',
  },
  detailContent: {
    padding:'1.4rem 1.6rem 1.5rem',
  },
  detailTitle: {
    fontFamily:"'Playfair Display',serif",
    fontSize:'1.7rem',
    marginBottom:'.75rem',
  },
  detailMeta: {
    color:'var(--text-muted)',
    fontSize:'.9rem',
    marginTop:'.35rem',
  },
  detailDescription: {
    color:'var(--text-light)',
    fontSize:'.95rem',
    lineHeight:1.6,
    marginTop:'1rem',
  },
};

