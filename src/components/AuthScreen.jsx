import { useState } from 'react'
import { supa } from '../lib/supabase.js'
import BloomLogo from './BloomLogo.jsx'

export default function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr(''); setLoading(true)
    try {
      if (mode === 'login') { const { error } = await supa.auth.signInWithPassword({ email, password: pass }); if (error) throw error }
      else { const { error } = await supa.auth.signUp({ email, password: pass }); if (error) throw error }
    } catch (e) { setErr(e.message) }
    setLoading(false)
  }

  return (
    <div className="auth-wrap">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <BloomLogo size={80} />
        <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 32, fontWeight: 600, color: 'var(--plum)', marginTop: 10 }}>Nutriq</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Feed your family better, without the mental math.</div>
      </div>
      <div className="auth-card">
        <div className="auth-title">{mode === 'login' ? 'Welcome back' : 'Create account'}</div>
        <div className="auth-sub">{mode === 'login' ? 'Sign in to your pantry' : 'Start your free account'}</div>
        {err && <div className="auth-err">{err}</div>}
        <div className="ob-field"><label className="ob-label">Email</label><input className="ob-input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div className="ob-field"><label className="ob-label">Password</label><input className="ob-input" type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()} /></div>
        <button className="ob-next" onClick={submit} disabled={loading || !email || !pass}>{loading ? <span className="spin" /> : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <div className="auth-switch">{mode === 'login' ? "Don't have an account? " : 'Already have an account? '}<span onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr('') }}>{mode === 'login' ? 'Sign up' : 'Sign in'}</span></div>
      </div>
    </div>
  )
}
