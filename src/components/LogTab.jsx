import { useState, useEffect, useCallback } from 'react'
import { loadFoodLogs, insertFoodLog, deleteFoodLog, loadDailyTargets, saveDailyTargets } from '../lib/foodLog.js'

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }

function today() { return new Date().toISOString().split('T')[0] }
function fmt(d) {
  const dt = new Date(d + 'T12:00:00')
  return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function addDays(d, n) {
  const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() + n)
  return dt.toISOString().split('T')[0]
}
function defaultMeal() {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 18) return 'snack'
  return 'dinner'
}

function MacroBar({ label, val, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round((val / target) * 100)) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
        <span style={{ fontWeight: 500 }}>{label}</span>
        <span>{Math.round(val)}g / {target}g</span>
      </div>
      <div style={{ height: 6, background: 'var(--warm)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 4, transition: 'width .3s' }} />
      </div>
    </div>
  )
}

export default function LogTab({ session, macros, notify }) {
  const [date, setDate] = useState(today)
  const [logs, setLogs] = useState([])
  const [targets, setTargets] = useState(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [showTargetForm, setShowTargetForm] = useState(false)
  const [tf, setTf] = useState({ calories: '', protein_g: '', carbs_g: '', fat_g: '' })
  const [savingTargets, setSavingTargets] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [mf, setMf] = useState({ name: '', meal: defaultMeal(), calories: '', protein_g: '', carbs_g: '', fat_g: '', serving_qty: '1', serving_unit: 'serving' })
  const [addingLog, setAddingLog] = useState(false)

  const uid = session?.user?.id

  const fetchLogs = useCallback(async d => {
    if (!uid) return
    setLoadingLogs(true)
    setLogs(await loadFoodLogs(uid, d))
    setLoadingLogs(false)
  }, [uid])

  useEffect(() => {
    if (!uid) return
    loadDailyTargets(uid).then(t => {
      if (t) setTargets(t)
      else setShowTargetForm(true)
    })
  }, [uid])

  useEffect(() => { fetchLogs(date) }, [fetchLogs, date])

  const target = targets || {
    calories: macros?.calories || 2000,
    protein_g: macros?.protein || 150,
    carbs_g: macros?.carbs || 200,
    fat_g: macros?.fat || 65,
  }

  const totals = logs.reduce((a, l) => ({
    cal:   a.cal   + (l.calories  || 0),
    pro:   a.pro   + (l.protein_g || 0),
    carbs: a.carbs + (l.carbs_g   || 0),
    fat:   a.fat   + (l.fat_g     || 0),
  }), { cal: 0, pro: 0, carbs: 0, fat: 0 })

  const calPct = target.calories > 0 ? Math.min(100, Math.round((totals.cal / target.calories) * 100)) : 0
  const remaining = Math.max(0, target.calories - Math.round(totals.cal))
  const isToday = date === today()

  const handleSaveTargets = async () => {
    if (!uid) return
    const t = { calories: +tf.calories || 2000, protein_g: +tf.protein_g || 150, carbs_g: +tf.carbs_g || 200, fat_g: +tf.fat_g || 65 }
    setSavingTargets(true)
    try {
      await saveDailyTargets(uid, t)
      setTargets(t); setShowTargetForm(false); notify('Targets saved')
    } catch { notify('Save failed', 'err') }
    setSavingTargets(false)
  }

  const openTargetForm = () => {
    setTf({ calories: target.calories, protein_g: target.protein_g, carbs_g: target.carbs_g, fat_g: target.fat_g })
    setShowTargetForm(true)
  }

  const handleAddManual = async () => {
    if (!mf.name || !mf.calories) return
    setAddingLog(true)
    try {
      const entry = {
        log_date: date, meal: mf.meal, source: 'manual', name: mf.name,
        serving_qty: 1, serving_unit: mf.serving_unit || 'serving',
        calories: +mf.calories, protein_g: +mf.protein_g || 0,
        carbs_g: +mf.carbs_g || 0, fat_g: +mf.fat_g || 0,
      }
      const row = await insertFoodLog(uid, entry)
      setLogs(l => [...l, row])
      setMf({ name: '', meal: defaultMeal(), calories: '', protein_g: '', carbs_g: '', fat_g: '', serving_qty: '1', serving_unit: 'serving' })
      setShowManual(false)
      notify('Logged: ' + entry.name)
    } catch { notify('Log failed', 'err') }
    setAddingLog(false)
  }

  const handleDelete = async (id) => {
    await deleteFoodLog(id)
    setLogs(l => l.filter(x => x.id !== id))
  }

  const grouped = MEALS.reduce((acc, m) => {
    acc[m] = logs.filter(l => l.meal === m)
    return acc
  }, {})

  return (
    <div>
      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button className="btn-sm" onClick={() => setDate(d => addDays(d, -1))}>←</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, fontWeight: 600, color: 'var(--plum)' }}>
            {isToday ? 'Today' : fmt(date)}
          </div>
          {!isToday && <div style={{ fontSize: 11, color: 'var(--muted)' }}>{fmt(date)}</div>}
        </div>
        <button className="btn-sm" onClick={() => setDate(d => addDays(d, 1))} disabled={isToday}>→</button>
      </div>

      {/* Daily summary */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 42, fontWeight: 600, color: calPct >= 100 ? 'var(--orange)' : 'var(--plum)', lineHeight: 1 }}>
              {Math.round(totals.cal).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
              of {target.calories.toLocaleString()} kcal
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: calPct >= 100 ? 'var(--orange)' : 'var(--sage)', fontFamily: "'Fraunces',Georgia,serif" }}>
              {calPct >= 100 ? '+' + (Math.round(totals.cal) - target.calories) : remaining}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{calPct >= 100 ? 'over' : 'remaining'}</div>
          </div>
        </div>
        {/* Calorie ring (simple progress bar) */}
        <div style={{ height: 8, background: 'var(--warm)', borderRadius: 6, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: '100%', width: calPct + '%', background: calPct >= 100 ? 'var(--orange)' : 'var(--grad, linear-gradient(90deg,#6B8F6B,#8BBF83))', borderRadius: 6, transition: 'width .3s' }} />
        </div>
        <MacroBar label="Protein" val={totals.pro}   target={target.protein_g} color="var(--sage)"  />
        <MacroBar label="Carbs"   val={totals.carbs} target={target.carbs_g}   color="var(--plum2)" />
        <MacroBar label="Fat"     val={totals.fat}   target={target.fat_g}     color="var(--gold)"  />
        <button onClick={openTargetForm} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', padding: '4px 0 0', width: '100%', textAlign: 'right' }}>
          Edit targets
        </button>
      </div>

      {/* Target form */}
      {showTargetForm && (
        <div className="card" style={{ marginBottom: 16, border: '1.5px solid var(--plum3)' }}>
          <div className="card-title">Daily targets</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['Calories (kcal)', 'calories'], ['Protein (g)', 'protein_g'], ['Carbs (g)', 'carbs_g'], ['Fat (g)', 'fat_g']].map(([lbl, k]) => (
              <div key={k}>
                <label className="input-label">{lbl}</label>
                <input type="number" value={tf[k]} onChange={e => setTf(t => ({ ...t, [k]: e.target.value }))} placeholder={target[k]} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-full" onClick={handleSaveTargets} disabled={savingTargets}>{savingTargets ? 'Saving…' : 'Save targets'}</button>
            {targets && <button className="btn-sm" onClick={() => setShowTargetForm(false)} style={{ whiteSpace: 'nowrap' }}>Cancel</button>}
          </div>
        </div>
      )}

      {/* Add manually */}
      <button className="btn-ghost" onClick={() => setShowManual(v => !v)} style={{ marginBottom: showManual ? 0 : 16 }}>
        {showManual ? 'Hide entry form' : '+ Log food manually'}
      </button>
      {showManual && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Log food</div>
          <div><label className="input-label">Food name *</label><input value={mf.name} onChange={e => setMf(m => ({ ...m, name: e.target.value }))} placeholder="e.g. Oatmeal" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '10px 0' }}>
            <div><label className="input-label">Calories *</label><input type="number" value={mf.calories} onChange={e => setMf(m => ({ ...m, calories: e.target.value }))} /></div>
            <div><label className="input-label">Protein (g)</label><input type="number" value={mf.protein_g} onChange={e => setMf(m => ({ ...m, protein_g: e.target.value }))} /></div>
            <div><label className="input-label">Carbs (g)</label><input type="number" value={mf.carbs_g} onChange={e => setMf(m => ({ ...m, carbs_g: e.target.value }))} /></div>
            <div><label className="input-label">Fat (g)</label><input type="number" value={mf.fat_g} onChange={e => setMf(m => ({ ...m, fat_g: e.target.value }))} /></div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="input-label">Meal</label>
            <div className="seg" style={{ marginBottom: 0 }}>
              {MEALS.map(m => (
                <button key={m} className={`seg-btn${mf.meal === m ? ' on' : ''}`} onClick={() => setMf(f => ({ ...f, meal: m }))} style={{ fontSize: 12 }}>
                  {MEAL_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
          <button className="btn-full" onClick={handleAddManual} disabled={addingLog || !mf.name || !mf.calories}>
            {addingLog ? 'Logging…' : 'Log it'}
          </button>
        </div>
      )}

      {/* Meal groups */}
      {loadingLogs ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
      ) : logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 13, lineHeight: 1.6 }}>
          Nothing logged yet{isToday ? ' today' : ''}.<br />Scan a barcode or add manually above.
        </div>
      ) : (
        MEALS.filter(m => grouped[m].length > 0).map(m => (
          <div key={m} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
              {MEAL_LABEL[m]}
              <span style={{ fontWeight: 400, marginLeft: 6 }}>
                {Math.round(grouped[m].reduce((s, l) => s + l.calories, 0))} cal
              </span>
            </div>
            {grouped[m].map(log => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    {log.serving_qty !== 1 && `${log.serving_qty} × `}{log.serving_unit}
                    {'  ·  '}{Math.round(log.calories)} cal
                    {'  ·  P'}{Math.round(log.protein_g)}g
                    {'  C'}{Math.round(log.carbs_g)}g
                    {'  F'}{Math.round(log.fat_g)}g
                  </div>
                </div>
                <button onClick={() => handleDelete(log.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, color: 'var(--muted2)', cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
            ))}
          </div>
        ))
      )}
      <div style={{ height: 16 }} />
    </div>
  )
}
