import { useState } from 'react'
import { PLANS, FREE_GENERATION_LIMIT, purchasePlan, restorePurchases } from '../lib/purchases.js'
import BloomLogo from './BloomLogo.jsx'

export default function PaywallModal({ onClose, onSuccess, generationsUsed = 0 }) {
  const [loading, setLoading] = useState(null)
  const [err, setErr] = useState('')
  const [restoring, setRestoring] = useState(false)

  const handlePurchase = async (productId) => {
    setErr(''); setLoading(productId)
    try {
      const info = await purchasePlan(productId)
      const active = info.entitlements.active || {}
      if (Object.keys(active).length > 0) { onSuccess(active); onClose() }
      else setErr('Purchase completed but entitlement not active. Try restoring.')
    } catch (e) {
      if (e.code !== 'PURCHASE_CANCELLED') setErr(e.message || 'Purchase failed')
    }
    setLoading(null)
  }

  const handleRestore = async () => {
    setErr(''); setRestoring(true)
    try {
      const info = await restorePurchases()
      const active = info.entitlements.active || {}
      if (Object.keys(active).length > 0) { onSuccess(active); onClose() }
      else setErr('No previous purchases found.')
    } catch (e) { setErr(e.message || 'Restore failed') }
    setRestoring(false)
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ paddingBottom: 32 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <BloomLogo />
          <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 26, fontWeight: 600, color: 'var(--plum)', marginTop: 10, marginBottom: 4 }}>
            Unlock Nutriq
          </div>
          <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
            {generationsUsed >= FREE_GENERATION_LIMIT
              ? `You've used all ${FREE_GENERATION_LIMIT} free meal plans this month.`
              : `${FREE_GENERATION_LIMIT - generationsUsed} free plan${FREE_GENERATION_LIMIT - generationsUsed !== 1 ? 's' : ''} remaining this month.`}
            {' '}Upgrade for unlimited access.
          </div>
        </div>

        {/* Free tier reminder */}
        <div style={{ background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Free</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{FREE_GENERATION_LIMIT} meal plans per month</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--border)', borderRadius: 8, padding: '3px 10px' }}>Current</div>
        </div>

        {/* Paid plans */}
        {PLANS.map((plan, i) => (
          <div key={plan.id} style={{ background: i === 0 ? 'var(--plumLL)' : 'var(--card)', border: `1.5px solid ${i === 0 ? 'var(--plum2)' : 'var(--border)'}`, borderRadius: 14, padding: '14px 16px', marginBottom: 10, position: 'relative' }}>
            {i === 0 && <div style={{ position: 'absolute', top: -10, left: 16, background: 'var(--plum2)', color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 10px', borderRadius: 20, letterSpacing: .5 }}>MOST POPULAR</div>}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{plan.features[0]}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 18, fontWeight: 600, color: 'var(--plum)' }}>{plan.price}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {plan.features.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--muted)' }}>
                  <span style={{ color: 'var(--sage)', fontWeight: 700 }}>✓</span> {f}
                </div>
              ))}
            </div>
            <button
              onClick={() => handlePurchase(plan.id)}
              disabled={!!loading}
              style={{ width: '100%', background: i === 0 ? 'linear-gradient(135deg,var(--plum2),var(--plum))' : 'var(--warm)', border: i === 0 ? 'none' : '1px solid var(--border)', borderRadius: 10, padding: '11px', color: i === 0 ? '#fff' : 'var(--plum2)', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif", opacity: loading && loading !== plan.id ? 0.5 : 1, transition: 'opacity .15s' }}>
              {loading === plan.id ? <span className="spin" style={i === 0 ? {} : { borderTopColor: 'var(--plum)', borderColor: 'var(--plum3)44' }} /> : `Get ${plan.name}`}
            </button>
          </div>
        ))}

        {err && <div style={{ background: 'var(--roseL)', border: '1px solid var(--rose)44', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{err}</div>}

        {/* Footer actions */}
        <button onClick={handleRestore} disabled={restoring} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12, cursor: 'pointer', padding: '8px 0', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
          {restoring ? 'Restoring...' : 'Restore previous purchase'}
        </button>
        <button onClick={onClose} style={{ width: '100%', background: 'none', border: 'none', color: 'var(--muted2)', fontSize: 12, cursor: 'pointer', padding: '4px 0', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
          Not now
        </button>

        <div style={{ fontSize: 10, color: 'var(--muted2)', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
          Subscriptions renew automatically. Cancel anytime in App Store settings.
        </div>
      </div>
    </div>
  )
}
