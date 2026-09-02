// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../utils/api';

const sendGAEvent = (eventName, params = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params
  });
};

const ROLES = ['student','coordinator','admin','club_manager'];
const ROLE_LABELS = { student:'🎓 Student', coordinator:'🧑‍💼 Coordinator', admin:'⚙️ Admin', club_manager:'⚙️ Manager' };

export default function Login() {
  const [tab,        setTab]        = useState('login');  // 'login' | 'register'
  const [loginRole,  setLoginRole]  = useState('student');
  const [regRole,    setRegRole]    = useState('student');
  const [loginId,    setLoginId]    = useState('');
  const [loginPw,    setLoginPw]    = useState('');
  const [loginErr,   setLoginErr]   = useState('');
  const [regData,    setRegData]    = useState({ name:'', email:'', password:'', enrollment:'', loginId:'' });
  const [regErr,     setRegErr]     = useState('');
  const [clubs,      setClubs]      = useState([]);
  const [selClubs,   setSelClubs]   = useState([]);
  const [loading,    setLoading]    = useState(false);

  const { login }     = useAuth();
  const { showToast } = useToast();
  const navigate      = useNavigate();

  useEffect(() => {
    api.clubsList().then(setClubs).catch(()=>{});
  }, []);

  // ── Demos ──────────────────────────────────────────────────────────────────
  const DEMOS = {
    student:     { id:'STU001',   pw:'student123',  role:'student' },
    admin:       { id:'ADMIN001', pw:'admin123',     role:'admin' },
    coordinator: { id:'COORD001', pw:'coord123',     role:'coordinator' },
    club_manager:{ id:'MANAGER001',pw:'manager123',  role:'club_manager' },
  };
  function fillDemo(role) {
    const d = DEMOS[role];
    setLoginRole(d.role);
    setLoginId(d.id);
    setLoginPw(d.pw);
    showToast(`Filled ${role} demo credentials`, 'info');
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setLoginErr('');
    if (!loginId || !loginPw) { setLoginErr('Please fill in both fields.'); return; }
    if (loginPw.length < 6)   { setLoginErr('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const data = await api.login({ identifier: loginId, password: loginPw, role: loginRole });

login(data.user, data.token);

// Send login event to Google Tag Manager
sendGAEvent('login', {
  user_role: data.user.role
});

showToast('Login successful!', 'success');

      navigate(data.user.role === 'student' ? '/dashboard' : data.user.role === 'club_manager' ? '/club-manager' : '/staff');
    } catch (err) {
      setLoginErr(err.message || 'Login failed.');
    } finally { setLoading(false); }
  }


  // ── Register ───────────────────────────────────────────────────────────────
  async function handleRegister(e) {
    e.preventDefault();
    setRegErr('');
    const { name, email, password } = regData;
    if (!name || !email || !password) { setRegErr('Please fill in all fields.'); return; }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) { setRegErr('Please enter a valid email address (e.g. name@gmail.com).'); return; }
    if (password.length < 6) { setRegErr('Password must be at least 6 characters.'); return; }

    const body = { name, email, password, role: regRole };
    if (regRole === 'student') {
      if (!regData.enrollment) { setRegErr('Enrollment ID is required.'); return; }
      body.enrollment = regData.enrollment;
    } else if (regRole === 'club_manager') {
      // Club managers oversee all clubs — no club assignment required
      if (!regData.loginId) { setRegErr('Staff Login ID is required.'); return; }
      body.loginId = regData.loginId;
    } else {
      if (!regData.loginId) { setRegErr('Staff Login ID is required.'); return; }
      if (selClubs.length === 0) { setRegErr('Please select at least one club.'); return; }
      body.loginId       = regData.loginId;
      body.assignedClubs = selClubs;
    }
    setLoading(true);
    try {
      await api.register(body);
      showToast('Account created! Please login.', 'success');
      setTab('login');
    } catch (err) { setRegErr(err.message || 'Registration failed.'); }
    finally { setLoading(false); }
  }

  function toggleClub(id) {
    setSelClubs(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);
  }

  return (
    <div className="page-wrapper" style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
      <div style={styles.container}>

        {/* Left panel */}
        <div style={styles.left}>
          <div style={styles.brand}>Edu<span style={{color:'var(--accent)'}}>Event</span></div>
          <div>
            <div style={styles.tagline}>Your campus,<br/><em style={{fontStyle:'normal',color:'var(--accent)'}}>reimagined.</em></div>
            <p style={{fontSize:'.87rem',color:'var(--text-muted)',lineHeight:1.7}}>Connect with clubs, attend events, and make the most of your college years.</p>
            <ul style={styles.featList}>
              {['Join 50+ active clubs','Register for events with one click','Role-based access for all users','Track your registrations live'].map(f=>(
                <li key={f} style={styles.featItem}><span style={styles.tick}>✓</span>{f}</li>
              ))}
            </ul>
          </div>
          <p style={{fontSize:'.7rem',color:'var(--text-muted)'}}>EduEvent Manager — Built for college communities</p>
        </div>

        {/* Right panel */}
        <div style={styles.right}>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:'1.7rem',marginBottom:'.3rem'}}>Welcome Back</h2>
          <p style={{color:'var(--text-muted)',fontSize:'.85rem',marginBottom:'1.4rem'}}>Sign in or create your account</p>

          {/* Tab switcher */}
          <div style={styles.tabRow}>
            {['login','register'].map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                style={{...styles.tabBtn, ...(tab===t ? styles.tabBtnActive : {})}}>
                {t==='login'?'Login':'Register'}
              </button>
            ))}
          </div>

          {/* ── LOGIN FORM ── */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <p style={styles.roleLbl}>Select your role</p>
              <div style={styles.roleRow}>
                {ROLES.map(r=>(
                  <button type="button" key={r}
                    onClick={()=>setLoginRole(r)}
                    style={{...styles.roleBtn,...(loginRole===r?styles.roleBtnActive:{})}}>
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>

              {loginErr && <div className="error-box">{loginErr}</div>}

              <div className="form-group">
                <label>{loginRole==='student'?'Enrollment ID':'Staff Login ID'}</label>
                <input value={loginId} onChange={e=>setLoginId(e.target.value)}
                  placeholder={loginRole==='student'?'e.g. STU001':'e.g. ADMIN001'}/>
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={loginPw} onChange={e=>setLoginPw(e.target.value)} placeholder="Enter your password"/>
              </div>

              <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>

              <div style={{marginTop:'1rem'}}>
                <p style={{fontSize:'.72rem',color:'var(--text-muted)',marginBottom:'.5rem'}}>Quick demo logins:</p>
                <div style={{display:'flex',flexDirection:'column',gap:'.4rem'}}>
                  {['student','admin','coordinator'].map(r=>(
                    <button type="button" key={r} onClick={()=>fillDemo(r)} style={styles.demoBtn}>
                      {ROLE_LABELS[r]} — {DEMOS[r].id} / {DEMOS[r].pw}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <p style={styles.roleLbl}>Select your role</p>
              <div style={styles.roleRow}>
                {ROLES.map(r=>(
                  <button type="button" key={r} onClick={()=>setRegRole(r)}
                    style={{...styles.roleBtn,...(regRole===r?styles.roleBtnActive:{})}}>
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>

              {regErr && <div className="error-box">{regErr}</div>}

              <div className="form-group">
                <label>Full Name</label>
                <input value={regData.name} onChange={e=>setRegData({...regData,name:e.target.value})} placeholder="Your full name"/>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={regData.email} onChange={e=>setRegData({...regData,email:e.target.value})} placeholder="college@email.com"/>
              </div>

              {regRole === 'student' ? (
                <div className="form-group">
                  <label>Enrollment ID</label>
                  <input value={regData.enrollment} onChange={e=>setRegData({...regData,enrollment:e.target.value})} placeholder="e.g. 2023CS001"/>
                </div>
              ) : (
                <div className="form-group">
                  <label>Staff Login ID</label>
                  <input value={regData.loginId} onChange={e=>setRegData({...regData,loginId:e.target.value})} placeholder="e.g. COORD007"/>
                </div>
              )}

              <div className="form-group">
                <label>Password</label>
                <input type="password" value={regData.password} onChange={e=>setRegData({...regData,password:e.target.value})} placeholder="Min. 6 characters"/>
              </div>

              {regRole !== 'student' && regRole !== 'club_manager' && (
                <div className="form-group">
                  <label>Assign Clubs</label>
                  <div style={styles.clubBox}>
                    {clubs.length === 0
                      ? <span style={{fontSize:'.75rem',color:'var(--text-muted)'}}>Loading clubs…</span>
                      : clubs.map(c=>(
                          <label key={c._id} style={styles.clubCheck}>
                            <input type="checkbox" checked={selClubs.includes(c._id)} onChange={()=>toggleClub(c._id)} style={{accentColor:'var(--accent)'}}/>
                            {c.name} <span style={{fontSize:'.68rem',opacity:.6}}>({c.category})</span>
                          </label>
                        ))
                    }
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display:'flex', width:'100%', maxWidth:920, borderRadius:8, overflow:'hidden', background:'#fff', border:'1px solid var(--glass-border)', boxShadow:'var(--shadow)' },
  left:    { flex:1, background:'linear-gradient(160deg,#eef4ff,#ecfdf5)', padding:'3rem 2.5rem', display:'flex', flexDirection:'column', justifyContent:'space-between', borderRight:'1px solid var(--glass-border)' },
  brand:   { fontFamily:"'Playfair Display',serif", fontSize:'1.8rem', fontWeight:900 },
  tagline: { fontFamily:"'Playfair Display',serif", fontSize:'1.5rem', fontWeight:700, lineHeight:1.3, margin:'1.8rem 0 1rem' },
  featList:{ listStyle:'none', marginTop:'1.4rem' },
  featItem:{ display:'flex', alignItems:'center', gap:'.6rem', fontSize:'.83rem', color:'var(--text-muted)', marginBottom:'.6rem' },
  tick:    { width:18, height:18, borderRadius:'50%', background:'rgba(37,99,235,.1)', color:'var(--accent)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'.65rem', fontWeight:700, flexShrink:0 },
  right:   { flex:1, padding:'2.5rem', overflowY:'auto', maxHeight:'90vh' },
  tabRow:  { display:'flex', background:'rgba(255,255,255,.05)', borderRadius:10, padding:4, marginBottom:'1.4rem' },
  tabBtn:  { flex:1, padding:'.5rem', border:'none', borderRadius:8, background:'transparent', color:'var(--text-muted)', fontFamily:"'DM Sans',sans-serif", fontSize:'.85rem', fontWeight:600, cursor:'pointer', transition:'all .2s' },
  tabBtnActive: { background:'linear-gradient(135deg,var(--accent),var(--accent2))', color:'#fff' },
  roleLbl: { fontSize:'.75rem', color:'var(--text-muted)', marginBottom:'.5rem' },
  roleRow: { display:'flex', gap:'.4rem', marginBottom:'1.2rem', flexWrap:'wrap' },
  roleBtn: { flex:1, padding:'.45rem .4rem', border:'1.5px solid var(--glass-border)', borderRadius:10, background:'transparent', color:'var(--text-muted)', fontFamily:"'DM Sans',sans-serif", fontSize:'.78rem', fontWeight:600, cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap' },
  roleBtnActive: { borderColor:'var(--accent)', color:'var(--accent)', background:'rgba(37,99,235,.08)' },
  demoBtn: { padding:'.4rem .8rem', borderRadius:8, border:'1px solid var(--glass-border)', background:'rgba(255,255,255,.04)', color:'var(--text-muted)', fontSize:'.73rem', cursor:'pointer', textAlign:'left', transition:'all .2s' },
  clubBox: { display:'flex', flexWrap:'wrap', gap:'.5rem', padding:'.6rem', background:'rgba(255,255,255,.04)', borderRadius:10, border:'1.5px solid var(--glass-border)', maxHeight:130, overflowY:'auto' },
  clubCheck: { display:'flex', alignItems:'center', gap:'.35rem', fontSize:'.78rem', color:'var(--text-muted)', cursor:'pointer' },
};

