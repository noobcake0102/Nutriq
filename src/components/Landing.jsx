import BloomLogo from './BloomLogo.jsx'

export default function Landing({ onGetStarted, onSignIn }) {
  const Section = ({ children, style }) => <div style={{ padding: '0 22px', maxWidth: 560, margin: '0 auto', ...style }}>{children}</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', overflowX: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', maxWidth: 560, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BloomLogo size={34} />
          <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 22, fontWeight: 600, color: 'var(--plum)' }}>Nutriq</span>
        </div>
        <button onClick={onSignIn} style={{ background: 'none', border: 'none', color: 'var(--plum2)', fontWeight: 500, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans',system-ui,sans-serif" }}>Sign in</button>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(165deg,var(--plumL) 0%,var(--blush) 100%)', padding: '46px 0 56px', textAlign: 'center' }}>
        <Section>
          <BloomLogo size={84} />
          <h1 style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 38, fontWeight: 600, color: 'var(--plum)', lineHeight: 1.12, margin: '18px 0 10px' }}>
            Never decide what's<br />for dinner again
          </h1>
          <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto 26px' }}>
            Nutriq plans your week around your goals and the food you already have — then sends the groceries straight to pickup.
          </p>
          <button className="btn-full" style={{ maxWidth: 300, margin: '0 auto', fontSize: 17 }} onClick={onGetStarted}>Get started free</button>
          <div style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 10 }}>Free to start · No credit card</div>
        </Section>
      </div>

      {/* Value props */}
      <Section style={{ padding: '44px 22px 8px' }}>
        {[
          { e: '💸', t: 'Save money', d: 'The average household tosses ~$1,500 a year in spoiled food. Nutriq plans around what you already have.' },
          { e: '⏱️', t: 'Save time', d: 'A full week of meals planned in under a minute — no more 5 p.m. fridge-staring or last-minute takeout.' },
          { e: '🎯', t: 'Eat better', d: 'Every plan fits your calories, macros, diet, and the meals your family actually loves.' },
        ].map(v => (
          <div key={v.t} style={{ display: 'flex', gap: 14, marginBottom: 22, alignItems: 'flex-start' }}>
            <div style={{ fontSize: 30, flexShrink: 0 }}>{v.e}</div>
            <div>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, fontWeight: 600, color: 'var(--plum)', marginBottom: 3 }}>{v.t}</div>
              <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{v.d}</div>
            </div>
          </div>
        ))}
      </Section>

      {/* How it works */}
      <div style={{ background: 'var(--warm)', padding: '40px 0', marginTop: 20 }}>
        <Section>
          <div style={{ textAlign: 'center', fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, fontWeight: 600, color: 'var(--plum)', marginBottom: 28 }}>How it works</div>
          {[
            { n: '1', t: 'Set your goals', d: 'Weight, diet, allergies, household size. We calculate your targets automatically.' },
            { n: '2', t: 'Plan your week', d: 'Pick what you need, reuse your favorites, and let AI fill in the rest around your pantry.' },
            { n: '3', t: 'Send it to pickup', d: 'Every ingredient is matched to real products at your store and loaded into your cart.' },
          ].map(s => (
            <div key={s.n} style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, boxShadow: '0 4px 14px rgba(123,47,214,.3)' }}>{s.n}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--text)', marginBottom: 2 }}>{s.t}</div>
                <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </Section>
      </div>

      {/* Pricing teaser */}
      <Section style={{ padding: '44px 22px', textAlign: 'center' }}>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 26, fontWeight: 600, color: 'var(--plum)', marginBottom: 8 }}>Start free</div>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
          Plan a couple of meals a month on us. Upgrade to <strong style={{ color: 'var(--plum2)' }}>Plus</strong> for unlimited planning, grocery pickup, and personalization that learns your taste.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 22px', minWidth: 130 }}>
            <div style={{ fontWeight: 600, color: 'var(--text)' }}>Free</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>To start</div>
          </div>
          <div style={{ background: 'var(--plumLL)', border: '1.5px solid var(--plum2)', borderRadius: 14, padding: '14px 22px', minWidth: 130 }}>
            <div style={{ fontWeight: 600, color: 'var(--plum)' }}>Plus · $49/yr</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>or $6.99/mo · 7-day trial</div>
          </div>
        </div>
        <button className="btn-full" style={{ maxWidth: 300, margin: '0 auto', fontSize: 17 }} onClick={onGetStarted}>Get started free</button>
      </Section>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '24px 22px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 8 }}>Feed your family better, without the mental math.</div>
        <div style={{ fontSize: 12, color: 'var(--muted2)' }}>
          <a href="/privacy" style={{ color: 'var(--muted2)' }}>Privacy</a> · <a href="/terms" style={{ color: 'var(--muted2)' }}>Terms</a> · <a href="mailto:info@nutriqai.com" style={{ color: 'var(--muted2)' }}>Contact</a>
        </div>
      </div>
    </div>
  )
}
