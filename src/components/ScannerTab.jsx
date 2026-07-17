import { useState, useEffect, useRef, useCallback } from 'react'
import { lookupBarcode, FD } from '../lib/barcode.js'
import { CAT_ICON, I } from './Icons.jsx'
import { insertFoodLog } from '../lib/foodLog.js'

const MEALS = ['breakfast','lunch','dinner','snack']
const MEAL_LABEL = { breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner', snack:'Snack' }
function defaultMeal() {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 18) return 'snack'
  return 'dinner'
}

export default function ScannerTab({ pantry, setPantry, savePantryItem, deletePantryItem, updatePantryQty, notify, onBack, session }) {
  const [mode, setMode] = useState('add')
  const [scanning, setScanning] = useState(false)
  const [code, setCode] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [qty, setQty] = useState(1)
  const [unit, setUnit] = useState('item')
  const [expiry, setExpiry] = useState('')
  const [manual, setManual] = useState(false)
  const [mf, setMf] = useState({ name: '', brand: '', calories: '', protein: '', carbs: '', fat: '', category: 'Other' })
  const [camErr, setCamErr] = useState('')
  const [scanStatus, setScanStatus] = useState('Point camera at a barcode')
  // Food log sheet
  const [logSheet, setLogSheet] = useState(false)
  const [logMeal, setLogMeal] = useState(defaultMeal)
  const [logQty, setLogQty] = useState('1')
  const [logUnit, setLogUnit] = useState('serving')
  const [loggingFood, setLoggingFood] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const rafRef = useRef(null)
  const scanningRef = useRef(false)

  const stopCamera = useCallback(() => {
    scanningRef.current = false
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null }
    setScanning(false)
  }, [])

  const startCamera = useCallback(async () => {
    setCamErr(''); setScanStatus('Opening camera...'); setScanning(true); scanningRef.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } })
      streamRef.current = stream
      const vid = videoRef.current
      vid.srcObject = stream; vid.setAttribute('playsinline', ''); vid.muted = true
      await vid.play()
      setScanStatus('Point camera at a barcode')
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      let frameN = 0
      const tick = async () => {
        if (!scanningRef.current) return
        frameN++
        if (frameN % 10 === 0 && vid.readyState >= 2 && vid.videoWidth > 0) {
          canvas.width = vid.videoWidth; canvas.height = vid.videoHeight; ctx.drawImage(vid, 0, 0)
          try {
            const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.8))
            if (blob) {
              const { readBarcodes } = await import('zxing-wasm/reader')
              const results = await readBarcodes(blob, { formats: ['EAN-13','EAN-8','UPC-A','UPC-E','Code128','Code39','QRCode'], tryHarder: true })
              if (results?.length > 0 && results[0].text) { const txt = results[0].text; stopCamera(); setCode(txt); doLookup(txt); return }
            }
          } catch {}
        }
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      setScanning(false); scanningRef.current = false
      if (err.name === 'NotAllowedError') setCamErr('Camera permission denied. In Safari: Settings > Safari > Camera > Allow.')
      else if (err.name === 'NotFoundError') setCamErr('No camera found on this device.')
      else setCamErr('Camera error: ' + err.message)
    }
  }, [])

  useEffect(() => () => stopCamera(), [])

  const doLookup = async c => {
    if (!c.trim()) return
    setLoading(true); setResult(null)
    setResult(await lookupBarcode(c.trim()))
    setLoading(false)
  }

  const confirm = () => {
    const item = manual ? { name: mf.name, brand: mf.brand, calories: +mf.calories, protein: +mf.protein, carbs: +mf.carbs, fat: +mf.fat, category: mf.category, perishable: !!expiry, price: 0 } : result
    if (!item) return
    if (mode === 'add') {
      const ex = pantry.find(p => p.name === item.name)
      if (ex) { setPantry(p => p.map(i => i.id === ex.id ? { ...i, qty: i.qty + qty } : i)); notify('Updated: ' + item.name) }
      else { setPantry(p => [...p, { id: Date.now() + '', ...item, qty, unit, added: Date.now(), expiry: expiry ? new Date(expiry).getTime() : null, by: 'Me' }]); notify('Added: ' + item.name) }
    } else {
      const ex = pantry.find(p => p.name === item.name)
      if (!ex) { notify('Not in pantry', 'err'); return }
      setPantry(p => p.map(i => i.id === ex.id ? { ...i, qty: Math.max(0, i.qty - qty) } : i).filter(i => i.qty > 0))
      notify('Used: ' + item.name)
    }
    setResult(null); setCode(''); setExpiry(''); setQty(1)
  }

  const openLogSheet = () => {
    setLogMeal(defaultMeal()); setLogQty('1'); setLogUnit('serving'); setLogSheet(true)
  }

  const confirmLog = async () => {
    if (!result || !session) return
    setLoggingFood(true)
    try {
      const q = parseFloat(logQty) || 1
      await insertFoodLog(session.user.id, {
        log_date:     new Date().toISOString().split('T')[0],
        meal:         logMeal,
        source:       'barcode',
        barcode:      code || null,
        name:         result.name,
        serving_qty:  q,
        serving_unit: logUnit,
        calories:     result.calories,
        protein_g:    result.protein,
        carbs_g:      result.carbs,
        fat_g:        result.fat,
      })
      notify('Logged: ' + result.name)
      setLogSheet(false)
    } catch { notify('Log failed', 'err') }
    setLoggingFood(false)
  }

  return (
    <div className="page">
      <button className="btn-sm" onClick={onBack} style={{ marginBottom: 14, background: 'none', border: '1px solid var(--border)', color: 'var(--muted)' }}>← Back to pantry</button>
      <div className="page-label">Scanner</div>
      <h1 className="page-title">Add or use items</h1>
      <div className="seg">
        <button className={`seg-btn${mode === 'add' ? ' on' : ''}`} onClick={() => setMode('add')}>+ Add to pantry</button>
        <button className={`seg-btn red${mode === 'use' ? ' on' : ''}`} onClick={() => setMode('use')}>- Mark as used</button>
      </div>
      <div className="vf">
        {scanning ? (<>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted autoPlay />
          <div className="vf-overlay">
            <div className="vf-frame">
              <div className="vf-corner" style={{ top: 0, left: 0, borderWidth: '2.5px 0 0 2.5px' }} />
              <div className="vf-corner" style={{ top: 0, right: 0, borderWidth: '2.5px 2.5px 0 0' }} />
              <div className="vf-corner" style={{ bottom: 0, left: 0, borderWidth: '0 0 2.5px 2.5px' }} />
              <div className="vf-corner" style={{ bottom: 0, right: 0, borderWidth: '0 2.5px 2.5px 0' }} />
              <div className="vf-scan" />
            </div>
            <div className="vf-hint">{scanStatus}</div>
          </div>
          <button className="vf-stop" onClick={stopCamera}>✕ Stop</button>
        </>) : (
          <div className="vf-placeholder">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#9B8EC466" strokeWidth="1.5" strokeLinecap="round"><path d="M3 8V5a2 2 0 012-2h2M19 3h2a2 2 0 012 2v3M21 16v3a2 2 0 01-2 2h-3M8 21H5a2 2 0 01-2-2v-3"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>
            <button className="btn-full" style={{ width: 'auto', padding: '13px 28px', fontSize: 15 }} onClick={startCamera}>Tap to scan barcode</button>
            {camErr && <p style={{ fontSize: 12, color: 'var(--orange)', marginTop: 8, textAlign: 'center', padding: '0 16px' }}>{camErr}</p>}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <input style={{ flex: 1, fontFamily: 'monospace' }} placeholder="Or type barcode number..." value={code} onChange={e => setCode(e.target.value)} onKeyDown={e => e.key === 'Enter' && doLookup(code)} />
        <button className="btn-sm" style={{ padding: '0 18px', height: 46, display: 'flex', alignItems: 'center', gap: 6, borderRadius: 12 }} onClick={() => doLookup(code)} disabled={loading}>
          {loading ? <span className="spin" style={{ width: 12, height: 12, borderTopColor: '#C9BEEA', borderColor: '#9B8EC4' }} /> : 'Look up'}
        </button>
      </div>
      <p className="section-label" style={{ marginBottom: 8 }}>Sample items to test</p>
      <div className="chips" style={{ marginBottom: 20 }}>
        {Object.entries(FD).slice(0, 7).map(([bc, f]) => (
          <button key={bc} className="chip" onClick={() => { setCode(bc); doLookup(bc) }}>{f.name.split(' ').slice(0, 2).join(' ')}</button>
        ))}
      </div>
      {result && (
        <div className="result-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div className="result-icon">{(CAT_ICON[result.category] || I.other)()}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 16, color: 'var(--text)', marginBottom: 2 }}>{result.name}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>{result.brand}{result.price > 0 && <span style={{ marginLeft: 8, color: 'var(--sage)', fontWeight: 500 }}>${result.price.toFixed(2)}</span>}</div>
            </div>
          </div>
          <div className="macro-grid">
            {[['Cal', result.calories, ''], ['Protein', result.protein, 'g'], ['Carbs', result.carbs, 'g'], ['Fat', result.fat, 'g']].map(([k, v, u]) => (
              <div key={k} className="macro-box"><div className="macro-val">{v}{u}</div><div className="macro-lbl">{k}</div></div>
            ))}
          </div>
          <div className="qty-row">
            <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>-</button>
            <span className="qty-num">{qty}</span>
            <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            <input style={{ flex: 1 }} value={unit} onChange={e => setUnit(e.target.value)} placeholder="unit" />
          </div>
          {mode === 'add' && <div style={{ marginBottom: 12 }}><label className="input-label">Expiry date (optional)</label><input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} /></div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn-full${mode === 'use' ? ' red' : ''}`} onClick={confirm} style={{ flex: 1 }}>
              {mode === 'add' ? 'Add to pantry' : 'Mark as used'}
            </button>
            {session && (
              <button className="btn-sm" onClick={openLogSheet} style={{ whiteSpace: 'nowrap', padding: '0 16px', borderRadius: 14, fontSize: 14 }}>
                Log food
              </button>
            )}
          </div>
          {logSheet && (
            <div style={{ marginTop: 14, background: 'var(--warm)', border: '1.5px solid var(--plum3)', borderRadius: 16, padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--plum)', marginBottom: 10 }}>Log to food diary</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <label className="input-label">Servings</label>
                  <input type="number" value={logQty} onChange={e => setLogQty(e.target.value)} min="0.25" step="0.25" />
                </div>
                <div style={{ flex: 2 }}>
                  <label className="input-label">Unit</label>
                  <input value={logUnit} onChange={e => setLogUnit(e.target.value)} placeholder="serving, cup, oz…" />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="input-label">Meal</label>
                <div className="seg" style={{ marginBottom: 0 }}>
                  {MEALS.map(m => (
                    <button key={m} className={`seg-btn${logMeal === m ? ' on' : ''}`} onClick={() => setLogMeal(m)} style={{ fontSize: 11 }}>
                      {MEAL_LABEL[m]}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12 }}>
                {Math.round(result.calories * (parseFloat(logQty)||1))} cal · P {Math.round(result.protein * (parseFloat(logQty)||1))}g · C {Math.round(result.carbs * (parseFloat(logQty)||1))}g · F {Math.round(result.fat * (parseFloat(logQty)||1))}g
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-full" onClick={confirmLog} disabled={loggingFood}>{loggingFood ? 'Logging…' : 'Log it'}</button>
                <button className="btn-sm" onClick={() => setLogSheet(false)} style={{ padding: '0 16px' }}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
      <button className="btn-ghost" onClick={() => setManual(!manual)}>{manual ? 'Hide manual entry' : 'Add item manually'}</button>
      {manual && (
        <div className="manual-form">
          <div><label className="input-label">Item name *</label><input value={mf.name} onChange={e => setMf(m => ({ ...m, name: e.target.value }))} /></div>
          <div><label className="input-label">Brand</label><input value={mf.brand} onChange={e => setMf(m => ({ ...m, brand: e.target.value }))} /></div>
          <div className="form-row">
            <div><label className="input-label">Calories</label><input type="number" value={mf.calories} onChange={e => setMf(m => ({ ...m, calories: e.target.value }))} /></div>
            <div><label className="input-label">Protein (g)</label><input type="number" value={mf.protein} onChange={e => setMf(m => ({ ...m, protein: e.target.value }))} /></div>
          </div>
          <div className="form-row">
            <div><label className="input-label">Carbs (g)</label><input type="number" value={mf.carbs} onChange={e => setMf(m => ({ ...m, carbs: e.target.value }))} /></div>
            <div><label className="input-label">Fat (g)</label><input type="number" value={mf.fat} onChange={e => setMf(m => ({ ...m, fat: e.target.value }))} /></div>
          </div>
          <div><label className="input-label">Category</label>
            <select value={mf.category} onChange={e => setMf(m => ({ ...m, category: e.target.value }))}>
              {Object.keys(CAT_ICON).map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div><label className="input-label">Expiry date</label><input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} /></div>
          <button className="btn-full" onClick={confirm} disabled={!mf.name}>Add to pantry</button>
        </div>
      )}
    </div>
  )
}
