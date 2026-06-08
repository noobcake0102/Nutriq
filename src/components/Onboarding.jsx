import { useState } from 'react'
import { supa } from '../lib/supabase.js'
import { calcBMR, ACT, calcMacros } from '../lib/nutrition.js'
import { DG, CUISINES, MEAL_TYPES } from '../constants.js'
import BloomLogo from './BloomLogo.jsx'

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [g, setG] = useState({ ...DG })
  const [cuisines, setCuisines] = useState([])
  const [mealPrefs, setMealPrefs] = useState({})
  const [loading, setLoading] = useState(false)
  const up = (k, v) => setG(x => ({ ...x, [k]: v }))
  const bmr = calcBMR(g), tdee = Math.round(bmr * (ACT[g.activity]?.mult || 1.55)), macros = calcMacros(tdee, g.diet, g.goalType)
  const toggleCuisine = c => setCuisines(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c])
  const toggleMealType = t => setMealPrefs(mp => { const n = { ...mp }; if (n[t]) delete n[t]; else n[t] = 1; return n })
  const setMealCount = (t, v) => setMealPrefs(mp => ({ ...mp, [t]: Math.max(1, Math.min(7, +v || 1)) }))

  const finish = async () => {
    setLoading(true)
    try {
      let hid = null
      const { data: ep } = await supa.from('profiles').select('household_id').eq('id', user.id).maybeSingle()
      if (ep?.household_id) { hid = ep.household_id }
      else { const { data: nh } = await supa.from('households').insert({ name: `${name}'s Household` }).select().single(); hid = nh?.id }
      await supa.from('profiles').upsert({ id: user.id, household_id: hid, name, role: 'owner', onboarding_complete: true }, { onConflict: 'id' })
      await supa.from('goals').upsert({
        user_id: user.id, household_id: hid,
        weight: g.weight || 0, goal_weight: g.goalWeight || 0, height: g.height || 0, age: g.age || 0,
        sex: g.sex || 'female', activity: g.activity || 'moderate', goal_type: g.goalType || 'lose',
        diet: g.diet || 'balanced', allergies: g.allergies || [], household_size: g.householdSize || 1,
        meal_cuisines: cuisines || [], meal_preferences: mealPrefs || {}, updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id', ignoreDuplicates: false })
      onComplete({ ...g, name, meal_cuisines: cuisines, meal_preferences: mealPrefs })
    } catch (e) {
      console.error('Onboarding error:', e)
      onComplete({ ...g, name, meal_cuisines: cuisines, meal_preferences: mealPrefs })
    }
    setLoading(false)
  }

  const steps = [
    <div key={0} className="ob-body">
      <div className="ob-step">Step 1 of 4 — About you</div>
      <div className="ob-progress">{[0,1,2,3].map(i => <div key={i} className={`ob-dot${i <= 0 ? ' on' : ''}`} />)}</div>
      <div className="ob-field"><label className="ob-label">Your first name</label><input className="ob-input" placeholder="e.g. Sarah" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
      <div className="ob-grid">
        <div className="ob-field"><label className="ob-label">Current weight (lbs)</label><input className="ob-input" type="number" value={g.weight || ''} onChange={e => up('weight', +e.target.value)} /></div>
        <div className="ob-field"><label className="ob-label">Goal weight (lbs)</label><input className="ob-input" type="number" value={g.goalWeight || ''} onChange={e => up('goalWeight', +e.target.value)} /></div>
        <div className="ob-field"><label className="ob-label">Height (inches)</label><input className="ob-input" type="number" value={g.height || ''} onChange={e => up('height', +e.target.value)} /></div>
        <div className="ob-field"><label className="ob-label">Age</label><input className="ob-input" type="number" value={g.age || ''} onChange={e => up('age', +e.target.value)} /></div>
      </div>
      <div className="ob-field"><label className="ob-label">Biological sex</label>
        <div style={{ display: 'flex', gap: 8 }}>{['female','male'].map(s => <button key={s} className={`ob-sel-btn${g.sex === s ? ' on' : ''}`} onClick={() => up('sex', s)}>{s === 'female' ? 'Female' : 'Male'}</button>)}</div>
      </div>
      <div className="ob-field"><label className="ob-label">Household size</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="qty-btn" onClick={() => up('householdSize', Math.max(1, g.householdSize - 1))}>-</button>
          <span style={{ fontSize: 22, fontWeight: 500, color: 'var(--plum)', minWidth: 28, textAlign: 'center' }}>{g.householdSize}</span>
          <button className="qty-btn" onClick={() => up('householdSize', g.householdSize + 1)}>+</button>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>people</span>
        </div>
      </div>
      <button className="ob-next" onClick={() => setStep(1)} disabled={!name || !g.weight || !g.height || !g.age}>Continue</button>
    </div>,

    <div key={1} className="ob-body">
      <div className="ob-step">Step 2 of 4 — Your goals</div>
      <div className="ob-progress">{[0,1,2,3].map(i => <div key={i} className={`ob-dot${i <= 1 ? ' on' : ''}`} />)}</div>
      {bmr > 0 && <div style={{ background: 'var(--plumLL)', border: '1px solid var(--plum3)22', borderRadius: 14, padding: 14, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Your daily target</div><div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: 28, fontWeight: 600, color: 'var(--plum)' }}>{macros.calories} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)' }}>kcal</span></div></div>
        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--muted)', lineHeight: 1.8 }}><div>P: {macros.protein}g</div><div>C: {macros.carbs}g</div><div>F: {macros.fat}g</div></div>
      </div>}
      <div className="ob-field"><label className="ob-label">Goal</label>
        <div style={{ display: 'flex', gap: 8 }}>{[['lose','Lose'],['maintain','Maintain'],['gain','Gain']].map(([k,l]) => <button key={k} className={`ob-sel-btn${g.goalType === k ? ' on' : ''}`} onClick={() => up('goalType', k)}>{l}</button>)}</div>
      </div>
      <div className="ob-field"><label className="ob-label">Activity level</label>
        {Object.entries(ACT).map(([k, a]) => <button key={k} className={`act-row${g.activity === k ? ' on' : ''}`} onClick={() => up('activity', k)}>
          <div style={{ fontWeight: 500, fontSize: 13, flex: 1, textAlign: 'left' }}>{a.label}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', flex: 2, textAlign: 'left' }}>{a.desc}</div>
          <div style={{ fontSize: 12, fontWeight: 500, color: g.activity === k ? 'var(--plum2)' : 'var(--muted2)' }}>x{a.mult}</div>
        </button>)}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="ob-back" onClick={() => setStep(0)}>Back</button>
        <button className="ob-next" onClick={() => setStep(2)}>Continue</button>
      </div>
    </div>,

    <div key={2} className="ob-body">
      <div className="ob-step">Step 3 of 4 — Diet and allergies</div>
      <div className="ob-progress">{[0,1,2,3].map(i => <div key={i} className={`ob-dot${i <= 2 ? ' on' : ''}`} />)}</div>
      <div className="ob-field"><label className="ob-label">Diet style</label>
        <div className="ob-sel-grid">{['balanced','keto','high-protein','low-carb','vegan','vegetarian','mediterranean','paleo'].map(d => <button key={d} className={`ob-sel-btn${g.diet === d ? ' on' : ''}`} onClick={() => up('diet', d)}>{d}</button>)}</div>
      </div>
      <div className="ob-field"><label className="ob-label">Allergies</label>
        <div className="ob-sel-grid">{['gluten','dairy','nuts','shellfish','eggs','soy','fish','sesame'].map(a => <button key={a} className={`ob-sel-btn${g.allergies.includes(a) ? ' on' : ''}`} onClick={() => up('allergies', g.allergies.includes(a) ? g.allergies.filter(x => x !== a) : [...g.allergies, a])}>{a}</button>)}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="ob-back" onClick={() => setStep(1)}>Back</button>
        <button className="ob-next" onClick={() => setStep(3)}>Continue</button>
      </div>
    </div>,

    <div key={3} className="ob-body">
      <div className="ob-step">Step 4 of 4 — Meal preferences</div>
      <div className="ob-progress">{[0,1,2,3].map(i => <div key={i} className={`ob-dot${i <= 3 ? ' on' : ''}`} />)}</div>
      <div className="ob-field"><label className="ob-label">Favorite cuisines</label>
        <div className="ob-sel-grid">{CUISINES.map(c => <button key={c} className={`ob-sel-btn${cuisines.includes(c) ? ' on' : ''}`} onClick={() => toggleCuisine(c)}>{c}</button>)}</div>
      </div>
      <div className="ob-field"><label className="ob-label">Meals per week — tap to add, set count</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {MEAL_TYPES.map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className={`ob-sel-btn${mealPrefs[t] ? ' on' : ''}`} style={{ flex: 1, textAlign: 'left' }} onClick={() => toggleMealType(t)}>{t}</button>
              {mealPrefs[t] && <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <button className="qty-btn" style={{ width: 30, height: 30, fontSize: 16 }} onClick={() => setMealCount(t, mealPrefs[t] - 1)}>-</button>
                <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--plum)', minWidth: 20, textAlign: 'center' }}>{mealPrefs[t]}</span>
                <button className="qty-btn" style={{ width: 30, height: 30, fontSize: 16 }} onClick={() => setMealCount(t, mealPrefs[t] + 1)}>+</button>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>/ wk</span>
              </div>}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="ob-back" onClick={() => setStep(2)}>Back</button>
        <button className="ob-next" onClick={finish} disabled={loading || Object.keys(mealPrefs).length === 0}>{loading ? <span className="spin" /> : "Let's get cooking"}</button>
      </div>
    </div>,
  ]

  return (
    <div className="ob-wrap">
      <div className="ob-hero"><BloomLogo size={80} /><div className="ob-title">Welcome to Nutriq</div><div className="ob-sub">Feed your family better,<br />without the mental math.</div></div>
      {steps[step]}
    </div>
  )
}
