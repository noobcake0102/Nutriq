import { useState, useEffect } from 'react'
import { streamClaude } from '../lib/claude.js'
import { loadWorkoutProfile, saveWorkoutProfile, loadCurrentPlan, savePlan, loadLogs, upsertLog } from '../lib/workoutPlan.js'

const SYSTEM_PROMPT = `You are a certified strength and conditioning coach designing a one-week training plan.

You will receive a user's profile: goal, experience level, equipment access, preferred workout styles, days available per week, and any injury/limitation notes.

Rules:
- Respect the days-per-week constraint exactly; remaining days are explicit rest or active recovery days.
- Only program movements possible with the stated equipment access.
- If injuries/limitations are noted, avoid or substitute contraindicated movements and say so in the notes field.
- Balance the requested styles across the week rather than doing all of one style back to back — alternate muscle groups/energy systems for recovery.
- For "lose_weight" goals, favor a mix of strength (to preserve muscle) and moderate-intensity conditioning over excessive daily high-intensity work.
- Progressive overload: if given a prior week's plan, increase load/volume/difficulty sensibly; do not jump more than ~10% in volume week over week.
- Output ONLY valid JSON matching the schema provided. No prose outside the JSON.`

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABEL = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday' }
const DAY_SHORT  = { monday:'Mon', tuesday:'Tue', wednesday:'Wed', thursday:'Thu', friday:'Fri', saturday:'Sat', sunday:'Sun' }

const STYLES      = ['strength','cardio','hiit','mobility_sport']
const STYLE_LABEL = { strength:'Strength', cardio:'Cardio', hiit:'HIIT / Circuit', mobility_sport:'Mobility / Sport' }
const EQUIPMENT   = ['full_gym','home_equipment','bodyweight','mixed']
const EQUIP_LABEL = { full_gym:'Full gym', home_equipment:'Home equipment', bodyweight:'Bodyweight only', mixed:'Mixed' }
const GOAL_OPTS   = ['lose_weight','build_muscle','maintain','performance']
const GOAL_LABEL  = { lose_weight:'Lose weight', build_muscle:'Build muscle', maintain:'Maintain', performance:'Improve performance' }
const EXPERIENCE  = ['beginner','intermediate','advanced']

function mkDefault(goals) {
  return {
    age: goals?.age || '',
    sex: goals?.sex || 'female',
    height_cm: goals?.height ? Math.round(goals.height * 2.54) : '',
    current_weight: goals?.weight || '',
    target_weight: goals?.goalWeight || '',
    goal: goals?.goalType === 'lose' ? 'lose_weight' : goals?.goalType === 'gain' ? 'build_muscle' : 'maintain',
    experience_level: 'intermediate',
    equipment_access: 'full_gym',
    preferred_styles: ['strength', 'cardio'],
    days_per_week: 4,
    injuries_notes: '',
  }
}

function buildPrompt(profile, adjustNote, priorPlan) {
  const lines = [
    `User workout profile:`,
    `- Goal: ${profile.goal}`,
    `- Experience level: ${profile.experience_level}`,
    `- Equipment: ${profile.equipment_access}`,
    `- Preferred styles: ${(profile.preferred_styles || []).join(', ') || 'strength'}`,
    `- Days per week: ${profile.days_per_week}`,
    `- Age: ${profile.age}, Sex: ${profile.sex}`,
    `- Current weight: ${profile.current_weight} lbs, Target: ${profile.target_weight} lbs`,
    `- Injuries/limitations: ${profile.injuries_notes || 'none'}`,
  ]
  if (adjustNote && priorPlan) {
    lines.push('', `Current plan:`, JSON.stringify(priorPlan, null, 2), '', `User modification: "${adjustNote}"`, '', `Return the complete updated plan JSON addressing this change.`)
  } else {
    lines.push('', `Generate a complete 7-day plan (monday through sunday).`, `Use this JSON schema exactly:`, `{"week_summary":"string","days":[{"day":"monday","focus":"string","warmup":"string","exercises":[{"name":"string","sets":4,"reps":"8-10","rest_seconds":90,"notes":"string"}],"cooldown":"string","estimated_duration_min":50}],"progression_notes":"string"}`)
  }
  return lines.join('\n')
}

