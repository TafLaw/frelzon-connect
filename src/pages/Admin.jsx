import { useState, useCallback, useEffect, useRef, useLayoutEffect } from 'react'
import { STORAGE_OPTIONS, statusLabel, formatPrice } from '../data'
import ConnectLogo from '../components/ConnectLogo'
import iconChecklist from '../assets/icons/checklist.png'
import iconAvailable from '../assets/icons/available.png'
import iconPriceTag from '../assets/icons/price-tag.png'
import iconReseller from '../assets/icons/reseller.png'
import { getApiBaseUrl } from '../config'
import {
  getStoredAdminJwt,
  setStoredAdminJwt,
  setAdminAuthTokens,
  clearAdminAuthSession,
  freizonConnectAdminLogin,
  adminFetchInventory,
  fetchPricesPublic,
  adminFetchResellers,
  adminCreateInventory,
  adminPatchInventory,
  adminDeleteInventory,
  adminPatchPrice,
  adminDeletePrice,
  adminPutPricesBulk,
  adminCreateReseller,
  adminPatchReseller,
  adminDeleteReseller,
  adminFetchOrders,
  adminPatchOrderStatus,
  adminListFlexiPayApplications,
  adminReviewFlexiPayApplication,
  adminCreateFlexiPayApplication,
} from '../api'

// ─── ADMIN SIGN-IN (POST /frelzon-connect/admin/login — JSON: email, password) ─

function AdminRequiresApi({ onExit }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 40, width: '100%', maxWidth: 440 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <ConnectLogo height={36} />
        </div>
        <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 10, textAlign: 'center' }}>
          Admin needs the API
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 12 }}>
          Sign-in sends <code style={{ fontSize: 12 }}>POST /frelzon-connect/admin/login</code> with JSON{' '}
          <code style={{ fontSize: 12 }}>{'{ "email": "…", "password": "…" }'}</code>.
          Set <code style={{ fontSize: 12 }}>VITE_API_BASE_URL</code> in your environment (no trailing slash),
          restart the dev server, then open admin again.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <ABtn onClick={onExit}>← Back to Store</ABtn>
        </div>
      </div>
    </div>
  )
}

function ApiAdminLogin({ onSuccess }) {
  const [useToken, setUseToken] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const base = getApiBaseUrl()

  async function handleCredentialSubmit(e) {
    e.preventDefault()
    setError('')
    if (!base) {
      setError('VITE_API_BASE_URL is not set.')
      return
    }
    if (!email.trim() || !password) {
      setError('Email and password are required (same as FoodLoop login).')
      return
    }
    setLoading(true)
    try {
      const out = await freizonConnectAdminLogin(email, password)
      setAdminAuthTokens(out.token, out.refresh_token)
      onSuccess(out.token)
    } catch (err) {
      setError(err?.message || 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleTokenSubmit(e) {
    e.preventDefault()
    const t = token.trim()
    if (!t) { setError('Paste your admin JWT'); return }
    if (!base) {
      setError('VITE_API_BASE_URL is not set.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await adminFetchInventory(t)
      setStoredAdminJwt(t)
      onSuccess(t)
    } catch (err) {
      setError(err?.message || 'Invalid token or no access')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 40, width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--purple-dim)',
            border: '1px solid var(--purple-border)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>🔑</div>
          <h2 style={{ fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Admin Access</h2>
          <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.5 }}>
            Frelzon Connect — Inventory Management
          </p>
        </div>

        {!useToken ? (
          <form onSubmit={handleCredentialSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle} htmlFor="frelzon-admin-email">Email</label>
              <input
                id="frelzon-admin-email"
                name="email"
                type="email"
                autoComplete="username"
                placeholder="admin@frelzon.co.za"
                value={email}
                onChange={e => { setEmail(e.target.value); setError('') }}
                style={{ borderColor: error ? 'var(--red)' : undefined }}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle} htmlFor="frelzon-admin-password">Password</label>
              <input
                id="frelzon-admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Your Frelzon Connect password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                style={{ borderColor: error ? 'var(--red)' : undefined }}
              />
            </div>
            {error && <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 12 }}>{error}</p>}
            <ABtn primary full type="submit" disabled={loading || !base}>
              {loading ? 'Signing in…' : 'Sign in'}
            </ABtn>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 16, textAlign: 'center' }}>
              <button type="button" onClick={() => { setUseToken(true); setError('') }} style={{
                background: 'none', border: 'none', color: 'var(--purple-light)', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontSize: 12, textDecoration: 'underline', padding: 0,
              }}>
                Sign in with bearer token instead
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleTokenSubmit}>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.5 }}>
              For <code style={{ fontSize: 11 }}>Authorization: Bearer …</code> on admin routes only — not the login endpoint.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Bearer token</label>
              <textarea placeholder="eyJhbG…" value={token}
                onChange={e => { setToken(e.target.value); setError('') }}
                rows={4}
                style={{ width: '100%', resize: 'vertical', fontFamily: 'DM Mono, monospace', fontSize: 12,
                  borderColor: error ? 'var(--red)' : undefined }}
                autoFocus />
              {error && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 6 }}>{error}</p>}
            </div>
            <ABtn primary full type="submit" disabled={loading || !base}>{loading ? 'Checking…' : 'Continue'}</ABtn>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 16, textAlign: 'center' }}>
              <button type="button" onClick={() => { setUseToken(false); setError('') }} style={{
                background: 'none', border: 'none', color: 'var(--purple-light)', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontSize: 12, textDecoration: 'underline', padding: 0,
              }}>
                Sign in with email and password
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── SHARED PRIMITIVES ────────────────────────────────────────────────────────

const labelStyle = { fontSize: 12, fontWeight: 600, color: 'var(--text3)',
  letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }

function ABtn({ children, primary, danger, small, full, onClick, type = 'button', disabled }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: small ? '5px 12px' : '9px 18px',
      borderRadius: 8, fontSize: small ? 12 : 14, fontWeight: 600,
      border: primary || danger ? 'none' : '1px solid var(--border)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      fontFamily: 'DM Sans, sans-serif', width: full ? '100%' : undefined,
      background: primary ? 'var(--purple)' : danger ? 'var(--red-dim)' : 'var(--bg3)',
      color: primary ? '#fff' : danger ? 'var(--red)' : 'var(--text2)',
      opacity: disabled ? 0.5 : 1, transition: 'all 0.15s',
      whiteSpace: 'nowrap',
    }}>{children}</button>
  )
}

