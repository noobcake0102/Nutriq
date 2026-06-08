export default function ErrorFallback() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '28px 24px', background: 'var(--cream)', gap: 14 }}>
      <img src="/logo.png" alt="" style={{ width: 72, height: 72, borderRadius: 18 }} />
      <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, fontWeight: 600, color: 'var(--plum)' }}>Something went sideways</div>
      <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 300 }}>
        We hit an unexpected error and our team's been notified. A quick reload usually sorts it out.
      </div>
      <button className="btn-full" style={{ maxWidth: 220, marginTop: 6 }} onClick={() => window.location.reload()}>
        Reload Nutriq
      </button>
    </div>
  )
}