const REGEN_KEY = 'nq_workout_last_gen'

export default function WorkoutTab({ session, goals, notify }) {
  const uid = session?.user?.id

  const [stage, setStage]             = useState('loading')
  const [profile, setProfile]         = useState(null)
  const [plan, setPlan]               = useState(null)
  const [logs, setLogs]               = useState({})
  const [expanded, setExpanded]       = useState(new Set())
  const [generating, setGenerating]   = useState(false)
  const [showAdjust, setShowAdjust]   = useState(false)
  const [adjustNote, setAdjustNote]   = useState('')
  const [adjusting, setAdjusting]     = useState(false)
  const [pf, setPf]                   = useState(() => mkDefault(goals))
  const [savingPf, setSavingPf]       = useState(false)

  useEffect(() => { if (uid) load() }, [uid])

  const load = async () => {
    try {
      const [prof, cur] = await Promise.all([loadWorkoutProfile(uid), loadCurrentPlan(uid)])
      if (prof) { setProfile(prof); setPf(prof) } else { setPf(mkDefault(goals)) }
      if (cur) {
        setPlan(cur)
        const planLogs = await loadLogs(uid, cur.id)
        setLogs(Object.fromEntries(planLogs.map(l => [l.day_key, l])))
      }
      setStage(prof ? 'plan' : 'setup')
    } catch { setStage('setup') }
  }

  const handleSaveProfile = async () => {
    if (!uid) return
    setSavingPf(true)
    try {
      await saveWorkoutProfile(uid, pf)
      setProfile(pf)
      setStage('plan')
      notify('Profile saved')
    } catch { notify('Save failed', 'err') }
    setSavingPf(false)
  }

  const generate = async (adjNote = '') => {
    setGenerating(true)
    let raw = ''
    const msg = buildPrompt(profile || pf, adjNote, adjNote ? plan?.plan_json : null)
    try {
      await streamClaude(SYSTEM_PROMPT, msg, t => { raw += t }, 'sonnet')
      const m = raw.match(/\{[\s\S]*\}/)
      if (!m) throw new Error('No JSON in response')
      const planJson = JSON.parse(m[0])
      const saved = await savePlan(uid, planJson)
      setPlan(saved)
      setLogs({})
      setExpanded(new Set())
      setShowAdjust(false)
      setAdjustNote('')
      localStorage.setItem(REGEN_KEY, Date.now().toString())
      notify('Plan generated!')
    } catch (e) {
      notify('Generation failed — try again', 'err')
      console.error(e)
    }
    setGenerating(false)
  }

  const handleAdjust = async () => {
    if (!adjustNote.trim()) return
    setAdjusting(true)
    await generate(adjustNote)
    setAdjusting(false)
  }

  const toggleDay = day => setExpanded(s => { const n = new Set(s); n.has(day) ? n.delete(day) : n.add(day); return n })

  const toggleDone = async dayKey => {
    if (!plan?.id) return
    const newDone = !logs[dayKey]?.completed
    const updated = await upsertLog(uid, plan.id, dayKey, newDone)
    setLogs(l => ({ ...l, [dayKey]: updated }))
  }

  const upPf = (k, v) => setPf(p => ({ ...p, [k]: v }))

  const planData  = plan?.plan_json
  const dayMap    = planData ? Object.fromEntries((planData.days || []).map(d => [d.day, d])) : {}
  const doneDays  = Object.values(logs).filter(l => l.completed).length
  const activeDays = planData ? (planData.days || []).filter(d => d.exercises?.length > 0).length : 0

  // ── Loading ──────────────────────────────────────────────────────────────
  if (stage === 'loading') {
    return <div style={{ textAlign: 'center', padding: 48, color: 'var(--muted)', fontSize: 13 }}>Loading…</div>
  }

  // ── Profile form ─────────────────────────────────────────────────────────
  if (stage === 'setup' || stage === 'editProfile') {
    return (
      <div>
        <div className="card">
          <div className="card-title">Workout profile</div>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
            Pre-filled from your nutrition goals — adjust as needed.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div><label className="input-label">Age</label><input type="number" value={pf.age} onChange={e => upPf('age', +e.target.value)} /></div>
            <div>
              <label className="input-label">Sex</label>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {['female','male'].map(s => (
                  <button key={s} className={`pill-btn${pf.sex === s ? ' on' : ''}`} onClick={() => upPf('sex', s)} style={{ flex: 1 }}>{s === 'female' ? 'Female' : 'Male'}</button>
                ))}
              </div>
            </div>
            <div><label className="input-label">Current weight (lbs)</label><input type="number" value={pf.current_weight} onChange={e => upPf('current_weight', +e.target.value)} /></div>
            <div><label className="input-label">Target weight (lbs)</label><input type="number" value={pf.target_weight} onChange={e => upPf('target_weight', +e.target.value)} /></div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="input-label">Primary goal</label>
            <div className="chips wrap">
              {GOAL_OPTS.map(k => (
                <button key={k} className={`chip${pf.goal === k ? ' on' : ''}`} onClick={() => upPf('goal', k)}>{GOAL_LABEL[k]}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="input-label">Experience level</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {EXPERIENCE.map(k => (
                <button key={k} className={`goal-btn${pf.experience_level === k ? ' on' : ''}`} onClick={() => upPf('experience_level', k)} style={{ flex: 1, textTransform: 'capitalize' }}>{k}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="input-label">Equipment access</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {EQUIPMENT.map(k => (
                <button key={k} className={`act-row${pf.equipment_access === k ? ' on' : ''}`} onClick={() => upPf('equipment_access', k)}>
                  <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--text)', textAlign: 'left' }}>{EQUIP_LABEL[k]}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="input-label">Preferred styles (multi-select)</label>
            <div className="chips wrap">
              {STYLES.map(k => (
                <button key={k}
                  className={`chip${(pf.preferred_styles || []).includes(k) ? ' on' : ''}`}
                  onClick={() => upPf('preferred_styles',
                    (pf.preferred_styles || []).includes(k)
                      ? (pf.preferred_styles || []).filter(s => s !== k)
                      : [...(pf.preferred_styles || []), k]
                  )}>
                  {STYLE_LABEL[k]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="input-label">Days per week</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[3, 4, 5].map(d => (
                <button key={d} className={`goal-btn${pf.days_per_week === d ? ' on' : ''}`} onClick={() => upPf('days_per_week', d)} style={{ flex: 1 }}>
                  {d}{d === 5 ? '+' : ''} days
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Injuries or limitations (optional)</label>
            <textarea value={pf.injuries_notes} onChange={e => upPf('injuries_notes', e.target.value)}
              placeholder="e.g. right knee pain, avoid heavy squats" rows={3}
              style={{ width: '100%', resize: 'none', boxSizing: 'border-box' }} />
          </div>
        </div>

        <button className="btn-full" onClick={handleSaveProfile} disabled={savingPf} style={{ marginBottom: 8 }}>
          {savingPf ? 'Saving…' : stage === 'editProfile' ? 'Save profile' : 'Save & continue'}
        </button>
        {stage === 'editProfile' && (
          <button className="btn-ghost" onClick={() => setStage('plan')}>Cancel</button>
        )}
        <div style={{ height: 16 }} />
      </div>
    )
  }

  // ── Plan view ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Summary card */}
      {planData ? (
        <div className="card" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: planData.week_summary ? 10 : 0 }}>
            <div style={{ flex: 1 }}>
              {planData.week_summary && (
                <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.6 }}>{planData.week_summary}</p>
              )}
            </div>
            <div style={{ textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 36, fontWeight: 700, color: doneDays > 0 ? 'var(--sage)' : 'var(--muted2)', lineHeight: 1 }}>
                {doneDays}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>of {activeDays} done</div>
            </div>
          </div>
          {planData.progression_notes && (
            <div style={{ fontSize: 11, color: 'var(--muted)', borderTop: '1px solid var(--border)', paddingTop: 8, lineHeight: 1.5 }}>
              📈 {planData.progression_notes}
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '32px 20px', marginBottom: 16 }}>
          <div style={{ fontFamily: "'Fraunces',Georgia,serif", fontSize: 24, color: 'var(--plum)', marginBottom: 8 }}>No plan yet</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
            Generate your personalized weekly training plan based on your goals, equipment, and schedule.
          </div>
          <button className="btn-full" onClick={() => generate()} disabled={generating}>
            {generating ? 'Generating…' : '✦ Generate my plan'}
          </button>
        </div>
      )}

      {/* Day cards */}
      {planData && DAYS.map(day => {
        const d = dayMap[day]
        const isRest = !d || !d.exercises?.length
        const done = !!logs[day]?.completed
        const isOpen = expanded.has(day)

        return (
          <div key={day} className="card" style={{ marginBottom: 10, padding: 0, overflow: 'hidden', opacity: isRest ? 0.65 : 1 }}>
            {/* Day header row */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: isRest ? 'default' : 'pointer', borderBottom: isOpen ? '1px solid var(--border)' : 'none' }}
              onClick={() => !isRest && toggleDay(day)}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: done ? '#6B8F6B22' : isRest ? 'var(--warm)' : 'var(--plumLL)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {done
                  ? <span style={{ fontSize: 20, color: 'var(--sage)' }}>✓</span>
                  : <div style={{ fontSize: 10, fontWeight: 700, color: isRest ? 'var(--muted)' : 'var(--plum2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{DAY_SHORT[day]}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: done ? 'var(--sage)' : 'var(--text)', textDecoration: done ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {d?.focus || 'Rest / Recovery'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                  {DAY_LABEL[day]}{d?.estimated_duration_min ? ` · ${d.estimated_duration_min} min` : ''}
                </div>
              </div>
              {!isRest && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); toggleDone(day) }}
                    style={{ background: done ? '#6B8F6B22' : 'var(--plumLL)', border: `1.5px solid ${done ? 'var(--sage)' : 'var(--plum3)'}`, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: done ? 'var(--sage)' : 'var(--plum2)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {done ? '✓ Done' : 'Mark done'}
                  </button>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              )}
            </div>

            {/* Expanded detail */}
            {isOpen && d && (
              <div style={{ padding: '14px 16px' }}>
                {d.warmup && (
                  <div style={{ marginBottom: 14, padding: '10px 12px', background: 'var(--warm)', borderRadius: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Warmup</div>
                    <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{d.warmup}</div>
                  </div>
                )}

                {(d.exercises || []).map((ex, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: i < d.exercises.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--plumLL)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--plum2)' }}>{i + 1}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{ex.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--plum2)', marginTop: 2, fontWeight: 500 }}>
                        {ex.sets} × {ex.reps}
                        {ex.rest_seconds > 0 && <span style={{ color: 'var(--muted)', fontWeight: 400 }}> · {ex.rest_seconds}s rest</span>}
                      </div>
                      {ex.notes && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3, lineHeight: 1.5 }}>{ex.notes}</div>}
                    </div>
                  </div>
                ))}

                {d.cooldown && (
                  <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--warm)', borderRadius: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Cooldown</div>
                    <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>{d.cooldown}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Actions */}
      {planData && (
        <>
          {showAdjust ? (
            <div className="card" style={{ marginBottom: 10 }}>
              <div className="card-title">Adjust this week</div>
              <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.5 }}>
                Describe what you want changed — the AI will update your plan while keeping the rest intact.
              </p>
              <textarea
                value={adjustNote} onChange={e => setAdjustNote(e.target.value)}
                placeholder="e.g. swap squats, my knee is sore — or make Thursday harder"
                rows={3} style={{ width: '100%', resize: 'none', boxSizing: 'border-box', marginBottom: 10 }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-full" onClick={handleAdjust} disabled={adjusting || !adjustNote.trim()}>
                  {adjusting ? 'Adjusting…' : '✦ Apply adjustment'}
                </button>
                <button className="btn-sm" onClick={() => setShowAdjust(false)} style={{ whiteSpace: 'nowrap' }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn-ghost" onClick={() => setShowAdjust(true)} style={{ marginBottom: 8 }}>
              ✏️ Adjust this week
            </button>
          )}
          <button className="btn-ghost" onClick={() => generate()} disabled={generating} style={{ marginBottom: 8 }}>
            {generating ? 'Generating…' : '↻ Regenerate plan'}
          </button>
        </>
      )}

      <button className="btn-ghost" onClick={() => { setPf(profile || mkDefault(goals)); setStage('editProfile') }} style={{ marginBottom: 16 }}>
        ⚙ Edit workout profile
      </button>

      <div style={{ height: 8 }} />
    </div>
  )
}
