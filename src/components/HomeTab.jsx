import { useState, useEffect } from 'react'
import { du } from '../constants.js'
import { loadFoodLogs } from '../lib/foodLog.js'

export default function HomeTab({ pantry, goals, weights, weekMeals = [], macros, setTab, onScan, userName, notify, session, onViewLog }) {
  const [todayCal, setTodayCal] = useState(null)

  useEffect(() => {
    if (!session) return
    const d = new Date().toISOString().split('T')[0]
    loadFoodLogs(session.user.id, d).then(logs => {
      setTodayCal(Math.round(logs.reduce((s, l) => s + (l.calories || 0), 0)))
    })
  }, [session])

  const latest = weights.length > 0 ? weights[weights.length - 1].weight : null
  const startWeight = weights.length > 0 ? weights[0].weight : null
  const weightChange = latest && startWeight ? (latest - startWeight).toFixed(1) : null
  const toGoal = latest && goals.goalWeight ? (latest - goals.goalWeight).toFixed(1) : null
  const expiring = pantry.filter(i => { const d = du(i.expiry); return d !== null && d <= 3 })
  const hasMeal = weekMeals.length > 0
  const estimatedSavings = weekMeals.length * 8
  const greeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening' }

  return (
    <div className="page">
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 2 }}>{greeting()}</div>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 32, fontWeight: 600, color: 'var(--plum)', lineHeight: 1.1 }}>{userName ? userName.split(' ')[0] : 'Welcome back'}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div className="card" style={{ margin: 0, cursor: 'pointer' }} onClick={() => setTab('goals')}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Weight</div>
          {latest ? (<>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 28, fontWeight: 600, color: 'var(--plum)', lineHeight: 1 }}>{latest}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)' }}>lbs</span></div>
            {weightChange !== null && <div style={{ fontSize: 12, marginTop: 4, fontWeight: 500, color: +weightChange < 0 ? 'var(--sage)' : 'var(--orange)' }}>{+weightChange < 0 ? '▼' : '▲'} {Math.abs(weightChange)} lbs total</div>}
            {toGoal && +toGoal > 0 && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{toGoal} lbs to goal</div>}
            {toGoal && +toGoal <= 0 && <div style={{ fontSize: 11, color: 'var(--sage)', marginTop: 2, fontWeight: 500 }}>Goal reached!</div>}
          </>) : <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Log your weight</div>}
        </div>

        <div className="card" style={{ margin: 0, cursor: 'pointer' }} onClick={() => setTab('meals')}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Meal plan</div>
          {hasMeal ? (<>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 28, fontWeight: 600, color: 'var(--plum)', lineHeight: 1 }}>{weekMeals.length}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)' }}> meals</span></div>
            <div style={{ fontSize: 12, color: 'var(--sage)', marginTop: 4, fontWeight: 500 }}>Plan ready</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{macros.calories} kcal target</div>
          </>) : (<>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 24, fontWeight: 600, color: 'var(--muted2)', lineHeight: 1 }}>No plan</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Tap to generate</div>
          </>)}
        </div>

        <div className="card" style={{ margin: 0, cursor: 'pointer' }} onClick={() => setTab('pantry')}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Pantry</div>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 28, fontWeight: 600, color: 'var(--plum)', lineHeight: 1 }}>{pantry.length}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)' }}> items</span></div>
          {expiring.length > 0 ? <div style={{ fontSize: 12, color: 'var(--orange)', marginTop: 4, fontWeight: 500 }}>{expiring.length} expiring soon</div> : <div style={{ fontSize: 12, color: 'var(--sage)', marginTop: 4, fontWeight: 500 }}>All fresh</div>}
        </div>

        {session && (
          <div className="card" style={{ margin: 0, cursor: 'pointer' }} onClick={onViewLog}>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Today's calories</div>
            {todayCal !== null ? (<>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 28, fontWeight: 600, color: todayCal > macros.calories ? 'var(--orange)' : 'var(--plum)', lineHeight: 1 }}>{todayCal.toLocaleString()}<span style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)' }}> kcal</span></div>
              <div style={{ fontSize: 12, marginTop: 4, fontWeight: 500, color: todayCal > macros.calories ? 'var(--orange)' : 'var(--sage)' }}>
                {todayCal > macros.calories ? `+${todayCal - macros.calories} over` : `${macros.calories - todayCal} left`}
              </div>
            </>) : <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Tap to log</div>}
          </div>
        )}

        <div className="card" style={{ margin: 0 }}>
          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Est. savings</div>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 28, fontWeight: 600, color: 'var(--sage)', lineHeight: 1 }}>${estimatedSavings}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>vs eating out this week</div>
        </div>
      </div>

      {hasMeal && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="card-title" style={{ margin: 0 }}>This week's meals</div>
            <button className="btn-sm" onClick={() => setTab('meals')} style={{ fontSize: 11, padding: '4px 10px' }}>Full plan</button>
          </div>
          {weekMeals.slice(0, 4).map((m, idx) => (
            <div key={m.id || idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--plumLL)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--plum2)', textTransform: 'uppercase', letterSpacing: .5, textAlign: 'center', lineHeight: 1.3 }}>{(m.meal_type || 'meal').replace(/_/g, ' ')}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 15, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{m.calories} cal · P {m.protein}g · C {m.carbs}g · F {m.fat}g</div>
              </div>
            </div>
          ))}
          {weekMeals.length > 4 && <div style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', paddingTop: 10 }}>+{weekMeals.length - 4} more this week</div>}
        </div>
      )}

      {expiring.length > 0 && (
        <div style={{ background: '#33291a', border: '1px solid #e0a84e55', borderRadius: 12, padding: '12px 14px', marginBottom: 12, cursor: 'pointer' }} onClick={() => setTab('pantry')}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--orange)', marginBottom: 4 }}>Use these soon</div>
          <div style={{ fontSize: 12, color: 'var(--orange)' }}>{expiring.map(i => i.name).join(', ')}</div>
        </div>
      )}

      {weights.length > 1 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div className="card-title" style={{ margin: 0 }}>Weight trend</div>
            <button className="btn-sm" onClick={() => setTab('goals')} style={{ fontSize: 11, padding: '4px 10px' }}>Log weight</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60 }}>
            {(() => {
              const pts = weights.slice(-14), mn = Math.min(...pts.map(p => p.weight)), mx = Math.max(...pts.map(p => p.weight)), range = mx - mn || 1
              return pts.map((p, i, a) => {
                const h = ((p.weight - mn) / range) * 44 + 8, isLatest = i === a.length - 1
                return <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                  <div style={{ width: '100%', height: h, borderRadius: 3, background: isLatest ? 'var(--plum2)' : 'var(--plum3)44', minHeight: 4 }} />
                  {(i === 0 || isLatest) && <span style={{ fontSize: 8, color: 'var(--muted2)' }}>{p.weight}</span>}
                </div>
              })
            })()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--muted)' }}>
            <span>{weights.slice(-14)[0]?.date?.slice(5)}</span><span>today</span>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <button className="btn-full" onClick={() => setTab('meals')} style={{ padding: 14, fontSize: 14 }}>Generate meal plan</button>
        <button className="btn-full blue" onClick={onScan} style={{ padding: 14, fontSize: 14 }}>Scan item</button>
      </div>

      {!hasMeal && (
        <div style={{ background: 'var(--plumLL)', border: '1px solid var(--plum3)22', borderRadius: 14, padding: 16, textAlign: 'center' }}>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, color: 'var(--plum)', marginBottom: 6 }}>Ready to plan your week?</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Generate a meal plan tailored to your pantry and {macros.calories} kcal target.</div>
          <button className="btn-full" onClick={() => setTab('meals')}>Generate this week's plan</button>
        </div>
      )}
    </div>
  )
}
