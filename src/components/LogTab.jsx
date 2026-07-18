import { useState, useEffect, useCallback } from 'react'
import { loadFoodLogs, insertFoodLog, deleteFoodLog, loadDailyTargets, saveDailyTargets } from '../lib/foodLog.js'

const MEALS = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' }
const MEAL_ICON  = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

function today() { return new Date().toISOString().split('T')[0] }
function fmt(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function addDays(d, n) {
  const dt = new Date(d + 'T12:00:00'); dt.setDate(dt.getDate() + n)
  return dt.toISOString().split('T')[0]
}
const emptyForm = meal => ({ name: '', meal, calories: '', protein_g: '', carbs_g: '', fat_g: '' })

export default function LogTab({ session, macros, notify }) {
  const [date, setDate]               = useState(today)
  const [logs, setLogs]               = useState([])
  const [targets, setTargets]         = useState(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [showTargets, setShowTargets] = useState(false)
  const [tf, setTf]                   = useState({ calories: '', protein_g: '', carbs_g: '', fat_g: '' })
  const [savingTargets, setSavingTargets] = useState(false)
  const [addingTo, setAddingTo]       = useState(null)
  const [form, setForm]               = useState(emptyForm('breakfast'))
  const [saving, setSaving]           = useState(false)

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
      if (t) {
        setTargets(t)
      } else {
        setTf({ calories: macros?.calories || 2000, protein_g: macros?.protein || 150, carbs_g: macros?.carbs || 200, fat_g: macros?.fat || 65 })
        setShowTargets(true)
      }
    })
  }, [uid])

  useEffect(() => { fetchLogs(date) }, [fetchLogs, date])

  const target = targets || { calories: macros?.calories || 2000, protein_g: macros?.protein || 150, carbs_g: macros?.carbs || 200, fat_g: macros?.fat || 65 }

  const totals = logs.reduce((a, l) => ({
    cal:   a.cal   + (l.calories  || 0),
    pro:   a.pro   + (l.protein_g || 0),
    carbs: a.carbs + (l.carbs_g   || 0),
    fat:   a.fat   + (l.fat_g     || 0),
  }), { cal: 0, pro: 0, carbs: 0, fat: 0 })

  const calPct = Math.min(100, target.calories > 0 ? (totals.cal / target.calories) * 100 : 0)
  const isOver = totals.cal > target.calories
  const isToday = date === today()

  const handleSaveTargets = async () => {
    if (!uid) return
    const t = { calories: +tf.calories || 2000, protein_g: +tf.protein_g || 150, carbs_g: +tf.carbs_g || 200, fat_g: +tf.fat_g || 65 }
    setSavingTargets(true)
    try {
      await saveDailyTargets(uid, t)
      setTargets(t); setShowTargets(false); notify('Targets saved')
    } catch { notify('Save failed', 'err') }
    setSavingTargets(false)
  }

  const openAdd = meal => { setForm(emptyForm(meal)); setAddingTo(meal) }

  const handleAdd = async () => {
    if (!form.name || !form.calories) return
    setSaving(true)
    try {
      const entry = { log_date: date, meal: form.meal, source: 'manual', name: form.name, serving_qty: 1, serving_unit: 'serving', calories: +form.calories, protein_g: +form.protein_g || 0, carbs_g: +form.carbs_g || 0, fat_g: +form.fat_g || 0 }
      const row = await insertFoodLog(uid, entry)
      setLogs(l => [...l, row])
      setForm(emptyForm(form.meal))
      setAddingTo(null)
      notify('Logged: ' + entry.name)
    } catch { notify('Log failed', 'err') }
    setSaving(false)
  }

  const handleDelete = async id => {
    await deleteFoodLog(id)
    setLogs(l => l.filter(x => x.id !== id))
  }

  const grouped = MEALS.reduce((acc, m) => { acc[m] = logs.filter(l => l.meal === m); return acc }, {})

  return (
    <div>
      {/* Date nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button className="btn-sm" onClick={() => setDate(d => addDays(d, -1))}>←</button>
        <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 18, fontWeight: 600, color: 'var(--plum)' }}>
          {isToday ? 'Today' : fmt(date)}
        </div>
        <button className="btn-sm" onClick={() => setDate(d => addDays(d, 1))} disabled={isToday}>→</button>
      </div>

      {/* Daily summary */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 52, fontWeight: 700, lineHeight: 1, color: isOver ? 'var(--orange)' : 'var(--plum)' }}>
              {Math.round(totals.cal).toLocaleString()}
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>of {target.calories.toLocaleString()} kcal</div>
          </div>
          <div style={{ textAlign: 'right', paddingBottom: 6 }}>
            <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 30, fontWeight: 600, color: isOver ? 'var(--orange)' : 'var(--sage)' }}>
              {isOver ? `+${Math.round(totals.cal - target.calories)}` : Math.round(target.calories - totals.cal)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{isOver ? 'over' : 'remaining'}</div>
          </div>
        </div>

        <div style={{ height: 10, background: 'var(--warm)', borderRadius: 6, overflow: 'hidden', marginBottom: 16 }}>
          <div style={{ height: '100%', width: calPct + '%', background: isOver ? 'var(--orange)' : 'linear-gradient(90deg,#6B8F6B,#8BBF83)', borderRadius: 6, transition: 'width .3s' }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { l: 'Protein', v: Math.round(totals.pro),   t: target.protein_g, c: 'var(--sage)'  },
            { l: 'Carbs',   v: Math.round(totals.carbs), t: target.carbs_g,   c: 'var(--plum2)' },
            { l: 'Fat',     v: Math.round(totals.fat),   t: target.fat_g,     c: 'var(--gold)'  },
          ].map(m => (
            <div key={m.l} style={{ flex: 1, background: 'var(--warm)', borderRadius: 12, padding: '10px 0', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 20, fontWeight: 600, color: m.c, lineHeight: 1 }}>
                {m.v}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--muted)' }}>g</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{m.l} / {m.t}g</div>
            </div>
          ))}
        </div>

        <button onClick={() => { setTf({ calories: target.calories, protein_g: target.protein_g, carbs_g: target.carbs_g, fat_g: target.fat_g }); setShowTargets(v => !v) }}
          style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--muted)', cursor: 'pointer', padding: '8px 0 0', width: '100%', textAlign: 'right' }}>
          Edit targets
        </button>
      </div>

      {/* Target form */}
      {showTargets && (
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
            {targets && <button className="btn-sm" onClick={() => setShowTargets(false)} style={{ whiteSpace: 'nowrap' }}>Cancel</button>}
          </div>
        </div>
      )}

      {/* Meal sections — always visible */}
      {loadingLogs ? (
        <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
      ) : (
        MEALS.map(meal => {
          const items = grouped[meal]
          const mealCal = Math.round(items.reduce((s, l) => s + (l.calories || 0), 0))
          const isOpen = addingTo === meal
          const hasBorder = items.length > 0 || isOpen

          return (
            <div key={meal} className="card" style={{ marginBottom: 12, padding: 0, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: hasBorder ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{MEAL_ICON[meal]}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{MEAL_LABEL[meal]}</div>
                    {mealCal > 0 && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{mealCal} cal</div>}
                  </div>
                </div>
                <button
                  onClick={() => isOpen ? setAddingTo(null) : openAdd(meal)}
                  style={{ background: isOpen ? 'var(--warm)' : 'var(--plumLL)', border: `1px solid ${isOpen ? 'var(--border)' : 'var(--plum3)'}`, borderRadius: 20, padding: '5px 14px', fontSize: 12, fontWeight: 600, color: isOpen ? 'var(--muted)' : 'var(--plum2)', cursor: 'pointer' }}
                >
                  {isOpen ? 'Cancel' : '+ Add food'}
                </button>
              </div>

              {/* Items */}
              {items.map((log, i) => (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', borderBottom: (i < items.length - 1 || isOpen) ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {Math.round(log.calories)} cal · P {Math.round(log.protein_g)}g · C {Math.round(log.carbs_g)}g · F {Math.round(log.fat_g)}g
                    </div>
                  </div>
                  <button onClick={() => handleDelete(log.id)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, width: 28, height: 28, color: 'var(--muted2)', cursor: 'pointer', fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}

              {/* Inline add form */}
              {isOpen && (
                <div style={{ padding: '14px 16px', background: 'var(--warm)' }}>
                  <div style={{ marginBottom: 10 }}>
                    <label className="input-label">Food name *</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Chicken breast" autoFocus />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    <div><label className="input-label">Calories *</label><input type="number" value={form.calories} onChange={e => setForm(f => ({ ...f, calories: e.target.value }))} placeholder="0" /></div>
                    <div><label className="input-label">Protein (g)</label><input type="number" value={form.protein_g} onChange={e => setForm(f => ({ ...f, protein_g: e.target.value }))} placeholder="0" /></div>
                    <div><label className="input-label">Carbs (g)</label><input type="number" value={form.carbs_g} onChange={e => setForm(f => ({ ...f, carbs_g: e.target.value }))} placeholder="0" /></div>
                    <div><label className="input-label">Fat (g)</label><input type="number" value={form.fat_g} onChange={e => setForm(f => ({ ...f, fat_g: e.target.value }))} placeholder="0" /></div>
                  </div>
                  <button className="btn-full" onClick={handleAdd} disabled={saving || !form.name || !form.calories}>
                    {saving ? 'Logging…' : 'Log it'}
                  </button>
                </div>
              )}

              {/* Empty state */}
              {items.length === 0 && !isOpen && (
                <div style={{ padding: '10px 16px 14px', fontSize: 12, color: 'var(--muted)' }}>Nothing logged yet</div>
              )}
            </div>
          )
        })
      )}
      <div style={{ height: 16 }} />
    </div>
  )
}
