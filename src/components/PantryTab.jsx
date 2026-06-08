import { useState } from 'react'
import { du, uc } from '../constants.js'
import { CAT_ICON, I } from './Icons.jsx'
import EmptyState from './EmptyState.jsx'

export default function PantryTab({ pantry, setPantry, deletePantryItem, updatePantryQty, notify, setTab }) {
  const [search, setSearch] = useState('')
  const [cat, setCat] = useState('all')
  const [sort, setSort] = useState('expiry')
  const cats = ['all', ...new Set(pantry.map(i => i.category))]
  const filtered = pantry
    .filter(i => cat === 'all' || i.category === cat)
    .filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'expiry' ? (du(a.expiry) ?? 999) - (du(b.expiry) ?? 999) : sort === 'name' ? a.name.localeCompare(b.name) : b.added - a.added)
  const urgent = pantry.filter(i => { const d = du(i.expiry); return d !== null && d <= 3 })

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="page-label">Inventory</div>
          <h1 className="page-title">Your pantry</h1>
        </div>
        <button className="btn-sm" onClick={() => setTab && setTab('scan')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', marginTop: 4 }}>
          <span style={{ width: 15, height: 15, display: 'inline-block' }}>{I.scan('#6b2fa0')}</span> Scan
        </button>
      </div>
      <div className="stat-row">
        <div className="stat-pill"><span style={{ fontWeight: 500, color: 'var(--plum2)' }}>{pantry.length}</span> items</div>
        <div className="stat-pill"><span style={{ fontWeight: 500, color: 'var(--orange)' }}>{urgent.length}</span> expiring soon</div>
      </div>
      {urgent.length > 0 && <div className="alert">Use these soon: {urgent.map(i => i.name).join(', ')}</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: '0 12px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted2)" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input style={{ flex: 1, background: 'none', border: 'none', padding: '11px 0', fontSize: 14, outline: 'none' }} placeholder="Search pantry..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ width: 'auto' }} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="expiry">Expiry</option>
          <option value="name">Name</option>
          <option value="added">Added</option>
        </select>
      </div>
      <div className="chips">{cats.map(c => <button key={c} className={`chip${cat === c ? ' on' : ''}`} onClick={() => setCat(c)}>{c === 'all' ? 'All items' : c}</button>)}</div>
      {filtered.map(item => {
        const days = du(item.expiry), color = uc(days)
        return (
          <div key={item.id} className="prow" style={{ borderLeftColor: color || 'var(--border)' }}>
            <div className="prow-icon">{(CAT_ICON[item.category] || I.other)()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="prow-name">{item.name}</div>
              <div className="prow-meta">
                <span>{item.brand}</span>
                {days !== null && <span style={{ color, fontWeight: 500 }}>{days <= 0 ? 'Expired' : `${days}d left`}</span>}
                {item.price > 0 && <span style={{ color: 'var(--sage)' }}>${item.price.toFixed(2)}</span>}
              </div>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {[`${item.calories} cal`, `P ${item.protein}g`, `C ${item.carbs}g`, `F ${item.fat}g`].map(t => <span key={t} className="macro-pill">{t}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <div className="qty-tag">{item.qty} {item.unit}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn-use" onClick={() => { const nq = Math.max(0, item.qty - 1); if (nq === 0) { setPantry(p => p.filter(i => i.id !== item.id)); if (deletePantryItem) deletePantryItem(item.id) } else { setPantry(p => p.map(i => i.id === item.id ? { ...i, qty: nq } : i)); if (updatePantryQty) updatePantryQty(item.id, nq) } notify('Used') }}>Use</button>
                <button className="btn-del" onClick={() => { setPantry(p => p.filter(i => i.id !== item.id)); if (deletePantryItem) deletePantryItem(item.id); notify('Removed') }}>✕</button>
              </div>
            </div>
          </div>
        )
      })}
      {filtered.length === 0 && (
        pantry.length === 0
          ? <EmptyState emoji="🧺" title="Your pantry's empty" sub="Scan a barcode or add items to start tracking what's in your kitchen — your meal plans build around it." cta="Scan an item" onCta={() => setTab && setTab('scan')} />
          : <EmptyState emoji="🔍" title="Nothing here" sub="No items match your search or filter. Try a different category." />
      )}
    </div>
  )
}
