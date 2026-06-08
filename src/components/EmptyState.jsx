// On-brand empty state: a gently floating emoji, Fraunces headline, warm copy,
// and an optional CTA. Used across tabs so first-run screens feel alive.
export default function EmptyState({ emoji, title, sub, cta, onCta }) {
  return (
    <div style={{ textAlign: 'center', padding: '44px 24px', animation: 'slideUp .4s cubic-bezier(.22,1,.36,1) both' }}>
      <div style={{ fontSize: 54, marginBottom: 14, display: 'inline-block', animation: 'floatY 4s ease-in-out infinite' }}>{emoji}</div>
      <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, fontWeight: 600, color: 'var(--plum)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 290, margin: '0 auto 18px' }}>{sub}</div>
      {cta && <button className="btn-full" style={{ maxWidth: 240, margin: '0 auto' }} onClick={onCta}>{cta}</button>}
    </div>
  )
}