function Badge({ children, color }) {
  const map = {
    green:  { bg: 'var(--green-dim)',  color: 'var(--green)'  },
    amber:  { bg: 'var(--amber-dim)',  color: 'var(--amber)'  },
    red:    { bg: 'var(--red-dim)',    color: 'var(--red)'    },
    purple: { bg: 'var(--purple-dim)', color: 'var(--purple-light)' },
  }
  const s = map[color] || map.purple
  return (
    <span style={{ ...s, padding: '2px 8px', borderRadius: 6, fontSize: 11,
      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {children}
    </span>
  )
}

function FieldRow({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>{children}</div>
}

function FormField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children, width = 520 }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{
      position: 'fixed', inset: 0, background: 'oklch(0% 0 0 / 0.7)',
      backdropFilter: 'blur(6px)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28, width: '100%', maxWidth: width,
        maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 17 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'var(--bg3)',
            border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32,
            cursor: 'pointer', color: 'var(--text2)', fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

/** Custom select — fixed-position menu avoids iOS native picker bugs and overflow clipping in tables. */
function AdminSelectDropdown({
  value,
  options,
  onChange,
  placeholder = 'Select…',
  size = 'md',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [menuRect, setMenuRect] = useState(null)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)

  const measure = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setMenuRect({
      top: r.bottom + 6,
      left: r.left,
      width: Math.max(r.width, 128),
    })
  }, [])

  useLayoutEffect(() => {
    if (open) measure()
    else setMenuRect(null)
  }, [open, measure])

  useEffect(() => {
    if (!open) return
    function onScroll() {
      setOpen(false)
    }
    function onResize() {
      measure()
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, measure])

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

  const selected = options.find((o) => o.value === value)
  const label = selected?.label ?? placeholder
  const pad = size === 'sm' ? '5px 10px' : '10px 14px'
  const fontSize = size === 'sm' ? 12 : 14
  const minW = size === 'sm' ? 104 : 124

  return (
    <div
      ref={rootRef}
      className="admin-select-dropdown"
      style={{ position: 'relative', flexShrink: 0, zIndex: open ? 300 : undefined }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="admin-select-trigger"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          minWidth: minW,
          padding: pad,
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg3)',
          color: 'var(--text)',
          fontFamily: 'DM Sans, sans-serif',
          fontSize,
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          width: 'auto',
        }}
      >
        <span style={{
          textAlign: 'left',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        >
          {label}
        </span>
        <span aria-hidden style={{ fontSize: 9, opacity: 0.65, flexShrink: 0 }}>▼</span>
      </button>
      {open && menuRect && (
        <ul
          className={`admin-select-listbox${size === 'sm' ? ' admin-select-listbox--sm' : ''}`}
          role="listbox"
          style={{
            position: 'fixed',
            top: menuRect.top,
            left: menuRect.left,
            width: menuRect.width,
            margin: 0,
            padding: 6,
            listStyle: 'none',
            maxHeight: 'min(280px, calc(100dvh - 24px))',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {options.map((opt) => (
            <li key={opt.value === '' ? '__empty' : String(opt.value)} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={
                  opt.value === value ? 'admin-select-option admin-select-option-active' : 'admin-select-option'
                }
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const STATUS_OPTIONS = ['in-stock', 'low-stock', 'sold-out']
const INVENTORY_STATUS_SELECT_OPTIONS = STATUS_OPTIONS.map((s) => ({ value: s, label: statusLabel(s) }))
const STORAGE_SELECT_OPTIONS = STORAGE_OPTIONS.map((s) => ({ value: s, label: s }))
const statusColor = s =>
  s === 'in-stock' ? 'green' : s === 'low-stock' ? 'amber' : 'red'
const MAX_INVENTORY_IMAGE_BYTES = 5 * 1024 * 1024
const ALLOWED_INVENTORY_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function validateInventoryImageFile(file) {
  if (!file) return ''
  if (!ALLOWED_INVENTORY_IMAGE_TYPES.includes(file.type)) {
    return 'Invalid image type. Use JPEG, PNG, WEBP, or GIF.'
  }
  if (file.size > MAX_INVENTORY_IMAGE_BYTES) {
    return 'Image is too large. Maximum upload size is 5MB.'
  }
  return ''
}

function formatInventoryApiError(err) {
  const status = Number(err?.status || 0)
  const code = err?.body?.code
  if (status === 401 || status === 403) {
    return 'Unauthorized. Please sign in with an admin account and try again.'
  }
  if (status === 503 && code === 'SPACES_NOT_CONFIGURED') {
    return 'Image storage is not configured on server. Please contact support or use image URL mode.'
  }
  if (status === 400 || status === 422) {
    return err?.message || 'Validation failed. Please check the form values.'
  }
  return err?.message || 'Request failed'
}

function ColourEditor({ colors, onChange }) {
  const list = Array.isArray(colors) ? colors : []
  const add = () => onChange([...list, { name: '', hex: '#000000' }])
  const remove = (i) => onChange(list.filter((_, j) => j !== i))
  const update = (i, field, val) => onChange(list.map((c, j) => j === i ? { ...c, [field]: val } : c))

  return (
    <div>
      {list.map((c, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input
            placeholder="e.g. Midnight"
            value={c.name}
            onChange={e => update(i, 'name', e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="color"
            value={c.hex || '#000000'}
            onChange={e => update(i, 'hex', e.target.value)}
            title="Pick swatch colour"
            style={{
              width: 36, height: 36, padding: 2, borderRadius: 8,
              border: '1px solid var(--border)', cursor: 'pointer',
              background: 'var(--bg3)', flexShrink: 0,
            }}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            title="Remove"
            style={{
              width: 28, height: 28, border: '1px solid var(--border)', borderRadius: 6,
              background: 'var(--bg3)', cursor: 'pointer', fontSize: 16, lineHeight: 1,
              color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >×</button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        style={{
          fontSize: 12, fontWeight: 600, color: 'var(--purple-light)',
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >+ Add colour</button>
    </div>
  )
}

function InventorySectionHeading({ children }) {
  return (
    <h4 style={{
      fontSize: 11,
      fontWeight: 700,
      color: 'var(--text3)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      marginTop: 22,
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: '1px solid var(--border)',
    }}
    >
      {children}
    </h4>
  )
}

/** Stock, image, display, specs — used in the edit-variant dialog (and add flow). */
function InventoryVariantFormFields({ data, setData, useApi, showStock = true }) {
  const patch = (partial) => setData((d) => ({ ...d, ...partial }))

  return (
    <div className="inventory-variant-form-fields">
      {showStock && (
        <>
          <InventorySectionHeading>Stock</InventorySectionHeading>
          <FieldRow>
            <FormField label="Status">
              <AdminSelectDropdown
                value={data.status}
                options={INVENTORY_STATUS_SELECT_OPTIONS}
                onChange={(v) => patch({ status: v })}
              />
            </FormField>
            <FormField label="Quantity">
              <input
                type="number"
                min="0"
                value={data.qty}
                onChange={(e) => patch({ qty: e.target.value })}
              />
            </FormField>
          </FieldRow>
          <FormField label="Restock estimate">
            <input
              placeholder="~2 weeks (leave empty if not applicable)"
              value={data.restockIn}
              onChange={(e) => patch({ restockIn: e.target.value })}
            />
          </FormField>
        </>
      )}

      {useApi && (
        <>
          <InventorySectionHeading>Image</InventorySectionHeading>
          <FormField label="Upload (optional)">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => patch({ imageFile: e.target.files?.[0] || null })}
            />
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
              JPG, PNG, WEBP, or GIF. Max 5MB.
            </p>
            {data.imageFile && (
              <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                Selected: {data.imageFile.name}
              </p>
            )}
          </FormField>
          <FormField label="Image URL (https, optional)">
            <input
              placeholder="https://…"
              value={data.imageUrl}
              onChange={(e) => patch({ imageUrl: e.target.value })}
            />
          </FormField>
        </>
      )}

      <InventorySectionHeading>Storefront display</InventorySectionHeading>
      <FieldRow>
        <FormField label="Rating (0–5, optional)">
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            placeholder="4.5"
            value={data.rating}
            onChange={(e) => patch({ rating: e.target.value })}
          />
        </FormField>
        <FormField label="Review count">
          <input
            type="number"
            min="0"
            placeholder="0"
            value={data.reviewCount}
            onChange={(e) => patch({ reviewCount: e.target.value })}
          />
        </FormField>
      </FieldRow>
      <FieldRow>
        <FormField label="Was-price / compare (ZAR cents)">
          <input
            type="number"
            min="0"
            placeholder="e.g. 1899900"
            value={data.compareAtPrice}
            onChange={(e) => patch({ compareAtPrice: e.target.value })}
          />
        </FormField>
        <FormField label="Badges">
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 14,
            cursor: 'pointer',
            marginTop: 6,
          }}
          >
            <input
              type="checkbox"
              checked={data.isNew}
              onChange={(e) => patch({ isNew: e.target.checked })}
            />
            Show NEW badge
          </label>
        </FormField>
        <FormField label="FlexiPay">
          <label style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 14, cursor: 'pointer', marginTop: 6,
          }}>
            <input
              type="checkbox"
              checked={data.installmentEligible}
              onChange={(e) => patch({ installmentEligible: e.target.checked })}
            />
            Eligible for 50% deposit + 3-month plan
          </label>
          {data.installmentEligible && (
            <p style={{ fontSize: 11, color: '#6B7280', marginTop: 4, lineHeight: 1.5 }}>
              Customers can pay 50% now and the balance over 3 equal monthly instalments.
            </p>
          )}
        </FormField>
      </FieldRow>

      <InventorySectionHeading>Specifications</InventorySectionHeading>
      <FieldRow>
        <FormField label="Colours">
          <ColourEditor colors={data.colors} onChange={(v) => patch({ colors: v })} />
        </FormField>
        <FormField label="Condition">
          <input
            placeholder="Brand New, Factory Sealed"
            value={data.condition}
            onChange={(e) => patch({ condition: e.target.value })}
          />
        </FormField>
      </FieldRow>
      <FormField label="Warranty">
        <input
          placeholder="1-Year Apple Warranty"
          value={data.warranty}
          onChange={(e) => patch({ warranty: e.target.value })}
        />
      </FormField>

      <InventorySectionHeading>In the box</InventorySectionHeading>
      <FormField label="Items (one per line)">
        <textarea
          rows={5}
          placeholder={'iPhone handset\nUSB-C to USB-C cable\nDocumentation\nFrelzon Connect care card'}
          value={data.inTheBox}
          onChange={(e) => patch({ inTheBox: e.target.value })}
          style={{ width: '100%', resize: 'vertical', fontFamily: 'DM Mono, monospace', fontSize: 12 }}
        />
      </FormField>
    </div>
  )
}

// ─── INVENTORY TAB ────────────────────────────────────────────────────────────

function InventoryTab({ inventory, setInventory, basePrices, useApi, token, reloadFromApi }) {
  const [editId, setEditId] = useState(null)
  const [editData, setEditData] = useState({})
  const [showAdd, setShowAdd] = useState(false)
  const [newItem, setNewItem] = useState({
    series: '', model: '', storage: '128GB', status: 'in-stock', qty: '', restockIn: '', imageUrl: '', imageFile: null,
    rating: '', reviewCount: '', compareAtPrice: '', isNew: false, inTheBox: '',
    colors: [], condition: '', warranty: '', installmentEligible: false,
  })
  const [search, setSearch] = useState('')
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [tabError, setTabError] = useState('')

  const filtered = inventory.filter(i =>
    !search || i.model.toLowerCase().includes(search.toLowerCase())
    || i.storage.toLowerCase().includes(search.toLowerCase())
  )

  function startEdit(item) {
    setTabError('')
    setEditId(item.id)
    setEditData({
      status: item.status,
      qty: item.qty,
      restockIn: item.restockIn || '',
      imageUrl: item.imageUrl || '',
      imageFile: null,
      rating: item.rating != null ? String(item.rating) : '',
      reviewCount: item.reviewCount != null ? String(item.reviewCount) : '',
      compareAtPrice: item.compareAtPrice != null ? String(item.compareAtPrice) : '',
      isNew: item.isNew ?? false,
      inTheBox: Array.isArray(item.inTheBox) && item.inTheBox.length > 0
        ? item.inTheBox.join('\n')
        : 'iPhone handset\nUSB-C to USB-C cable\nDocumentation\nFrelzon Connect care card',
      colors: Array.isArray(item.colors) && item.colors.length > 0
        ? item.colors
        : (item.color || item.colorHex)
          ? [{ name: item.color || '', hex: item.colorHex || '#000000' }]
          : [],
      condition: item.condition || 'Brand New, Factory Sealed',
      warranty: item.warranty || '1-Year Apple Warranty',
      installmentEligible: item.installmentEligible ?? false,
    })
  }

  async function saveEdit(id) {
    setTabError('')
    const imageErr = validateInventoryImageFile(editData.imageFile)
    if (imageErr) {
      setTabError(imageErr)
      return
    }
    if (useApi && token) {
      const current = inventory.find((i) => i.id === id)
      if (!current) {
        setTabError('Could not find this variant to update.')
        return
      }
      const patch = {}
      if (editData.status !== current.status) patch.status = editData.status
      if (Number(editData.qty) !== Number(current.qty)) patch.qty = Number(editData.qty)
      const nextRestock = editData.restockIn.trim() || null
      const currentRestock = current.restockIn || null
      if (nextRestock !== currentRestock) patch.restockIn = nextRestock
      const nextImageUrl = editData.imageUrl.trim() || null
      const currentImageUrl = current.imageUrl || null
      if (nextImageUrl !== currentImageUrl) patch.imageUrl = nextImageUrl
      if (editData.imageFile) patch.imageFile = editData.imageFile
      const nextRating = editData.rating !== '' ? Number(editData.rating) : null
      if (nextRating !== (current.rating ?? null)) patch.rating = nextRating
      const nextReviewCount = editData.reviewCount !== '' ? Number(editData.reviewCount) : 0
      if (nextReviewCount !== (current.reviewCount ?? 0)) patch.reviewCount = nextReviewCount
      const nextCompareAtPrice = editData.compareAtPrice !== '' ? Number(editData.compareAtPrice) : null
      if (nextCompareAtPrice !== (current.compareAtPrice ?? null)) patch.compareAtPrice = nextCompareAtPrice
      const nextIsNew = Boolean(editData.isNew)
      if (nextIsNew !== (current.isNew ?? false)) patch.isNew = nextIsNew
      const nextInTheBox = editData.inTheBox.trim()
        ? editData.inTheBox.split('\n').map(s => s.trim()).filter(Boolean)
        : null
      const currentInTheBox = Array.isArray(current.inTheBox) ? current.inTheBox : null
      if (JSON.stringify(nextInTheBox) !== JSON.stringify(currentInTheBox)) patch.inTheBox = nextInTheBox
      const nextColors = Array.isArray(editData.colors) && editData.colors.length > 0 ? editData.colors : null
      if (JSON.stringify(nextColors) !== JSON.stringify(current.colors || null)) patch.colors = nextColors
      const nextCondition = editData.condition.trim() || null
      if (nextCondition !== (current.condition || null)) patch.condition = nextCondition
      const nextWarranty = editData.warranty.trim() || null
      if (nextWarranty !== (current.warranty || null)) patch.warranty = nextWarranty
      const nextInstallmentEligible = Boolean(editData.installmentEligible)
      if (nextInstallmentEligible !== Boolean(current.installmentEligible ?? false)) patch.installmentEligible = nextInstallmentEligible
      if (Object.keys(patch).length === 0) {
        setTabError('No changes to save.')
        return
      }
      setBusy(true)
      try {
        await adminPatchInventory(token, id, patch)
        await reloadFromApi()
        setEditId(null)
      } catch (e) {
        setTabError(formatInventoryApiError(e))
      } finally {
        setBusy(false)
      }
      return
    }
    setInventory(inv => inv.map(i => i.id === id
      ? {
        ...i,
        status: editData.status,
        qty: Number(editData.qty),
        restockIn: editData.restockIn.trim() || null,
        imageUrl: editData.imageUrl.trim() || null,
        rating: editData.rating !== '' ? Number(editData.rating) : null,
        reviewCount: editData.reviewCount !== '' ? Number(editData.reviewCount) : 0,
        compareAtPrice: editData.compareAtPrice !== '' ? Number(editData.compareAtPrice) : null,
        isNew: Boolean(editData.isNew),
        inTheBox: editData.inTheBox.trim()
          ? editData.inTheBox.split('\n').map(s => s.trim()).filter(Boolean)
          : null,
        colors: Array.isArray(editData.colors) && editData.colors.length > 0 ? editData.colors : null,
        condition: editData.condition.trim() || null,
        warranty: editData.warranty.trim() || null,
      }
      : i
    ))
    setEditId(null)
  }

  async function deleteItem(id) {
    setTabError('')
    if (useApi && token) {
      setBusy(true)
      try {
        await adminDeleteInventory(token, id)
        await reloadFromApi()
        setConfirm(null)
      } catch (e) {
        setTabError(e?.message || 'Delete failed')
      } finally {
        setBusy(false)
      }
      return
    }
    setInventory(inv => inv.filter(i => i.id !== id))
    setConfirm(null)
  }

  async function addItem() {
    setTabError('')
    const imageErr = validateInventoryImageFile(newItem.imageFile)
    if (imageErr) {
      setTabError(imageErr)
      return
    }
    if (useApi && token) {
      setBusy(true)
      try {
        await adminCreateInventory(token, {
          series: newItem.series.trim(),
          model: newItem.model.trim(),
          storage: newItem.storage,
          status: newItem.status,
          qty: Number(newItem.qty) || 0,
          restockIn: newItem.restockIn.trim() || null,
          imageUrl: newItem.imageUrl.trim() || null,
          imageFile: newItem.imageFile || null,
          rating: newItem.rating !== '' ? Number(newItem.rating) : null,
          reviewCount: newItem.reviewCount !== '' ? Number(newItem.reviewCount) : 0,
          compareAtPrice: newItem.compareAtPrice !== '' ? Number(newItem.compareAtPrice) : null,
          isNew: Boolean(newItem.isNew),
          inTheBox: newItem.inTheBox.trim()
            ? newItem.inTheBox.split('\n').map(s => s.trim()).filter(Boolean)
            : null,
          colors: Array.isArray(newItem.colors) && newItem.colors.length > 0 ? newItem.colors : null,
          condition: newItem.condition.trim() || null,
          warranty: newItem.warranty.trim() || null,
        })
        await reloadFromApi()
        setShowAdd(false)
        setNewItem({
          series: '',
          model: '',
          storage: '128GB',
          status: 'in-stock',
          qty: '',
          restockIn: '',
          imageUrl: '',
          imageFile: null,
          rating: '',
          reviewCount: '',
          compareAtPrice: '',
          isNew: false,
          inTheBox: '',
          colors: [],
          condition: '',
          warranty: '',
        })
      } catch (e) {
        setTabError(formatInventoryApiError(e))
      } finally {
        setBusy(false)
      }
      return
    }
    const id = Date.now()
    setInventory(inv => [...inv, {
      id,
      series: newItem.series.trim(),
      model: newItem.model.trim(),
      storage: newItem.storage,
      status: newItem.status,
      qty: Number(newItem.qty) || 0,
      restockIn: newItem.restockIn.trim() || null,
      imageUrl: newItem.imageUrl.trim() || null,
      rating: newItem.rating !== '' ? Number(newItem.rating) : null,
      reviewCount: newItem.reviewCount !== '' ? Number(newItem.reviewCount) : 0,
      compareAtPrice: newItem.compareAtPrice !== '' ? Number(newItem.compareAtPrice) : null,
      isNew: Boolean(newItem.isNew),
      inTheBox: newItem.inTheBox.trim()
        ? newItem.inTheBox.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
      colors: Array.isArray(newItem.colors) && newItem.colors.length > 0 ? newItem.colors : null,
      condition: newItem.condition.trim() || null,
      warranty: newItem.warranty.trim() || null,
    }])
    setShowAdd(false)
    setNewItem({
      series: '',
      model: '',
      storage: '128GB',
      status: 'in-stock',
      qty: '',
      restockIn: '',
      imageUrl: '',
      imageFile: null,
      rating: '',
      reviewCount: '',
      compareAtPrice: '',
      isNew: false,
      inTheBox: '',
      colors: [],
      condition: '',
      warranty: '',
    })
  }

  const allSeries = [...new Set(inventory.map(i => i.series))].sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 0 }}>
      <div style={{ flexShrink: 0 }}>
        {tabError && !editId && (
          <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{tabError}</p>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 12, flexWrap: 'wrap', paddingBottom: 12, marginBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}>
          <div className="catalog-search-field" style={{ flex: '1 1 220px', maxWidth: 320 }}>
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
          <ABtn primary onClick={() => setShowAdd(true)} disabled={busy}>+ Add Variant</ABtn>
        </div>
      </div>

      <div className="admin-table-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Series', 'Model', 'Storage', 'Status', 'Qty', 'Restock', 'Price', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600,
                  fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              const isOpenInDialog = editId === item.id
              const basePrice = basePrices[`${item.model}|${item.storage}`]
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)',
                  background: isOpenInDialog ? 'var(--purple-dim)' : undefined }}>
                  <td style={tdStyle}><span style={{ color: 'var(--text3)' }}>{item.series}</span></td>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{item.model}</td>
                  <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace' }}>{item.storage}</td>
                  <td style={tdStyle}>
                    <Badge color={statusColor(item.status)}>{statusLabel(item.status)}</Badge>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontFamily: 'DM Mono, monospace' }}>{item.qty}</span>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ color: 'var(--text3)' }}>{item.restockIn || '—'}</span>
                      {useApi && item.imageUrl && (
                        <img src={item.imageUrl} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} />
                      )}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace' }}>
                    {basePrice ? `R${basePrice.toLocaleString('en-ZA')}` : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <ABtn small onClick={() => startEdit(item)} disabled={busy}>Edit</ABtn>
                      <ABtn small danger onClick={() => setConfirm(item.id)} disabled={busy}>Delete</ABtn>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>No variants found</p>
        )}
      </div>

      {/* Edit variant modal */}
      {editId != null && (() => {
        const editingItem = inventory.find((i) => i.id === editId)
        if (!editingItem) return null
        const editBasePrice = basePrices[`${editingItem.model}|${editingItem.storage}`]
        return (
          <Modal
            title="Edit variant"
            width={640}
            onClose={() => { setEditId(null); setTabError('') }}
          >
            <div style={{ marginTop: -8, marginBottom: 8 }}>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{editingItem.model}</p>
              <p style={{ fontSize: 13, color: 'var(--text3)' }}>
                {editingItem.series}
                {' · '}
                <span style={{ fontFamily: 'DM Mono, monospace' }}>{editingItem.storage}</span>
                {editBasePrice ? ` · Base R${editBasePrice.toLocaleString('en-ZA')}` : ''}
              </p>
            </div>
            {tabError && (
              <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 16 }}>{tabError}</p>
            )}
            <div style={{ marginTop: -8 }}>
              <InventoryVariantFormFields data={editData} setData={setEditData} useApi={useApi} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <ABtn onClick={() => { setEditId(null); setTabError('') }} disabled={busy}>Cancel</ABtn>
              <ABtn primary onClick={() => saveEdit(editId)} disabled={busy}>
                {busy ? 'Saving…' : 'Save changes'}
              </ABtn>
            </div>
          </Modal>
        )
      })()}

      {/* Add variant modal */}
      {showAdd && (
        <Modal title="Add New Variant" onClose={() => setShowAdd(false)}>
          <FieldRow>
            <FormField label="Series">
              <input list="series-list" placeholder="iPhone 16" value={newItem.series}
                onChange={e => setNewItem(n => ({ ...n, series: e.target.value }))} />
              <datalist id="series-list">
                {allSeries.map(s => <option key={s} value={s} />)}
              </datalist>
            </FormField>
            <FormField label="Model Name">
              <input placeholder="iPhone 16 Pro" value={newItem.model}
                onChange={e => setNewItem(n => ({ ...n, model: e.target.value }))} />
            </FormField>
          </FieldRow>
          <FieldRow>
            <FormField label="Storage">
              <AdminSelectDropdown
                value={newItem.storage}
                options={STORAGE_SELECT_OPTIONS}
                onChange={(v) => setNewItem(n => ({ ...n, storage: v }))}
              />
            </FormField>
            <FormField label="Status">
              <AdminSelectDropdown
                value={newItem.status}
                options={INVENTORY_STATUS_SELECT_OPTIONS}
                onChange={(v) => setNewItem(n => ({ ...n, status: v }))}
              />
            </FormField>
          </FieldRow>
          <FieldRow>
            <FormField label="Quantity">
              <input type="number" min="0" placeholder="0" value={newItem.qty}
                onChange={e => setNewItem(n => ({ ...n, qty: e.target.value }))} />
            </FormField>
            <FormField label="Restock Estimate">
              <input placeholder="~2 weeks" value={newItem.restockIn}
                onChange={e => setNewItem(n => ({ ...n, restockIn: e.target.value }))} />
            </FormField>
          </FieldRow>
          <InventoryVariantFormFields data={newItem} setData={setNewItem} useApi={useApi} showStock={false} />
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
            💡 Set the base price for this variant in the <strong>Pricing</strong> tab after adding.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <ABtn onClick={() => setShowAdd(false)}>Cancel</ABtn>
            <ABtn primary onClick={addItem}
              disabled={!newItem.series.trim() || !newItem.model.trim()}>
              Add Variant
            </ABtn>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {confirm !== null && (
        <Modal title="Delete Variant?" onClose={() => setConfirm(null)} width={380}>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
            This will permanently remove this inventory variant.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <ABtn onClick={() => setConfirm(null)}>Cancel</ABtn>
            <ABtn danger onClick={() => deleteItem(confirm)} disabled={busy}>Delete</ABtn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── PRICING TAB ─────────────────────────────────────────────────────────────

function PricingTab({ inventory, basePrices, setBasePrices, useApi, token, reloadFromApi }) {
  const [editKey, setEditKey] = useState(null)
  const [editVal, setEditVal] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newEntry, setNewEntry] = useState({ model: '', storage: '128GB', price: '' })
  const [search, setSearch] = useState('')
  const [busy, setBusy] = useState(false)
  const [tabError, setTabError] = useState('')

  // Derive unique model|storage keys from inventory
  const inventoryKeys = [...new Set(inventory.map(i => `${i.model}|${i.storage}`))]
  // Merge with any manually added price entries
  const allPriceKeys = [...new Set([...inventoryKeys, ...Object.keys(basePrices)])]
  const filtered = allPriceKeys.filter(k =>
    !search || k.toLowerCase().includes(search.toLowerCase())
  ).sort()

  async function saveEdit(key) {
    setTabError('')
    const val = parseFloat(editVal)
    if (isNaN(val) || val <= 0) { setEditKey(null); return }
    const [model, storage] = key.split('|')
    if (useApi && token) {
      setBusy(true)
      try {
        await adminPatchPrice(token, model, storage, Math.round(val))
        await reloadFromApi()
        setEditKey(null)
      } catch (e) {
        setTabError(e?.message || 'Save failed')
      } finally {
        setBusy(false)
      }
      return
    }
    setBasePrices(p => ({ ...p, [key]: Math.round(val) }))
    setEditKey(null)
  }

  async function deletePrice(key) {
    setTabError('')
    const [model, storage] = key.split('|')
    if (useApi && token) {
      setBusy(true)
      try {
        await adminDeletePrice(token, model, storage)
        await reloadFromApi()
      } catch (e) {
        setTabError(e?.message || 'Delete failed')
      } finally {
        setBusy(false)
      }
      return
    }
    setBasePrices(p => { const next = { ...p }; delete next[key]; return next })
  }

  async function addEntry() {
    setTabError('')
    const key = `${newEntry.model.trim()}|${newEntry.storage}`
    const val = parseFloat(newEntry.price)
    if (isNaN(val) || val <= 0) return
    if (useApi && token) {
      setBusy(true)
      try {
        const rows = Object.entries(basePrices).map(([k, price]) => {
          const [m, s] = k.split('|')
          return { model: m, storage: s, price }
        })
        rows.push({ model: newEntry.model.trim(), storage: newEntry.storage, price: Math.round(val) })
        const map = await adminPutPricesBulk(token, rows)
        setBasePrices(map)
        await reloadFromApi()
        setShowAdd(false)
        setNewEntry({ model: '', storage: '128GB', price: '' })
      } catch (e) {
        setTabError(e?.message || 'Could not add price')
      } finally {
        setBusy(false)
      }
      return
    }
    setBasePrices(p => ({ ...p, [key]: Math.round(val) }))
    setShowAdd(false)
    setNewEntry({ model: '', storage: '128GB', price: '' })
  }

  const allModels = [...new Set(inventory.map(i => i.model))].sort()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 0 }}>
      <div style={{ flexShrink: 0 }}>
        {tabError && (
          <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{tabError}</p>
        )}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 12, flexWrap: 'wrap', paddingBottom: 12, marginBottom: 12,
          borderBottom: '1px solid var(--border)',
        }}>
          <div className="catalog-search-field" style={{ flex: '1 1 220px', maxWidth: 320 }}>
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
          <ABtn primary onClick={() => setShowAdd(true)} disabled={busy}>+ Add Price Entry</ABtn>
        </div>
      </div>

      <div className="admin-table-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Model', 'Storage', 'Base Price (ZAR)', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600,
                  fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase',
                  letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(key => {
              const [model, storage] = key.split('|')
              const price = basePrices[key]
              const isEditing = editKey === key
              const inInventory = inventoryKeys.includes(key)
              return (
                <tr key={key} style={{ borderBottom: '1px solid var(--border)',
                  background: isEditing ? 'var(--purple-dim)' : undefined }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>
                    {model}
                    {!inInventory && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 6 }}>(no inventory)</span>}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace' }}>{storage}</td>
                  <td style={tdStyle}>
                    {isEditing ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'var(--text2)' }}>R</span>
                        <input type="number" min="0" step="100" value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          style={{ width: 120, padding: '4px 8px', fontSize: 13, fontFamily: 'DM Mono, monospace' }}
                          autoFocus />
                      </div>
                    ) : (
                      <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600,
                        color: price ? 'var(--text)' : 'var(--text3)' }}>
                        {price ? `R${price.toLocaleString('en-ZA')}` : '—'}
                      </span>
                    )}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <ABtn primary small onClick={() => saveEdit(key)} disabled={busy}>Save</ABtn>
                        <ABtn small onClick={() => setEditKey(null)} disabled={busy}>Cancel</ABtn>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <ABtn small onClick={() => { setEditKey(key); setEditVal(price || '') }} disabled={busy}>
                          {price ? 'Edit' : 'Set Price'}
                        </ABtn>
                        {price && <ABtn small danger onClick={() => deletePrice(key)} disabled={busy}>Clear</ABtn>}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text3)' }}>No price entries found</p>
        )}
      </div>

      {showAdd && (
        <Modal title="Add Price Entry" onClose={() => setShowAdd(false)} width={420}>
          <FormField label="Model Name">
            <input list="model-list" placeholder="iPhone 16 Pro" value={newEntry.model}
              onChange={e => setNewEntry(n => ({ ...n, model: e.target.value }))} />
            <datalist id="model-list">
              {allModels.map(m => <option key={m} value={m} />)}
            </datalist>
          </FormField>
          <FieldRow>
            <FormField label="Storage">
              <AdminSelectDropdown
                value={newEntry.storage}
                options={STORAGE_SELECT_OPTIONS}
                onChange={(v) => setNewEntry(n => ({ ...n, storage: v }))}
              />
            </FormField>
            <FormField label="Base Price (R)">
              <input type="number" min="0" step="100" placeholder="15499" value={newEntry.price}
                onChange={e => setNewEntry(n => ({ ...n, price: e.target.value }))} />
            </FormField>
          </FieldRow>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <ABtn onClick={() => setShowAdd(false)}>Cancel</ABtn>
            <ABtn primary onClick={addEntry}
              disabled={!newEntry.model.trim() || !newEntry.price}>
              Add Entry
            </ABtn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ─── RESELLERS TAB ────────────────────────────────────────────────────────────

function ResellersTab({ resellers, setResellers, useApi, token, reloadFromApi }) {
  const [editing, setEditing] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const blankReseller = { id: '', name: '', subtitle: '', location: '', markup: '1.05', badge: '' }
  const [form, setForm] = useState(blankReseller)
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)
  const [tabError, setTabError] = useState('')

  function openEdit(r) {
    setEditing(r.id)
    setForm({
      id: r.id,
      name: r.name,
      subtitle: r.subtitle,
      location: r.location,
      markup: String(r.markup),
      badge: r.badge || '',
    })
  }

  async function saveEdit() {
    setTabError('')
    if (useApi && token) {
      setBusy(true)
      try {
        const patch = {
          name: form.name.trim(),
          subtitle: form.subtitle.trim(),
          location: form.location.trim(),
          badge: form.badge.trim() || null,
        }
        if (editing !== 'direct') patch.markup = parseFloat(form.markup)
        await adminPatchReseller(token, editing, patch)
        await reloadFromApi()
        setEditing(null)
      } catch (e) {
        setTabError(e?.message || 'Save failed')
      } finally {
        setBusy(false)
      }
      return
    }
    setResellers(rs => rs.map(r => r.id === editing
      ? { ...r, name: form.name, subtitle: form.subtitle, location: form.location,
          markup: parseFloat(form.markup), badge: form.badge.trim() || null }
      : r
    ))
    setEditing(null)
  }

  async function addReseller() {
    setTabError('')
    if (useApi && token) {
      const id = form.id.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '') || `r_${Date.now()}`
      setBusy(true)
      try {
        await adminCreateReseller(token, {
          id,
          name: form.name.trim(),
          subtitle: form.subtitle.trim(),
          location: form.location.trim(),
          markup: parseFloat(form.markup) || 1.05,
          badge: form.badge.trim() || null,
        })
        await reloadFromApi()
        setShowAdd(false)
        setForm(blankReseller)
      } catch (e) {
        setTabError(e?.message || 'Could not create reseller')
      } finally {
        setBusy(false)
      }
      return
    }
    setResellers(rs => [...rs, {
      id: `r_${Date.now()}`,
      name: form.name.trim(),
      subtitle: form.subtitle.trim(),
      location: form.location.trim(),
      markup: parseFloat(form.markup) || 1.05,
      badge: form.badge.trim() || null,
    }])
    setShowAdd(false)
    setForm(blankReseller)
  }

  async function deleteReseller(id) {
    setTabError('')
    if (useApi && token) {
      setBusy(true)
      try {
        await adminDeleteReseller(token, id)
        await reloadFromApi()
        setConfirm(null)
      } catch (e) {
        setTabError(e?.message || 'Delete failed')
      } finally {
        setBusy(false)
      }
      return
    }
    setResellers(rs => rs.filter(r => r.id !== id))
    setConfirm(null)
  }

  const modalTitle = editing ? 'Edit Reseller' : 'Add Reseller'
  const showModal = editing !== null || showAdd
  const onModalClose = () => { setEditing(null); setShowAdd(false); setForm(blankReseller) }
  const onModalSave = editing ? saveEdit : addReseller

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 0 }}>
      <div style={{ flexShrink: 0 }}>
        {tabError && (
          <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{tabError}</p>
        )}
        <div style={{
          display: 'flex', justifyContent: 'flex-end',
          paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border)',
        }}>
          <ABtn primary onClick={() => { setForm(blankReseller); setShowAdd(true) }} disabled={busy}>
            + Add Reseller
          </ABtn>
        </div>
      </div>

      <div className="admin-table-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ display: 'grid', gap: 14 }}>
        {resellers.map((r) => (
          <div key={r.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16, flexWrap: 'wrap',
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '16px 20px',
            boxShadow: '0 1px 2px oklch(0% 0 0 / 0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: 'oklch(22% 0.02 260)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em',
              }}>
                {r.name[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                    {r.name}
                  </span>
                  {r.badge && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                      color: 'oklch(38% 0.12 145)',
                      background: 'oklch(96% 0.04 145)',
                      border: '1px solid oklch(88% 0.06 145)',
                      padding: '3px 8px', borderRadius: 6,
                    }}>
                      {r.badge}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.35 }}>{r.subtitle}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{
                textAlign: 'right', padding: '8px 14px', borderRadius: 10,
                background: 'var(--bg)', border: '1px solid var(--border)', minWidth: 72,
              }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase',
                  letterSpacing: '0.08em', marginBottom: 4 }}>Markup</p>
                <p style={{ fontFamily: 'DM Mono, monospace', fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                  {((r.markup - 1) * 100).toFixed(0)}%
                </p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <ABtn small onClick={() => openEdit(r)}>Edit</ABtn>
                {r.id !== 'direct' && (
                  <ABtn small danger onClick={() => setConfirm(r.id)}>Delete</ABtn>
                )}
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>

      {showModal && (
        <Modal title={modalTitle} onClose={onModalClose}>
          {showAdd && useApi && (
            <FormField label="ID (slug, URL-safe)">
              <input placeholder="techzone" value={form.id}
                onChange={e => setForm(f => ({ ...f, id: e.target.value }))} />
            </FormField>
          )}
          <FieldRow>
            <FormField label="Reseller Name">
              <input placeholder="TechZone Soweto" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </FormField>
            <FormField label="Location">
              <input placeholder="Soweto" value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </FormField>
          </FieldRow>
          <FormField label="Subtitle (shown to customers)">
            <input placeholder="Soweto, Gauteng" value={form.subtitle}
              onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
          </FormField>
          <FieldRow>
            <FormField label="Markup (e.g. 1.05 = +5%)">
              <input type="number" min="1" step="0.01" placeholder="1.05" value={form.markup}
                onChange={e => setForm(f => ({ ...f, markup: e.target.value }))}
                disabled={editing === 'direct'} />
            </FormField>
            <FormField label="Badge (optional)">
              <input placeholder="Best Price" value={form.badge}
                onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} />
            </FormField>
          </FieldRow>
          {form.markup && !isNaN(parseFloat(form.markup)) && (
            <p style={{ fontSize: 12, color: 'var(--purple-light)', background: 'var(--purple-dim)',
              border: '1px solid var(--purple-border)', borderRadius: 8,
              padding: '8px 12px', marginBottom: 16 }}>
              A R15 000 phone will be listed at <strong>
                R{(15000 * parseFloat(form.markup)).toLocaleString('en-ZA')}
              </strong> for this reseller
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <ABtn onClick={onModalClose} disabled={busy}>Cancel</ABtn>
            <ABtn primary onClick={onModalSave}
              disabled={!form.name.trim() || !form.markup || busy || (showAdd && useApi && !form.id.trim())}>
              {editing ? 'Save Changes' : 'Add Reseller'}
            </ABtn>
          </div>
        </Modal>
      )}

      {confirm !== null && (
        <Modal title="Remove Reseller?" onClose={() => setConfirm(null)} width={380}>
          <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24 }}>
            This reseller will no longer appear as a buying option for customers.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <ABtn onClick={() => setConfirm(null)}>Cancel</ABtn>
            <ABtn danger onClick={() => deleteReseller(confirm)} disabled={busy}>Remove</ABtn>
          </div>
        </Modal>
      )}
    </div>
  )
}

