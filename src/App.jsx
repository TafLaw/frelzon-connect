import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import {
  INVENTORY, BASE_PRICES, RESELLERS, ALL_STATUSES, SERIES_ORDER,
  getResellerPrice, formatPrice, statusLabel, groupBy,
  loadPersistedData, persistData, seriesChipsFromInventory,
} from './data'
import { isApiMode } from './config'
import {
  fetchInventoryList, fetchPricesPublic, fetchResellersPublic, createFrelzonOrder,
} from './api'
import Admin from './pages/Admin'
import ConnectLogo from './components/ConnectLogo'
import phonesLineup from './assets/phones-lineup.png'
import iconTiktok from './assets/icons/tiktok.png'
import iconCheckMark from './assets/icons/check-mark.png'

// ─── SMALL LOGO (modal + footer) ─────────────────────────────────────────────

function Logo({ size = 28 }) {
  return (
    <svg width={size * 1.1} height={size} viewBox="0 0 44 40" fill="none">
      <path d="M22 4C13.16 4 6 11.16 6 20s7.16 16 16 16c3.5 0 6.76-1.12 9.4-3.02"
        stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <circle cx="19" cy="20" r="4" fill="var(--blue)" />
      <rect x="19" y="17.5" width="16" height="5" rx="2.5" fill="var(--blue)" />
    </svg>
  )
}

// ─── PHONE ICON ───────────────────────────────────────────────────────────────

function PhoneIcon({ model }) {
  const isPro = model.includes('Pro')
  return (
    <svg viewBox="0 0 80 140" width="60" height="105" fill="none">
      <rect x="8" y="2" width="64" height="136" rx="14"
        fill="var(--bg3)" stroke="var(--border)" strokeWidth="1.5" />
      <rect x="14" y="10" width="52" height="112" rx="8" fill="var(--bg)" />
      {isPro
        ? <rect x="25" y="6" width="30" height="8" rx="4" fill="var(--bg3)" />
        : <rect x="28" y="6" width="24" height="7" rx="3.5" fill="var(--bg3)" />}
      {isPro ? (
        <>
          <circle cx="30" cy="30" r="6" fill="var(--bg3)" stroke="var(--border)" strokeWidth="1" />
          <circle cx="44" cy="30" r="6" fill="var(--bg3)" stroke="var(--border)" strokeWidth="1" />
          <circle cx="37" cy="42" r="6" fill="var(--bg3)" stroke="var(--border)" strokeWidth="1" />
          <circle cx="30" cy="30" r="2.5" fill="var(--text3)" />
          <circle cx="44" cy="30" r="2.5" fill="var(--text3)" />
          <circle cx="37" cy="42" r="2.5" fill="var(--text3)" />
        </>
      ) : (
        <>
          <circle cx="33" cy="28" r="6" fill="var(--bg3)" stroke="var(--border)" strokeWidth="1" />
          <circle cx="47" cy="28" r="6" fill="var(--bg3)" stroke="var(--border)" strokeWidth="1" />
          <circle cx="33" cy="28" r="2.5" fill="var(--text3)" />
          <circle cx="47" cy="28" r="2.5" fill="var(--text3)" />
        </>
      )}
      <rect x="30" y="124" width="20" height="5" rx="2.5" fill="var(--border)" />
    </svg>
  )
}

// ─── STATUS DOT ───────────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const color = status === 'in-stock' ? 'var(--green)'
    : status === 'low-stock' ? 'var(--amber)'
    : 'var(--red)'
  return (
    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color,
      display: 'inline-block', flexShrink: 0 }} />
  )
}

// ─── STATUS TAG ───────────────────────────────────────────────────────────────

function StatusTag({ status }) {
  const styles = {
    'in-stock':  { background: 'var(--green-dim)', color: 'var(--green)' },
    'low-stock': { background: 'var(--amber-dim)', color: 'var(--amber)' },
    'sold-out':  { background: 'var(--red-dim)',   color: 'var(--red)'   },
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      letterSpacing: '0.03em', textTransform: 'uppercase',
      ...styles[status],
    }}>
      <StatusDot status={status} />
      {statusLabel(status)}
    </span>
  )
}

// ─── CLOSE BUTTON ─────────────────────────────────────────────────────────────

function CloseBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{
      background: 'var(--bg3)', border: '1px solid var(--border)',
      borderRadius: 8, width: 32, height: 32, cursor: 'pointer',
      color: 'var(--text2)', fontSize: 16, display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>✕</button>
  )
}

// ─── RESELLER PICKER ──────────────────────────────────────────────────────────

function ResellerPicker({ item, selected, onSelect, resellers, basePrices }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8,
      maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
      {resellers.map(r => {
        const price = getResellerPrice(r, item.model, item.storage, basePrices)
        const isSelected = selected?.id === r.id
        return (
          <div key={r.id} onClick={() => onSelect(r)} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 10, cursor: 'pointer',
            border: isSelected ? '1.5px solid var(--purple)' : '1px solid var(--border)',
            background: isSelected ? 'var(--purple-dim)' : 'var(--bg3)',
            transition: 'all 0.12s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                border: isSelected ? '5px solid var(--purple)' : '2px solid var(--border)',
                transition: 'all 0.12s',
              }} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{r.name}</span>
                  {r.badge && (
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                      background: 'var(--green-dim)', color: 'var(--green)',
                      padding: '2px 6px', borderRadius: 4 }}>
                      {r.badge}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{r.subtitle}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {price ? (
                <>
                  <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'DM Mono, monospace',
                    color: isSelected ? 'var(--purple-light)' : 'var(--text)' }}>
                    {formatPrice(price)}
                  </div>
                  {r.id === 'direct' && (
                    <div style={{ fontSize: 10, color: 'var(--green)' }}>Free delivery</div>
                  )}
                </>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>Contact for price</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function normalizeResellerToken(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/%20/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Path slugs like `smartphonesjhb` — letters/digits only, no spaces or hyphens. */
function normalizeResellerCompactSlug(value) {
  try {
    return decodeURIComponent(String(value || ''))
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  } catch {
    return String(value || '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  }
}

function getPreferredResellerFromUrl(resellers) {
  if (!Array.isArray(resellers) || resellers.length === 0 || typeof window === 'undefined') return null

  const segments = [
    ...window.location.pathname.split('/'),
    ...window.location.hash.replace(/^#/, '').split('/'),
  ]
    .map((s) => s.trim())
    .filter(Boolean)

  if (segments.length === 0) return null

  const pathCompacts = new Set(segments.map(normalizeResellerCompactSlug).filter(Boolean))
  const pathHyphenTokens = new Set(segments.map(normalizeResellerToken).filter(Boolean))

  return resellers.find((r) => {
    const hyphenTokens = [
      r.id,
      r.name,
      r.subtitle,
      r.location,
      `${r.name}-${r.location}`,
      `${r.name}-${r.subtitle}`,
    ]
      .map(normalizeResellerToken)
      .filter(Boolean)

    const compactTokens = [
      r.id,
      r.name,
      r.subtitle,
      r.location,
      `${r.name}${r.location}`,
      `${r.name}${r.subtitle}`,
    ]
      .map(normalizeResellerCompactSlug)
      .filter(Boolean)

    if (compactTokens.some((t) => pathCompacts.has(t))) return true
    if (hyphenTokens.some((t) => pathHyphenTokens.has(t))) return true
    return false
  }) ?? null
}

// ─── PRE-ORDER / RESERVE MODAL ────────────────────────────────────────────────

function PreOrderModal({ item, onClose, resellers, basePrices, useApi, onOrdered }) {
  const preferredReseller = useMemo(() => getPreferredResellerFromUrl(resellers), [resellers])
  const resellersShown = useMemo(
    () => (preferredReseller ? [preferredReseller] : resellers),
    [preferredReseller, resellers],
  )
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    reseller: preferredReseller ?? resellers[0] ?? null,
    qty: '1',
    notes: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    setForm((f) => ({
      ...f,
      reseller: resellers.find((r) => r.id === f.reseller?.id) ?? preferredReseller ?? resellers[0] ?? f.reseller,
    }))
  }, [resellers, preferredReseller])

  const isSoldOut = item.status === 'sold-out'
  const maxReserveQty = useMemo(() => {
    if (isSoldOut) return null
    return Math.max(1, Math.floor(Number(item.qty)) || 1)
  }, [isSoldOut, item.qty])

  const qtyOptions = useMemo(() => {
    if (isSoldOut) return [1, 2, 3, 4, 5, 10]
    const m = maxReserveQty ?? 1
    return Array.from({ length: m }, (_, i) => i + 1)
  }, [isSoldOut, maxReserveQty])

  useEffect(() => {
    const cur = parseInt(form.qty, 10) || 1
    if (!qtyOptions.includes(cur)) {
      setForm((f) => ({ ...f, qty: String(qtyOptions[qtyOptions.length - 1] ?? 1) }))
    }
  }, [item.id, qtyOptions])

  const selectedPrice = form.reseller
    ? getResellerPrice(form.reseller, item.model, item.storage, basePrices)
    : null

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitError('')
    if (useApi && !form.reseller?.id) {
      setSubmitError('Please select a reseller.')
      return
    }
    const qty = Math.max(1, parseInt(form.qty, 10) || 1)
    if (!isSoldOut && maxReserveQty != null && qty > maxReserveQty) {
      setSubmitError(`Only ${maxReserveQty} unit${maxReserveQty !== 1 ? 's' : ''} available for this variant.`)
      return
    }
    setLoading(true)
    try {
      if (useApi) {
        await createFrelzonOrder({
          inventory_id: item.id,
          reseller_id: form.reseller.id,
          customer_name: form.name.trim(),
          customer_email: form.email.trim(),
          customer_phone: form.phone.trim(),
          qty,
          ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
        })
        onOrdered?.()
      }
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err?.message || 'Could not place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
        <div style={{ ...modalStyle(), textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%',
            background: 'var(--green-dim)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px', fontSize: 26, color: 'var(--green)' }}>
            ✓
          </div>
          <h3 style={{ marginBottom: 8 }}>
            {isSoldOut ? 'Pre-order Confirmed!' : 'Reservation Confirmed!'}
          </h3>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 8 }}>
            {item.model} · {item.storage}
          </p>
          {selectedPrice && (
            <p style={{ fontWeight: 700, fontSize: 20, fontFamily: 'DM Mono, monospace',
              color: 'var(--purple-light)', marginBottom: 8 }}>
              {formatPrice(selectedPrice)}
            </p>
          )}
          <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
            {isSoldOut
              ? `We'll contact you at ${form.email} when your unit is ready. Expected restock: ${item.restockIn || 'TBD'}.`
              : `Your unit has been reserved. We'll contact you at ${form.email} to arrange payment and delivery.`}
          </p>
          <p style={{ background: 'var(--purple-dim)', border: '1px solid var(--purple-border)',
            borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--purple-light)',
            marginBottom: 24 }}>
            {form.reseller.id === 'direct'
              ? 'Fulfilled directly by Frelzon Connect · Free delivery.'
              : `Fulfilled via ${form.reseller.name} · ${form.reseller.subtitle}.`}
          </p>
          <Btn primary full onClick={onClose}>Done</Btn>
        </div>
      </div>
    )
  }

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle(560)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h3 style={{ marginBottom: 4 }}>{isSoldOut ? 'Pre-order' : 'Reserve Now'}</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--text2)' }}>
                {item.model} · {item.storage}
              </span>
              <StatusTag status={item.status} />
            </div>
            {isSoldOut && item.restockIn && (
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                Expected restock: {item.restockIn}
              </p>
            )}
          </div>
          <CloseBtn onClick={onClose} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Full Name *">
              <input value={form.name} placeholder="John Smith" required
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Field>
            <Field label="Phone Number *">
              <input value={form.phone} placeholder="+27 82 000 0000" required
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </Field>
          </div>
          <Field label="Email Address *">
            <input type="email" value={form.email} placeholder="you@example.com" required
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label={isSoldOut ? 'Quantity' : `Quantity (max ${maxReserveQty})`}>
            <select value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}>
              {qtyOptions.map(n => (
                <option key={n} value={n}>{n} unit{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </Field>
          <Field label={preferredReseller ? 'Buying from *' : 'Where would you like to buy? *'}>
            <ResellerPicker item={item} selected={form.reseller}
              onSelect={r => setForm(f => ({ ...f, reseller: r }))}
              resellers={resellersShown} basePrices={basePrices} />
          </Field>
          <Field label="Notes (optional)">
            <input value={form.notes} placeholder="Preferred colour, delivery instructions…"
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </Field>

          {selectedPrice && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                Total ({form.qty} unit{parseInt(form.qty) > 1 ? 's' : ''})
              </span>
              <span style={{ fontWeight: 700, fontSize: 18, fontFamily: 'DM Mono, monospace',
                color: 'var(--text)' }}>
                {formatPrice(selectedPrice * parseInt(form.qty))}
              </span>
            </div>
          )}

          {submitError && (
            <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12, lineHeight: 1.4 }}>
              {submitError}
            </p>
          )}
          <Btn primary full type="submit" disabled={loading}>
            {loading ? 'Submitting…' : isSoldOut ? 'Confirm Pre-order' : 'Confirm Reservation'}
          </Btn>
        </form>
      </div>
    </div>
  )
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────

