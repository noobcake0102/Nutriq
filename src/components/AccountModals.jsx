import { useState } from 'react'
import { supa } from '../lib/supabase.js'

export default function AccountModals({ acctModal, setAcctModal, session, userName, setUserName, notify }) {
  const [form, setForm] = useState({})
  const [loading, setLoading] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')
  if (!acctModal) return null

  const handleProfileSave = async () => {
    setLoading(true)
    const { error } = await supa.auth.updateUser({ data: { full_name: form.name } })
    if (!error) { await supa.from('profiles').update({ name: form.name }).eq('id', session.user.id); setUserName(form.name); notify('Profile updated'); setAcctModal(null) }
    else notify(error.message, 'err')
    setLoading(false)
  }

  const handlePasswordSave = async () => {
    if (form.password !== form.confirm) { notify("Passwords don't match", 'err'); return }
    if ((form.password || '').length < 6) { notify('Password must be at least 6 characters', 'err'); return }
    setLoading(true)
    const { error } = await supa.auth.updateUser({ password: form.password })
    if (!error) { notify('Password updated'); setAcctModal(null) } else notify(error.message, 'err')
    setLoading(false)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { notify('Type DELETE to confirm', 'err'); return }
    setLoading(true)
    try {
      const uid = session.user.id
      await supa.from('meal_ratings').delete().eq('user_id', uid)
      await supa.from('saved_meals').delete().eq('user_id', uid)
      await supa.from('weight_logs').delete().eq('user_id', uid)
      await supa.from('goals').delete().eq('user_id', uid)
      await supa.from('pantry_items').delete().eq('user_id', uid)
      await supa.from('profiles').delete().eq('id', uid)
      await supa.auth.signOut()
      notify('Account deleted')
    } catch (e) { notify('Deletion failed — contact info@nutriqai.com', 'err') }
    setLoading(false)
  }

  return (
    <div className="modal-backdrop" onClick={() => setAcctModal(null)}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        {acctModal === 'profile' && <>
          <div className="modal-title">Edit profile</div>
          <div className="modal-sub">Update your display name</div>
          <div className="ob-field"><label className="ob-label">Display name</label><input className="ob-input" defaultValue={userName} placeholder="Your name" onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <button className="btn-full" onClick={handleProfileSave} disabled={loading}>{loading ? 'Saving...' : 'Save changes'}</button>
          <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => setAcctModal(null)}>Cancel</button>
        </>}
        {acctModal === 'password' && <>
          <div className="modal-title">Change password</div>
          <div className="modal-sub">Choose a new password for your account</div>
          <div className="ob-field"><label className="ob-label">New password</label><input className="ob-input" type="password" placeholder="At least 6 characters" onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
          <div className="ob-field"><label className="ob-label">Confirm password</label><input className="ob-input" type="password" placeholder="Repeat new password" onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} /></div>
          <button className="btn-full" onClick={handlePasswordSave} disabled={loading}>{loading ? 'Updating...' : 'Update password'}</button>
          <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => setAcctModal(null)}>Cancel</button>
        </>}
        {acctModal === 'subscription' && <>
          <div className="modal-title">Manage subscription</div>
          <div className="modal-sub">Your current plan</div>
          <div style={{ background: 'var(--plumLL)', border: '1px solid var(--plum3)22', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Current plan</div>
            <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 22, color: 'var(--plum)', fontWeight: 600 }}>Free</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>3 meal plan generations per month</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {[['Core','$4.99/mo','Unlimited plans · Full pantry'],['Family','$8.99/mo','Everything + household sharing'],['Premium','$12.99/mo','Everything + grocery ordering + AI images']].map(([n, price, desc]) => (
              <div key={n} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)' }}>{n}</div><div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div></div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}><div style={{ fontWeight: 500, color: 'var(--plum2)' }}>{price}</div><button className="btn-sm" style={{ fontSize: 10, padding: '3px 8px', marginTop: 4 }}>Upgrade</button></div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginBottom: 16 }}>Subscription billing coming soon via App Store</div>
          <button className="btn-ghost" onClick={() => setAcctModal(null)}>Close</button>
        </>}
        {acctModal === 'delete' && <>
          <div className="modal-title" style={{ color: 'var(--red)' }}>Delete account</div>
          <div className="modal-sub">This will permanently delete all your data. This cannot be undone.</div>
          <div style={{ background: 'var(--roseL)', border: '1px solid var(--rose)44', borderRadius: 12, padding: '12px 14px', marginBottom: 16, fontSize: 13, color: 'var(--red)' }}>All your data will be permanently deleted within 30 days.</div>
          <div className="ob-field"><label className="ob-label">Type DELETE to confirm</label><input className="ob-input" placeholder="DELETE" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} style={{ borderColor: deleteConfirm === 'DELETE' ? 'var(--red)' : 'var(--border)' }} /></div>
          <button className="btn-full red" onClick={handleDeleteAccount} disabled={loading || deleteConfirm !== 'DELETE'}>{loading ? 'Deleting...' : 'Permanently delete my account'}</button>
          <button className="btn-ghost" style={{ marginTop: 8 }} onClick={() => setAcctModal(null)}>Cancel</button>
        </>}
      </div>
    </div>
  )
}