const tdStyle = { padding: '11px 12px', verticalAlign: 'middle' }

// ─── ORDERS TAB (API + JWT) ─────────────────────────────────────────────────

const ORDER_STATUSES = ['', 'pending', 'contacted', 'confirmed', 'cancelled']
const ORDER_TYPES = ['', 'reservation', 'pre-order']
const ORDER_STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...ORDER_STATUSES.filter(Boolean).map((s) => ({ value: s, label: s })),
]
const ORDER_TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All types' },
  ...ORDER_TYPES.filter(Boolean).map((s) => ({
    value: s,
    label: s === 'pre-order' ? 'Pre-order' : s === 'reservation' ? 'Reservation' : s,
  })),
]

function OrdersTab({ token }) {
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setErr('')
    try {
      const q = { page, limit: 20 }
      if (status) q.status = status
      if (type) q.type = type
      const { data, meta: m } = await adminFetchOrders(token, q)
      setRows(data)
      setMeta(m || {})
    } catch (e) {
      setErr(e?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [token, status, type, page])

  useEffect(() => { load() }, [load])

  async function patchStatus(id, next) {
    setErr('')
    try {
      await adminPatchOrderStatus(token, id, next)
      await load()
    } catch (e) {
      setErr(e?.message || 'Update failed')
    }
  }

  const total = meta.total ?? rows.length
  const limit = meta.limit ?? 20
  const maxPage = Math.max(1, Math.ceil(total / limit) || 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 0 }}>
      <div style={{ flexShrink: 0 }}>
        {err && <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 10 }}>{err}</p>}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
          paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border)',
        }}>
          <AdminSelectDropdown
            value={status}
            options={ORDER_STATUS_FILTER_OPTIONS}
            onChange={(v) => { setPage(1); setStatus(v) }}
          />
          <AdminSelectDropdown
            value={type}
            options={ORDER_TYPE_FILTER_OPTIONS}
            onChange={(v) => { setPage(1); setType(v) }}
          />
          {loading && <span style={{ fontSize: 12, color: 'var(--text3)' }}>Loading…</span>}
        </div>
      </div>
      <div className="admin-table-scroll" style={{ flex: 1, minHeight: 0, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID', 'Customer', 'Model', 'Reseller', 'Type', 'Status', 'Total', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600,
                  fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase',
                  letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              const inv = o.inventory || {}
              const res = o.reseller || {}
              const nextStatuses =
                o.status === 'pending' ? ['contacted', 'confirmed', 'cancelled']
                : o.status === 'contacted' ? ['confirmed', 'cancelled']
                : []
              return (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}><span style={{ fontFamily: 'DM Mono, monospace' }}>{o.id}</span></td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 600 }}>{o.customer_name || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{o.customer_email || ''}</div>
                  </td>
                  <td style={tdStyle}>
                    {[inv.model, inv.storage].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td style={tdStyle}>{res.name || o.reseller_id || '—'}</td>
                  <td style={tdStyle}>{o.type || '—'}</td>
                  <td style={tdStyle}><Badge color={o.status === 'cancelled' ? 'red' : o.status === 'confirmed' ? 'green' : 'amber'}>{o.status}</Badge></td>
                  <td style={{ ...tdStyle, fontFamily: 'DM Mono, monospace' }}>
                    {o.total_price != null ? formatPrice(o.total_price) : '—'}
                  </td>
                  <td style={tdStyle}>
                    {nextStatuses.length > 0 ? (
                      <AdminSelectDropdown
                        key={`${o.id}-${o.status}`}
                        value=""
                        placeholder="Update to…"
                        options={nextStatuses.map((s) => ({ value: s, label: s }))}
                        onChange={(v) => {
                          if (v) patchStatus(o.id, v)
                        }}
                        size="sm"
                      />
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {rows.length === 0 && !loading && (
          <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)' }}>No orders</p>
        )}
      </div>
      <div style={{ flexShrink: 0, display: 'flex', gap: 12, alignItems: 'center', paddingTop: 12,
        borderTop: '1px solid var(--border)' }}>
        <ABtn small disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</ABtn>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Page {meta.page ?? page} of {maxPage} · {total} total</span>
        <ABtn small disabled={page >= maxPage || loading} onClick={() => setPage((p) => p + 1)}>Next</ABtn>
      </div>
    </div>
  )
}

// ─── FLEXIPAY TAB ────────────────────────────────────────────────────────────

const STATUS_COLORS = {
  pending:  { bg: '#FEF9C3', color: '#854D0E' },
  approved: { bg: '#DCFCE7', color: '#166534' },
  rejected: { bg: '#FEE2E2', color: '#991B1B' },
}

const BLANK_NEW_APP = { full_name: '', phone: '', email: '', device_model: '' }

function FlexiPayTab({ token }) {
  const [applications, setApplications] = useState([])
  const [filter, setFilter]             = useState('pending')
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [reviewing, setReviewing]       = useState(null)
  const [notes, setNotes]               = useState('')
  const [busy, setBusy]                 = useState(false)
  const [showAddForm, setShowAddForm]   = useState(false)
  const [newApp, setNewApp]             = useState(BLANK_NEW_APP)
  const [addBusy, setAddBusy]           = useState(false)
  const [addError, setAddError]         = useState('')

  function patchNew(k, v) { setNewApp(f => ({ ...f, [k]: v })) }

  async function handleAddSubmit(e) {
    e.preventDefault()
    setAddError('')
    setAddBusy(true)
    try {
      const created = await adminCreateFlexiPayApplication(token, newApp)
      setApplications(prev => [created, ...prev])
      setNewApp(BLANK_NEW_APP)
      setShowAddForm(false)
    } catch (err) {
      setAddError(err.message || 'Failed to create application')
    } finally {
      setAddBusy(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    setError('')
    adminListFlexiPayApplications(token, filter === 'all' ? undefined : filter)
      .then(setApplications)
      .catch(e => setError(e.message || 'Failed to load applications'))
      .finally(() => setLoading(false))
  }, [token, filter])

  async function handleReview(app, action) {
    setBusy(true)
    try {
      await adminReviewFlexiPayApplication(token, app.id, { status: action, admin_notes: notes })
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: action, admin_notes: notes } : a))
      setReviewing(null)
      setNotes('')
    } catch (e) {
      setError(e.message || 'Review failed')
    } finally {
      setBusy(false)
    }
  }

  const fmt = (cents) => 'R ' + (cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 0 })

  return (
    <div style={{ padding: '24px 0', overflowY: 'auto', flex: 1 }}>
      {/* Filter pills + Add button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['pending', 'approved', 'rejected', 'all'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: filter === f ? 'var(--purple)' : 'var(--bg3)',
              color: filter === f ? '#fff' : 'var(--text2)',
            }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
        <button
          onClick={() => { setShowAddForm(v => !v); setAddError('') }}
          style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--purple)', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Application
        </button>
      </div>

      {/* Admin add form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
          <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Add FrelPay Application</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 12 }}>
            {[
              { key: 'full_name',    label: 'Full name',     type: 'text',  placeholder: 'e.g. Thandi Mokoena' },
              { key: 'phone',        label: 'Phone number',  type: 'tel',   placeholder: 'e.g. 0712345678' },
              { key: 'email',        label: 'Email address', type: 'email', placeholder: 'thandi@email.com' },
              { key: 'device_model', label: 'Device model',  type: 'text',  placeholder: 'e.g. iPhone 16 128GB' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                <input
                  required type={type} placeholder={placeholder}
                  value={newApp[key]}
                  onChange={e => patchNew(key, e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
            ))}
          </div>
          {addError && <p style={{ fontSize: 13, color: '#EF4444', marginBottom: 10 }}>{addError}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowAddForm(false); setNewApp(BLANK_NEW_APP) }} style={{ padding: '8px 18px', borderRadius: 8, border: '1.5px solid #D1D5DB', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={addBusy} style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--purple)', color: '#fff', fontSize: 13, fontWeight: 700, border: 'none', cursor: addBusy ? 'not-allowed' : 'pointer' }}>
              {addBusy ? 'Saving…' : 'Save Application'}
            </button>
          </div>
        </form>
      )}

      {error && <p style={{ color: '#EF4444', fontSize: 13, marginBottom: 12 }}>{error}</p>}
      {loading ? (
        <p style={{ color: 'var(--text3)', fontSize: 14 }}>Loading…</p>
      ) : applications.length === 0 ? (
        <p style={{ color: 'var(--text3)', fontSize: 14 }}>No {filter !== 'all' ? filter : ''} applications.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {applications.map(app => {
            const col = STATUS_COLORS[app.status] || STATUS_COLORS.pending
            return (
              <div key={app.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', margin: 0 }}>{app.full_name}</p>
                      <span style={{ background: col.bg, color: col.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {app.status}
                      </span>
                      {app.created_by_admin && (
                        <span style={{ background: '#EEF2FF', color: '#4338CA', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999 }}>via admin</span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '4px 16px', fontSize: 13, color: 'var(--text2)' }}>
                      <span><strong>Email:</strong> {app.email}</span>
                      <span><strong>Phone:</strong> {app.phone}</span>
                      <span><strong>Device:</strong> {app.device_model}</span>
                      <span><strong>Applied:</strong> {new Date(app.created_at).toLocaleDateString('en-ZA')}</span>
                    </div>
                    {app.admin_notes && (
                      <p style={{ marginTop: 8, fontSize: 12, color: 'var(--text3)', background: 'var(--bg3)', borderRadius: 6, padding: '6px 10px', borderLeft: '3px solid var(--border)' }}>
                        <strong>Notes:</strong> {app.admin_notes}
                      </p>
                    )}
                  </div>
                  {app.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => { setReviewing({ app, action: 'approved' }); setNotes('') }} style={{ padding: '8px 16px', borderRadius: 8, background: '#DCFCE7', color: '#166534', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>Approve</button>
                      <button onClick={() => { setReviewing({ app, action: 'rejected' }); setNotes('') }} style={{ padding: '8px 16px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Review confirm modal */}
      {reviewing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 'min(460px,100%)', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontWeight: 800, fontSize: 17, marginBottom: 8 }}>
              {reviewing.action === 'approved' ? '✅ Approve' : '❌ Reject'} FlexiPay — {reviewing.app.full_name}
            </h3>
            <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
              {reviewing.action === 'approved'
                ? 'The customer will receive a confirmation email and FlexiPay will be unlocked at checkout.'
                : 'The customer will be notified by email.'}
            </p>
            <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 6 }}>Admin notes (optional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={reviewing.action === 'rejected' ? 'Reason shown to customer…' : 'Internal notes…'}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #D1D5DB', fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setReviewing(null)} disabled={busy} style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
              <button
                onClick={() => handleReview(reviewing.app, reviewing.action)}
                disabled={busy}
                style={{ padding: '10px 20px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
                  background: reviewing.action === 'approved' ? '#16A34A' : '#DC2626', color: '#fff' }}
              >
                {busy ? 'Saving…' : (reviewing.action === 'approved' ? 'Confirm Approval' : 'Confirm Rejection')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SETTINGS TAB ────────────────────────────────────────────────────────────

function SettingsTab({ token }) {
  const base = getApiBaseUrl()
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetch(`${base}/api/announcement-bar`)
      .then(r => r.json())
      .then(j => { setEnabled(j.data?.enabled ?? false); setMessage(j.data?.message ?? '') })
      .catch(() => setErr('Failed to load settings'))
      .finally(() => setLoading(false))
  }, [base])

  async function handleSave(e) {
    e.preventDefault()
    if (!message.trim()) { setErr('Message cannot be empty'); return }
    setSaving(true); setErr(''); setSaved(false)
    try {
      const res = await fetch(`${base}/api/admin/announcement-bar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled, message }),
      })
      if (!res.ok) { const j = await res.json(); throw new Error(j.error || 'Save failed') }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 13px', borderRadius: 10,
    border: '1.5px solid var(--border)', background: 'var(--bg2)',
    fontSize: 14, color: 'var(--text)', fontFamily: 'DM Sans, sans-serif',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '28px 32px', overflowY: 'auto', flex: 1 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 24 }}>Settings</h2>

      {loading ? (
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>Loading…</p>
      ) : (
        <form onSubmit={handleSave} style={{ maxWidth: 520 }}>
          {/* Announcement bar card */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 14, padding: '22px 24px', marginBottom: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>Announcement Bar</p>
                <p style={{ fontSize: 13, color: 'var(--text2)' }}>Shown at the top of the storefront.</p>
              </div>
              {/* Toggle */}
              <button
                type="button"
                onClick={() => setEnabled(v => !v)}
                style={{
                  width: 44, height: 24, borderRadius: 999, position: 'relative',
                  background: enabled ? 'var(--purple)' : 'var(--border)',
                  border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: enabled ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>

            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', display: 'block', marginBottom: 6 }}>
              Message
            </label>
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="e.g. Free delivery on all orders this weekend!"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'var(--purple)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {err && <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{err}</p>}

          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 24px', borderRadius: 10,
              background: saved ? '#16A34A' : 'var(--purple)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer', border: 'none',
              opacity: saving ? 0.7 : 1, transition: 'background 0.2s',
            }}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save changes'}
          </button>
        </form>
      )}
    </div>
  )
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const TABS = [
  { id: 'orders',    label: 'Orders',    iconSrc: iconChecklist },
  { id: 'inventory', label: 'Inventory', iconSrc: iconAvailable },
  { id: 'pricing',   label: 'Pricing',   iconSrc: iconPriceTag },
  { id: 'resellers', label: 'Resellers', iconSrc: iconReseller },
  { id: 'flexipay',  label: 'FlexiPay',  iconEl: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
      </svg>
  )},
  { id: 'settings',  label: 'Settings',  iconEl: <SettingsIcon /> },
]

const adminNavTabBtnStyle = (active) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid transparent',
  cursor: 'pointer',
  fontFamily: 'DM Sans, sans-serif',
  fontWeight: active ? 700 : 500,
  fontSize: 14,
  textAlign: 'left',
  width: '100%',
  transition: 'background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s',
  background: active ? '#fff' : 'transparent',
  color: active ? 'var(--text)' : 'var(--text2)',
  boxShadow: active ? '0 1px 2px oklch(0% 0 0 / 0.06)' : 'none',
  borderColor: active ? 'var(--border)' : 'transparent',
})

function AdminTabNavButtons({ tab, setTab, useApi, onAfterNavigate }) {
  return TABS.filter((t) => t.id !== 'orders' || useApi).map((t) => {
    const active = tab === t.id
    return (
      <button
        key={t.id}
        type="button"
        className="admin-nav-tab"
        onClick={() => {
          setTab(t.id)
          onAfterNavigate?.()
        }}
        style={adminNavTabBtnStyle(active)}
      >
        <span style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: active ? 'var(--purple-dim)' : 'var(--bg3)',
          opacity: active ? 1 : 0.95,
        }}
        >
          {t.iconEl
            ? <span style={{ color: active ? 'var(--purple)' : 'var(--text2)', display: 'flex' }}>{t.iconEl}</span>
            : <img src={t.iconSrc} alt="" width={20} height={20} decoding="async" style={{ objectFit: 'contain', display: 'block' }} />
          }
        </span>
        {t.label}
      </button>
    )
  })
}

function AdminInventoryStats({ inventory, resellers }) {
  const sumQty = (status) => inventory
    .filter((i) => i.status === status)
    .reduce((acc, i) => acc + (Number(i.qty) || 0), 0)
  const inStockUnits = sumQty('in-stock')
  const lowStockUnits = sumQty('low-stock')
  const soldOutVariants = inventory.filter((i) => i.status === 'sold-out').length
  return (
    <div style={{ fontSize: 11, color: 'var(--text3)', padding: '0 14px', lineHeight: 1.6 }}>
      <p style={{ fontWeight: 600, marginBottom: 4 }}>Inventory</p>
      <p>{inStockUnits} in stock</p>
      <p>{lowStockUnits} low stock</p>
      <p>{soldOutVariants} sold out</p>
      <p style={{ marginTop: 8, fontWeight: 600 }}>{resellers.length} resellers</p>
    </div>
  )
}

function AdminPanel({
  inventory, setInventory, basePrices, setBasePrices, resellers, setResellers,
  onExit, onSignOut, useApi, token, reloadFromApi,
}) {
  const [tab, setTab] = useState(useApi ? 'orders' : 'inventory')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), [])

  useEffect(() => {
    if (useApi && token) reloadFromApi()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync admin view on mount / token
  }, [useApi, token])

  useEffect(() => {
    if (!mobileMenuOpen) return
    function onKey(e) {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileMenuOpen])

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 768 && mobileMenuOpen) setMobileMenuOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [mobileMenuOpen])

  return (
    <div className="admin-shell" style={{
      height: '100vh',
      maxHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <header className="admin-header" style={{ background: '#fff', borderBottom: '1px solid var(--border)',
        padding: '0 24px', height: 60, flexShrink: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 12, zIndex: 50 }}>
        <div className="admin-header-brand" style={{ display: 'flex', alignItems: 'center', color: 'var(--text)', minWidth: 0 }}>
          <ConnectLogo height={32} />
        </div>
        <button
          type="button"
          className="admin-menu-toggle"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((o) => !o)}
        >
          {mobileMenuOpen ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <div className="admin-header-actions admin-header-actions--desktop" style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {useApi && onSignOut && (
            <ABtn onClick={onSignOut}>Sign out</ABtn>
          )}
          <ABtn onClick={onExit}>← Back to Store</ABtn>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="admin-mobile-drawer" role="presentation">
          <button
            type="button"
            className="admin-drawer-backdrop"
            aria-label="Close menu"
            onClick={closeMobileMenu}
          />
          <div
            className="admin-drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
          >
            <nav className="admin-drawer-nav" aria-label="Admin sections">
              <AdminTabNavButtons tab={tab} setTab={setTab} useApi={useApi} onAfterNavigate={closeMobileMenu} />
            </nav>
            <div className="admin-drawer-actions">
              {useApi && onSignOut && (
                <ABtn full onClick={() => { onSignOut(); closeMobileMenu(); }}>Sign out</ABtn>
              )}
              <ABtn full onClick={() => { onExit(); closeMobileMenu(); }}>← Back to Store</ABtn>
            </div>
            <div className="admin-drawer-stats">
              <AdminInventoryStats inventory={inventory} resellers={resellers} />
            </div>
          </div>
        </div>
      )}

      <div className="admin-layout" style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Sidebar — desktop only; mobile uses hamburger drawer */}
        <aside className="admin-sidebar" style={{
          width: 232, background: '#fff', borderRight: '1px solid var(--border)',
          padding: '16px 10px', flexShrink: 0, display: 'flex', flexDirection: 'column',
          alignSelf: 'stretch', minHeight: 0,
        }}>
          <div className="admin-sidebar-nav">
            <AdminTabNavButtons tab={tab} setTab={setTab} useApi={useApi} />
          </div>

          <div className="admin-sidebar-stats" style={{ marginTop: 'auto', paddingTop: 24, borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <AdminInventoryStats inventory={inventory} resellers={resellers} />
          </div>
        </aside>

        {/* Main content — title fixed; tab body fills height and scrolls internally where needed */}
        <main className="admin-main" style={{
          flex: 1, minWidth: 0, minHeight: 0, padding: '32px 28px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          background: '#fff',
        }}>
          <div style={{ flexShrink: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>
              {TABS.find(t => t.id === tab)?.label}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16 }}>
              {tab === 'orders'    && 'Frelzon Connect orders from the FoodLoop API.'}
              {tab === 'inventory' && 'Manage stock levels, availability, and restock estimates.'}
              {tab === 'pricing'   && 'Set base prices for each model and storage variant.'}
              {tab === 'resellers' && 'Manage your reseller network and their markup rates.'}
              {tab === 'settings'  && 'Control storefront appearance and announcements.'}
              {tab === 'flexipay'  && 'Review and approve customer FlexiPay applications.'}
            </p>
          </div>

          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {tab === 'orders' && useApi && (
              <OrdersTab token={token} />
            )}
            {tab === 'inventory' && (
              <InventoryTab
                inventory={inventory} setInventory={setInventory} basePrices={basePrices}
                useApi={useApi} token={token} reloadFromApi={reloadFromApi}
              />
            )}
            {tab === 'pricing' && (
              <PricingTab
                inventory={inventory} basePrices={basePrices} setBasePrices={setBasePrices}
                useApi={useApi} token={token} reloadFromApi={reloadFromApi}
              />
            )}
            {tab === 'resellers' && (
              <ResellersTab
                resellers={resellers} setResellers={setResellers}
                useApi={useApi} token={token} reloadFromApi={reloadFromApi}
              />
            )}
            {tab === 'flexipay' && (
              <FlexiPayTab token={token} />
            )}
            {tab === 'settings' && (
              <SettingsTab token={token} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function Admin({
  useApi,
  refreshCatalog,
  inventory, setInventory, basePrices, setBasePrices, resellers, setResellers, onExit,
}) {
  const [jwt, setJwt] = useState(() => getStoredAdminJwt())

  const reloadFromApi = useCallback(async () => {
    if (!useApi || !getStoredAdminJwt()) return
    const token = getStoredAdminJwt()
    const [inv, prices, resList] = await Promise.all([
      adminFetchInventory(token),
      fetchPricesPublic(),
      adminFetchResellers(token),
    ])
    setInventory(inv)
    setBasePrices(prices)
    setResellers(resList)
    refreshCatalog?.()
  }, [useApi, setInventory, setBasePrices, setResellers, refreshCatalog])

  function handleApiAuthSuccess(t) {
    setJwt(t)
  }

  function handleApiSignOut() {
    clearAdminAuthSession()
    setJwt('')
  }

  if (!useApi) {
    return <AdminRequiresApi onExit={onExit} />
  }

  if (!jwt) return <ApiAdminLogin onSuccess={handleApiAuthSuccess} />
  return (
    <AdminPanel
      inventory={inventory} setInventory={setInventory}
      basePrices={basePrices} setBasePrices={setBasePrices}
      resellers={resellers} setResellers={setResellers}
      onExit={onExit}
      onSignOut={handleApiSignOut}
      useApi={useApi}
      token={jwt}
      reloadFromApi={reloadFromApi}
    />
  )
}