function ProductCard({ item, onReserve }) {
  const [hovered, setHovered] = useState(false)
  const isSoldOut = item.status === 'sold-out'
  const isLow = item.status === 'low-stock'
  const img = item.imageUrl

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--bg2)',
        border: `1px solid ${hovered ? 'var(--purple-border)' : 'var(--border)'}`,
        borderRadius: 14, padding: 20,
        display: 'flex', flexDirection: 'column', gap: 12,
        transition: 'border-color 0.15s, transform 0.15s',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ opacity: isSoldOut ? 0.5 : 1, width: 60, height: 105, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {img ? (
            <img src={img} alt="" style={{ maxHeight: '94%', objectFit: 'contain' }} />
          ) : (
            <PhoneIcon model={item.model} />
          )}
        </div>
        <StatusTag status={item.status} />
      </div>

      <div>
        <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{item.model}</p>
        <p style={{ fontSize: 13, color: 'var(--text2)', fontFamily: 'DM Mono, monospace' }}>
          {item.storage}
        </p>
      </div>

      <div style={{ marginTop: 'auto' }}>
        {isSoldOut && item.restockIn && (
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
            🕐 Restock {item.restockIn}
          </p>
        )}
        {isLow && (
          <p style={{ fontSize: 12, color: 'var(--amber)', marginBottom: 10 }}>
            Only {item.qty} left
          </p>
        )}
        {!isSoldOut && !isLow && (
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 10 }}>
            {item.qty} units available
          </p>
        )}
        <button onClick={() => onReserve(item)} style={{
          width: '100%', padding: '10px 0', borderRadius: 8,
          border: isSoldOut ? '1px solid var(--border)' : 'none',
          cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14,
          background: isSoldOut ? 'transparent'
            : isLow ? 'var(--amber)'
            : 'var(--purple)',
          color: isLow ? '#000' : isSoldOut ? 'var(--text2)' : '#fff',
          transition: 'all 0.15s',
        }}>
          {isSoldOut ? 'Pre-order' : isLow ? 'Reserve — Limited' : 'Reserve'}
        </button>
      </div>
    </div>
  )
}

