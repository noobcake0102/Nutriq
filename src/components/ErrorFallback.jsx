import { useState } from 'react'
import BloomLogo from './BloomLogo.jsx'

export default function ErrorFallback({ error, resetError }) {
  const [showDetails, setShowDetails] = useState(false)
  const msg = error?.message || String(error || 'Unknown error')
  const stack = error?.stack || ''

  const copyDetails = () => {
    const text = `Nutriq error: ${msg}\n\n${stack}`.slice(0, 2000)
    navigator.clipboard?.writeText(text).catch(() => {})
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '28px 24px', background: 'var(--cream)', gap: 14 }}>
      <BloomLogo size={72} />
      <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, fontWeight: 600, color: 'var(--plum)' }}>Something went sideways</div>
      <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 300 }}>
        We hit an unexpected error and our team's been notified. A quick reload usually sorts it out.
      </div>
      <button className="btn-full" style={{ maxWidth: 220, marginTop: 6 }} onClick={() => (resetError ? resetError() : window.location.reload())}>
        Reload Nutriq
      </button>

      {/* Error detail — collapsed by default. Lets a tester capture exactly what
          broke and send it over, instead of just "it crashed". */}
      {error && (
        <div style={{ marginTop: 8, maxWidth: 340, width: '100%' }}>
          <button onClick={() => setShowDetails(s => !s)} style={{ background: 'none', border: 'none', color: 'var(--muted2)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
            {showDetails ? 'Hide' : 'Show'} error details
          </button>
          {showDetails && (
            <div style={{ marginTop: 8, textAlign: 'left', background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500, wordBreak: 'break-word', marginBottom: 8 }}>{msg}</div>
              {stack && <pre style={{ fontSize: 10, color: 'var(--muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, maxHeight: 160, overflow: 'auto' }}>{stack}</pre>}
              <button onClick={copyDetails} style={{ marginTop: 8, background: 'var(--plumL)', border: '1px solid var(--plum3)', borderRadius: 8, padding: '5px 12px', fontSize: 11, color: 'var(--plum2)', cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>
                Copy details
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
