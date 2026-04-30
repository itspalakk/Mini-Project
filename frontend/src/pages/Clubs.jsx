// src/pages/Clubs.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

const EMOJIS = {Technology:'💻','Arts & Culture':'🎨',Sports:'⚽',Music:'🎵',Science:'🔬',Literature:'📚',Photography:'📷',Dance:'💃',Entrepreneurship:'🚀','Social Service':'🤝',Gaming:'🎮','Debate & MUN':'🎙️',Film:'🎬',Environment:'🌱',Finance:'📈'};
const CATS = ['Technology','Arts & Culture','Sports','Music','Science','Literature','Photography','Dance','Entrepreneurship','Social Service','Gaming','Debate & MUN','Film','Environment','Finance'];

export default function Clubs() {
  const { user }      = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();
  const isStaff       = user?.role !== 'student';

  const [clubs,     setClubs]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [category,  setCategory]  = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form,      setForm]      = useState({ name:'', description:'', category:'Technology' });
  const [formErr,   setFormErr]   = useState('');

  useEffect(() => { loadClubs(); }, []);

  async function loadClubs() {
    setLoading(true);
    try { setClubs(await api.getClubs()); }
    catch { showToast('Could not load clubs','error'); }
    finally { setLoading(false); }
  }

  async function registerClub(clubId, name) {
    try {
      await api.registerClub(clubId);
      showToast(`Request sent for "${name}"!`, 'success');
    } catch (err) { showToast(err.message||'Error','error'); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setFormErr('');
    if (!form.name || !form.description) { setFormErr('Please fill in all fields.'); return; }
    try {
      await api.createClub(form);
      showToast('Club created!','success');
      setShowModal(false);
      setForm({ name:'', description:'', category:'Technology' });
      loadClubs();
    } catch (err) { setFormErr(err.message||'Error'); }
  }

  const filtered = clubs.filter(c =>
    (c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())) &&
    (!category || c.category === category)
  );

  return (
    <div className="page-wrapper">
      <div style={styles.wrap}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 className="section-title">Campus Clubs</h1>
            <p className="section-sub">{isStaff ? 'Your assigned clubs' : 'Discover your community'}</p>
          </div>
          <div style={styles.filterBar}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search clubs…" style={styles.filterInput}/>
            <select value={category} onChange={e=>setCategory(e.target.value)} style={styles.filterInput}>
              <option value="">All Categories</option>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select>
            {isStaff && <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}>+ Create Club</button>}
          </div>
        </div>

        {/* Grid */}
        {loading ? <div className="spinner"/> : (
          <div style={styles.grid}>
            {filtered.length === 0
              ? <div className="empty-state" style={{gridColumn:'1/-1'}}><div className="icon">🏛️</div><p>No clubs found</p></div>
              : filtered.map(c=>(
                  <div key={c._id} className="glass-card" style={{...styles.card, cursor:'pointer'}} onClick={() => navigate(`/clubs/${c._id}`)}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'.8rem'}}>
                      <div style={styles.emojiBox}>{EMOJIS[c.category]||'🏛️'}</div>
                      <span className="badge badge-amber">{c.category}</span>
                    </div>
                    <h3 style={{fontSize:'1.02rem',fontWeight:600,marginBottom:'.4rem'}}>{c.name}</h3>
                    <p style={{fontSize:'.82rem',color:'var(--text-muted)',lineHeight:1.6,flex:1,marginBottom:'.9rem'}}>{c.description}</p>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span className="badge badge-blue">👥 {c.memberCount||0} members</span>
                      {isStaff
                        ? <span className="badge badge-green">Your Club</span>
                        : <button className="btn btn-primary btn-sm" onClick={(e)=>{e.stopPropagation(); registerClub(c._id,c.name)}}>Register</button>
                      }
                    </div>
                  </div>
                ))
            }
          </div>
        )}
      </div>

      {/* Create Club Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div className="modal-box">
            <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',marginBottom:'1.4rem'}}>Create New Club</h3>
            {formErr && <div className="error-box">{formErr}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label>Club Name</label>
                <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Robotics Club"/>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{resize:'vertical'}}/>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                  {CATS.map(c=><option key={c}>{c}</option>)}
                </select>
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
  grid:        { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1.4rem' },
  card:        { padding:'1.7rem', display:'flex', flexDirection:'column' },
  emojiBox:    { width:48, height:48, borderRadius:12, background:'rgba(240,165,0,.12)', border:'1px solid rgba(240,165,0,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.4rem' },
};