// ─── STATUS FILTER (custom menu — native <select> mispositions on iOS/WebKit) ───

function StatusFilterDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function closeIfOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', closeIfOutside)
    document.addEventListener('touchstart', closeIfOutside, { passive: true })
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', closeIfOutside)
      document.removeEventListener('touchstart', closeIfOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className="status-filter-dropdown"
      style={{
        position: 'relative',
        flexShrink: 0,
        alignSelf: 'center',
        zIndex: open ? 55 : undefined,
      }}
    >
      <button
        type="button"
        className="status-filter-trigger"
        id="status-filter-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="status-filter-listbox"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          minWidth: 132,
          padding: '10px 14px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg3)',
          color: 'var(--text)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          width: 'auto',
        }}
      >
        <span>{value}</span>
        <span aria-hidden style={{ fontSize: 9, opacity: 0.65, lineHeight: 1 }}>▼</span>
      </button>
      {open && (
        <ul
          id="status-filter-listbox"
          role="listbox"
          aria-labelledby="status-filter-trigger"
          className="status-filter-listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 'auto',
            minWidth: 'min(100vw - 32px, 220px)',
            margin: 0,
            padding: 6,
            listStyle: 'none',
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            boxShadow: '0 12px 40px oklch(0% 0 0 / 0.16)',
          }}
        >
          {options.map((opt) => (
            <li key={opt} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={opt === value}
                onClick={() => {
                  onChange(opt)
                  setOpen(false)
                }}
                className={
                  `status-filter-option${opt === value ? ' status-filter-option-active' : ''}`
                }
              >
                {opt}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── STATS BAR ────────────────────────────────────────────────────────────────

function Stats({ items }) {
  const inStock = items.filter(i => i.status === 'in-stock').length
  const low = items.filter(i => i.status === 'low-stock').length
  const soldOut = items.filter(i => i.status === 'sold-out').length
  const pills = [
    { label: 'In Stock',  val: inStock, color: 'var(--green)', bg: 'var(--green-dim)' },
    { label: 'Low Stock', val: low,     color: 'var(--amber)', bg: 'var(--amber-dim)' },
    { label: 'Sold Out',  val: soldOut, color: 'var(--red)',   bg: 'var(--red-dim)'   },
  ]
  return (
    <div className="hero-stats">
      {pills.map(({ label, val, color, bg }) => (
        <div key={label} className="hero-stat-pill" style={{
          background: bg,
          border: `1px solid ${color}22`,
          borderRadius: 10,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 20, fontWeight: 700, color, fontFamily: 'DM Mono, monospace' }}>
            {val}
          </span>
          <span style={{ fontSize: 12, color }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--text2)',
        marginBottom: 6, display: 'block' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Btn({ children, primary, full, onClick, disabled, type = 'button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: full ? '100%' : undefined,
      padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600,
      border: primary ? 'none' : '1px solid var(--border)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'DM Sans, sans-serif',
      background: primary ? 'var(--purple)' : 'transparent',
      color: primary ? '#fff' : 'var(--text2)',
      opacity: disabled ? 0.6 : 1,
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  )
}

const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'oklch(0% 0 0 / 0.7)',
  backdropFilter: 'blur(6px)',
  zIndex: 100,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 20,
  animation: 'fadeIn 0.15s ease',
}

function modalStyle(maxWidth = 480) {
  return {
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth,
    maxHeight: '90vh',
    overflowY: 'auto',
    animation: 'slideUp 0.2s ease',
  }
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const api = isApiMode()

  // ── Persistent data state (local / demo) ──
  const [inventory, setInventory] = useState(() => loadPersistedData()?.inventory ?? INVENTORY)
  const [basePrices, setBasePrices] = useState(() => loadPersistedData()?.basePrices ?? BASE_PRICES)
  const [resellers, setResellers] = useState(() => loadPersistedData()?.resellers ?? RESELLERS)

  const [catalogLoading, setCatalogLoading] = useState(api)
  const [catalogError, setCatalogError] = useState('')
  const [seriesScope, setSeriesScope] = useState([])
  const [searchDebounced, setSearchDebounced] = useState('')
  const [search, setSearch] = useState('')
  const [filterSeries, setFilterSeries] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  useEffect(() => {
    if (api) return
    persistData({ inventory, basePrices, resellers })
  }, [api, inventory, basePrices, resellers])

  const refreshCatalog = useCallback(async (series, status, search) => {
    if (!api) return
    setCatalogLoading(true)
    setCatalogError('')
    try {
      const [invRes, pricesMap, resellerList] = await Promise.all([
        fetchInventoryList({ series, status, search }),
        fetchPricesPublic(),
        fetchResellersPublic(),
      ])
      setInventory(invRes.data)
      setBasePrices(pricesMap)
      setResellers(resellerList.length ? resellerList : RESELLERS)
      if (series === 'All' && status === 'All' && !search) {
        setSeriesScope(invRes.data)
      }
    } catch (e) {
      setCatalogError(e?.message || 'Could not load catalog')
    } finally {
      setCatalogLoading(false)
    }
  }, [api])

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    if (!api) return
    refreshCatalog(filterSeries, filterStatus, searchDebounced)
  }, [api, filterSeries, filterStatus, searchDebounced, refreshCatalog])

  const catalogSync = useCallback(() => {
    refreshCatalog(filterSeries, filterStatus, searchDebounced)
  }, [refreshCatalog, filterSeries, filterStatus, searchDebounced])

  // ── Routing (hash-based) ──
  const [page, setPage] = useState(() =>
    window.location.hash.startsWith('#/admin') ? 'admin' : 'store'
  )

  useEffect(() => {
    const onHash = () => setPage(window.location.hash.startsWith('#/admin') ? 'admin' : 'store')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // ── Store state (always declared, hooks can't be conditional) ──
  const [reserveItem, setReserveItem] = useState(null)

  const handleReserve = (item) => setReserveItem(item)

  const filtered = useMemo(() => {
    if (api) return inventory
    return inventory.filter(item => {
      const q = search.toLowerCase()
      const matchSearch = !search
        || item.model.toLowerCase().includes(q)
        || item.storage.toLowerCase().includes(q)
      const matchSeries = filterSeries === 'All' || item.series === filterSeries
      const matchStatus = filterStatus === 'All'
        || (filterStatus === 'In Stock'  && item.status === 'in-stock')
        || (filterStatus === 'Low Stock' && item.status === 'low-stock')
        || (filterStatus === 'Sold Out'  && item.status === 'sold-out')
      return matchSearch && matchSeries && matchStatus
    })
  }, [api, inventory, search, filterSeries, filterStatus])

  const grouped = useMemo(() => groupBy(filtered, 'series'), [filtered])

  const seriesFilterChips = useMemo(
    () => seriesChipsFromInventory(seriesScope.length ? seriesScope : inventory),
    [seriesScope, inventory],
  )

  const catalogSeriesOrder = useMemo(() => {
    const keys = Object.keys(grouped)
    const ordered = SERIES_ORDER.filter((k) => keys.includes(k))
    const rest = keys.filter((k) => !SERIES_ORDER.includes(k)).sort()
    return [...ordered, ...rest]
  }, [grouped])

  // ── Admin route ──
  if (page === 'admin') {
    return (
      <Admin
        inventory={inventory} setInventory={setInventory}
        basePrices={basePrices} setBasePrices={setBasePrices}
        resellers={resellers} setResellers={setResellers}
        useApi={api}
        refreshCatalog={catalogSync}
        onExit={() => { window.location.hash = ''; setPage('store') }}
      />
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER ── */}
      <header className="store-header" style={{ position: 'sticky', top: 0, zIndex: 50,
        background: '#fff', borderBottom: '1px solid var(--border)' }}>
        <div className="store-header-inner" style={{ maxWidth: 1280, margin: '0 auto', height: 60,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', color: 'var(--text)' }}>
            <ConnectLogo height={36} />
          </div>

        </div>
      </header>

      {/* ── HERO ── Phones sit in this layer (absolute); clipped + masked — no inner “card” */}
      <div className="hero-section" style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(105deg, #fff 0%, #f7f9fd 38%, #eef2fb 72%, #e8ecf8 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div
          className="hero-phones-layer"
          aria-hidden
          style={{
            position: 'absolute',
            right: 0,
            top: '8%',
            bottom: '-2px',
            width: 'min(88vw, 760px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <img
            className="hero-phones-img"
            src={phonesLineup}
            alt=""
            decoding="async"
            style={{
              position: 'absolute',
              right: '-23%',
              bottom: '-49%',
              width: 'min(108%, 700px)',
              height: 'auto',
              maxWidth: 'none',
              objectFit: 'contain',
              objectPosition: 'right bottom',
              opacity: 0.5,
              /* Left fade into white + soft bottom fade before hero clip */
              WebkitMaskImage: [
                'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 28%, #000 52%)',
                'linear-gradient(to top, transparent 0%, #000 26%)',
              ].join(', '),
              maskImage: [
                'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.35) 28%, #000 52%)',
                'linear-gradient(to top, transparent 0%, #000 26%)',
              ].join(', '),
              WebkitMaskComposite: 'source-in',
              maskComposite: 'intersect',
            }}
          />
        </div>

        <div className="hero-copy" style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 1280,
          margin: '0 auto',
        }}>
          <p style={{ fontSize: 12, letterSpacing: '0.15em', color: 'var(--purple-light)',
            fontWeight: 600, marginBottom: 8 }}>
            LIVE INVENTORY
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800,
            letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1.1 }}>
            iPhone Stock Tracker
          </h1>
          <p className="hero-lead" style={{ color: 'var(--text2)', maxWidth: 480 }}>
            Real-time availability across all models. Reserve a unit or pre-order — we will handle the rest.
          </p>
          {catalogError && api && (
            <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{catalogError}</p>
          )}
          <Stats items={inventory} />
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="filter-bar" style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        position: 'sticky', top: 60, zIndex: 40 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto',
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>

          <div className="catalog-search-field" style={{ flex: '1 1 200px', maxWidth: 300 }}>
            <span className="catalog-search-icon" aria-hidden>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2.25" />
                <path d="M16 16l5 5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
              </svg>
            </span>
            <input
              className="catalog-search-input"
              type="search"
              enterKeyHint="search"
              placeholder="Search model or storage…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {seriesFilterChips.map(s => (
              <button key={s} onClick={() => setFilterSeries(s)} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: '1px solid var(--border)', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                background: filterSeries === s ? 'var(--purple)' : 'var(--bg3)',
                color: filterSeries === s ? '#fff' : 'var(--text2)',
                transition: 'all 0.15s',
              }}>
                {s}
              </button>
            ))}
          </div>

          <StatusFilterDropdown
            value={filterStatus}
            options={ALL_STATUSES}
            onChange={setFilterStatus}
          />
        </div>
      </div>

      {/* ── CATALOG ── */}
      <main id="stock-catalog" className="store-main" style={{
        flex: 1,
        maxWidth: 1280,
        margin: '0 auto',
        width: '100%',
      }}>
        {catalogLoading && api && (
          <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 20 }}>Loading catalog…</p>
        )}
        {catalogSeriesOrder.filter((s) => grouped[s]?.length > 0).map(series => (
          <section key={series} style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>{series}</h2>
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>
                {grouped[series].length} variant{grouped[series].length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: 14 }}>
              {grouped[series].map(item => (
                <ProductCard key={item.id} item={item} onReserve={handleReserve} />
              ))}
            </div>
          </section>
        ))}

        {Object.keys(grouped).length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text3)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📭</p>
            <p style={{ fontWeight: 600 }}>No items match your filters</p>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--bg2) 0%, var(--bg) 55%)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '44px 24px 28px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 'clamp(28px, 5vw, 48px)',
            marginBottom: 36,
            alignItems: 'start',
          }}>
            <div>
              <div style={{ marginBottom: 14 }}>
                <ConnectLogo height={30} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 340 }}>
                Live iPhone inventory from trusted resellers. Reserve in a few taps — we handle the rest.
              </p>
              <div style={{ marginTop: 20 }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text3)',
                  marginBottom: 10,
                }}>
                  FOLLOW US
                </p>
                <a
                  href="https://www.tiktok.com/@frelzon.connect"
                  rel="noopener noreferrer"
                  target="_blank"
                  aria-label="Frelzon Connect on TikTok"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    color: 'var(--text2)',
                    textDecoration: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  <img
                    src={iconTiktok}
                    alt=""
                    width={22}
                    height={22}
                    decoding="async"
                    style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }}
                  />
                  <span>@frelzon.connect</span>
                </a>
              </div>
            </div>
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text3)',
                marginBottom: 14,
              }}>
                WHY FRELZON CONNECT
              </p>
              <ul style={{
                listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10,
                fontSize: 13, color: 'var(--text2)', lineHeight: 1.45,
              }}>
                {['Premium iPhones', '6-month warranty', 'Free nationwide delivery'].map((label) => (
                  <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={iconCheckMark}
                      alt=""
                      width={18}
                      height={18}
                      decoding="async"
                      style={{ flexShrink: 0, objectFit: 'contain', display: 'block' }}
                    />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 20,
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
            gap: 12,
          }}>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>
              © {new Date().getFullYear()} Frelzon Connect. Prices shown are indicative; final totals confirmed at checkout.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* <Logo size={20} /> */}
              <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--text2)' }}>frelzon connect</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ── MODAL ── */}
      {reserveItem && (
        <PreOrderModal
          item={reserveItem}
          resellers={resellers}
          basePrices={basePrices}
          useApi={api}
          onOrdered={catalogSync}
          onClose={() => setReserveItem(null)}
        />
      )}
    </div>
  )
}
