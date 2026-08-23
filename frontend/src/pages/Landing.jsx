// src/pages/Landing.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: '🔍', title: 'Discover Clubs',           desc: 'Browse all registered clubs across categories — tech, arts, sports, culture, and more.' },
  { icon: '📅', title: 'Event Calendar',            desc: "Never miss a hackathon, workshop, or fest. See all upcoming events with dates and venues." },
  { icon: '🎯', title: 'Smart Recommendations',    desc: 'Pick your interests once. Get clubs recommended that perfectly match your passion.' },
  { icon: '📝', title: 'Easy Registration',         desc: 'Register for clubs and events with one click. Track your request status in real-time.' },
  { icon: '🏆', title: 'Coordinator Tools',         desc: 'Manage your club, post events, and approve student requests — all from a clean dashboard.' },
  { icon: '📊', title: 'Admin Analytics',           desc: 'Full visibility into platform activity, user management, and club oversight for admins.' },
];

const roles = [
  { emoji:'🎓', title:'Students',    desc:'Explore clubs, register for events, and track your campus journey.' },
  { emoji:'🧑‍💼', title:'Coordinators', desc:'Manage your club, create events, and engage your members.' },
  { emoji:'⚙️', title:'Admins',      desc:'Oversee the whole platform, manage users and clubs.' },
];

export default function Landing() {
  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.eyebrow}>🎓 College Club & Event Management Platform</div>
        <h1 style={styles.h1}>Where Campus Life <em style={{fontStyle:'normal',color:'var(--accent)'}}>Comes Together</em></h1>
        <p style={styles.desc}>
          Discover clubs, attend events, and build your college experience — all in one place.
          Students explore, coordinators manage, and admins govern seamlessly.
        </p>
        <div style={styles.cta}>
          <Link to="/login" className="btn btn-primary">Get Started →</Link>
          <a href="#features" className="btn btn-outline">Learn More</a>
        </div>
        <div style={styles.statsRow}>
          {[['50+','Active Clubs'],['200+','Events/Year'],['3K+','Students'],['12','Categories']].map(([n,l])=>(
            <div key={l} style={styles.statPill} className="glass-card">
              <span style={{fontFamily:"'Playfair Display',serif",fontSize:'1.3rem',fontWeight:700,color:'var(--accent)'}}>{n}</span>
              <span style={{fontSize:'.78rem',color:'var(--text-muted)'}}>{l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{padding:'5rem 2rem',position:'relative',zIndex:1}}>
        <div style={{maxWidth:1100,margin:'0 auto'}}>
          <p style={{textAlign:'center',color:'var(--text-muted)',fontSize:'.78rem',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:'.5rem'}}>WHAT YOU CAN DO</p>
          <h2 className="section-title" style={{textAlign:'center',marginBottom:'2.5rem'}}>Everything in one platform</h2>
          <div style={styles.featGrid}>
            {features.map(f=>(
              <div key={f.title} className="glass-card" style={{padding:'1.8rem'}}>
                <div style={styles.featIcon}>{f.icon}</div>
                <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.1rem',marginBottom:'.5rem'}}>{f.title}</h3>
                <p style={{fontSize:'.85rem',color:'var(--text-muted)',lineHeight:1.6}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section style={{padding:'4rem 2rem 6rem',textAlign:'center',position:'relative',zIndex:1}}>
        <p style={{color:'var(--text-muted)',fontSize:'.78rem',letterSpacing:'.1em',textTransform:'uppercase',marginBottom:'.5rem'}}>THREE WAYS TO JOIN</p>
        <h2 className="section-title" style={{marginBottom:'2.5rem'}}>Who uses EduEvent?</h2>
        <div style={styles.rolesRow}>
          {roles.map(r=>(
            <div key={r.title} className="glass-card" style={{width:220,padding:'2rem 1.5rem',textAlign:'center'}}>
              <span style={{fontSize:'2.4rem',display:'block',marginBottom:'.8rem'}}>{r.emoji}</span>
              <h4 style={{fontSize:'1rem',fontWeight:600,marginBottom:'.4rem'}}>{r.title}</h4>
              <p style={{fontSize:'.8rem',color:'var(--text-muted)'}}>{r.desc}</p>
            </div>
          ))}
        </div>
        <div style={{marginTop:'3rem'}}>
          <Link to="/login" className="btn btn-primary">Start Exploring →</Link>
        </div>
      </section>

      <footer style={{textAlign:'center',padding:'2rem',borderTop:'1px solid var(--glass-border)',color:'var(--text-muted)',fontSize:'.78rem',position:'relative',zIndex:1}}>
        © 2025 EduEvent Manager · Built for College Students & Educators
      </footer>
    </div>
  );
}

const styles = {
  hero:     { minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',padding:'6rem 1.5rem 4rem' },
  eyebrow:  { display:'inline-flex',alignItems:'center',gap:'.5rem',background:'rgba(37,99,235,.08)',border:'1px solid rgba(37,99,235,.22)',color:'var(--accent)',padding:'.35rem 1rem',borderRadius:'50px',fontSize:'.76rem',fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:'1.8rem' },
  h1:       { fontFamily:"'Playfair Display',serif",fontSize:'clamp(2.8rem,6vw,4.8rem)',fontWeight:900,lineHeight:1.1,marginBottom:'1.4rem',maxWidth:800 },
  desc:     { fontSize:'1rem',color:'var(--text-muted)',maxWidth:560,lineHeight:1.7,marginBottom:'2.5rem' },
  cta:      { display:'flex',gap:'1rem',flexWrap:'wrap',justifyContent:'center' },
  statsRow: { display:'flex',gap:'1.5rem',marginTop:'4rem',flexWrap:'wrap',justifyContent:'center' },
  statPill: { display:'flex',alignItems:'center',gap:'.5rem',padding:'.55rem 1.2rem',borderRadius:'50px' },
  featGrid: { display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'1.4rem' },
  featIcon: { width:48,height:48,borderRadius:12,background:'rgba(37,99,235,.08)',border:'1px solid rgba(37,99,235,.18)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',marginBottom:'1.1rem' },
  rolesRow: { display:'flex',gap:'1.5rem',justifyContent:'center',flexWrap:'wrap' },
};

