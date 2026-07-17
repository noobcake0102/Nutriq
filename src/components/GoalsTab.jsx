import { useState } from 'react'
import { ACT, calcBMR, calcMacros } from '../lib/nutrition.js'
import WeightChart from './WeightChart.jsx'
import LogTab from './LogTab.jsx'

export default function GoalsTab({ goals, setGoals, weights, setWeights, macros, tdee, bmr, logWeight, saveGoals, notify, session, initialView }) {
  const [view, setView] = useState(initialView || 'goals')
  const [wt, setWt] = useState('')
  const [wd, setWd] = useState(new Date().toISOString().split('T')[0])
  const up = (k, v) => setGoals(g => ({ ...g, [k]: v }))
  const logW = async () => {
    if (!wt) return
    const entry = { date: wd, weight: +wt }
    setWeights(w => [...w, entry].sort((a, b) => new Date(a.date) - new Date(b.date)))
    setWt('')
    if (logWeight) await logWeight(+wt, wd)
    notify('Weight logged')
  }
  const latest = weights.length > 0 ? weights[weights.length - 1].weight : null
  const change = weights.length > 1 ? (weights[weights.length - 1].weight - weights[0].weight).toFixed(1) : null
  const toGoal = latest && goals.goalWeight ? (latest - goals.goalWeight).toFixed(1) : null

  return (
    <div className="page">
      <div className="page-label">Nutrition</div>
      <h1 className="page-title">{view === 'log' ? 'Food diary' : 'Goals and body'}</h1>

      <div className="seg" style={{ marginBottom: 20 }}>
        <button className={`seg-btn${view === 'goals' ? ' on' : ''}`} onClick={() => setView('goals')}>Goals</button>
        <button className={`seg-btn${view === 'log' ? ' on' : ''}`} onClick={() => setView('log')}>Log</button>
      </div>

      {view === 'log' && <LogTab session={session} macros={macros} notify={notify} />}

      {view === 'goals' && (<>
        <div className="bmr-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div><div className="bmr-label">Resting metabolic rate</div><div className="bmr-val">{Math.round(bmr)} <span className="bmr-unit">kcal/day</span></div></div>
            <div style={{ textAlign: 'right' }}><div className="bmr-label">Daily target</div><div className="bmr-val" style={{ color: 'var(--rose)' }}>{macros.calories} <span className="bmr-unit">kcal</span></div></div>
          </div>
          <div className="macro-target-row">
            {[{ l: 'Protein', v: macros.protein + 'g', c: 'var(--sage)' }, { l: 'Carbs', v: macros.carbs + 'g', c: 'var(--plum2)' }, { l: 'Fat', v: macros.fat + 'g', c: 'var(--gold)' }].map(m => (
              <div key={m.l} className="macro-target-cell"><div className="mtv" style={{ color: m.c }}>{m.v}</div><div className="mtl">{m.l}</div></div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>Mifflin-St Jeor · {goals.diet} · {goals.goalType === 'lose' ? '-500 kcal deficit' : goals.goalType === 'gain' ? '+300 kcal surplus' : 'maintenance'}</p>
        </div>

        <div className="card">
          <div className="card-title">Weight log</div>
          {latest && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 12 }}>
              <span style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 42, fontWeight: 600, color: 'var(--plum)' }}>{latest}<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--muted)' }}>lbs</span></span>
              <div>
                {change !== null && <div style={{ fontSize: 13, fontWeight: 500, color: +change < 0 ? 'var(--sage)' : 'var(--orange)' }}>{+change < 0 ? '▼' : '▲'} {Math.abs(change)} lbs</div>}
                {toGoal && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{+toGoal > 0 ? `${toGoal} lbs to goal` : 'Goal reached!'}</div>}
              </div>
            </div>
          )}
          {weights.length > 1 ? (
            <div style={{ background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 10px 6px', marginBottom: 14 }}>
              <WeightChart weights={weights} goalWeight={goals.goalWeight} />
            </div>
          ) : weights.length === 1 ? (
            <div style={{ background: 'var(--warm)', border: '1px solid var(--border)', borderRadius: 14, padding: 18, textAlign: 'center', marginBottom: 14, fontSize: 12, color: 'var(--muted)' }}>
              Log another entry to see your trend line
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ width: 90 }} type="number" placeholder="lbs" value={wt} onChange={e => setWt(e.target.value)} />
            <input style={{ flex: 1 }} type="date" value={wd} onChange={e => setWd(e.target.value)} />
            <button className="btn-sm" style={{ padding: '0 18px' }} onClick={logW}>Log</button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Body metrics</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['Current weight (lbs)', 'weight'], ['Goal weight (lbs)', 'goalWeight'], ['Height (inches)', 'height'], ['Age', 'age']].map(([lbl, k]) => (
              <div key={k}><label className="input-label">{lbl}</label><input type="number" value={goals[k] || ''} onChange={e => up(k, +e.target.value)} /></div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="input-label" style={{ margin: 0 }}>Biological sex</span>
            <div style={{ display: 'flex', gap: 6 }}>{['female', 'male'].map(sv => <button key={sv} className={`pill-btn${goals.sex === sv ? ' on' : ''}`} onClick={() => up('sex', sv)}>{sv === 'female' ? 'Female' : 'Male'}</button>)}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Activity level</div>
          {Object.entries(ACT).map(([k, a]) => (
            <button key={k} className={`act-row${goals.activity === k ? ' on' : ''}`} onClick={() => up('activity', k)}>
              <div style={{ fontWeight: 500, fontSize: 13, flex: 1, textAlign: 'left', color: 'var(--text)' }}>{a.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', flex: 2, textAlign: 'left' }}>{a.desc}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: goals.activity === k ? 'var(--plum2)' : 'var(--muted2)' }}>x{a.mult}</div>
            </button>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Goal</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['lose', 'Lose weight'], ['maintain', 'Maintain'], ['gain', 'Build muscle']].map(([k, l]) => (
              <button key={k} className={`goal-btn${goals.goalType === k ? ' on' : ''}`} onClick={() => up('goalType', k)}>{l}</button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Diet style</div>
          <div className="chips wrap">
            {['balanced','keto','high-protein','low-carb','vegan','vegetarian','mediterranean','paleo'].map(d => (
              <button key={d} className={`chip${goals.diet === d ? ' on' : ''}`} onClick={() => up('diet', d)}>{d}</button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Allergies</div>
          <div className="chips wrap">
            {['gluten','dairy','nuts','shellfish','eggs','soy','fish','sesame'].map(a => (
              <button key={a} className={`chip${goals.allergies.includes(a) ? ' red' : ''}`} onClick={() => up('allergies', goals.allergies.includes(a) ? goals.allergies.filter(x => x !== a) : [...goals.allergies, a])}>{a}</button>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-title">Household size</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className="qty-btn" onClick={() => up('householdSize', Math.max(1, goals.householdSize - 1))}>-</button>
            <span style={{ fontSize: 24, fontWeight: 500, color: 'var(--plum)', fontFamily: "'Fraunces',Georgia,serif", minWidth: 32, textAlign: 'center' }}>{goals.householdSize}</span>
            <button className="qty-btn" onClick={() => up('householdSize', goals.householdSize + 1)}>+</button>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>people</span>
          </div>
        </div>

        <button className="btn-full" onClick={async () => { if (saveGoals) await saveGoals(goals); notify('Goals saved') }}>Save goals</button>
      </>)}
    </div>
  )
}
