import { getApiBaseUrl } from './config.js'

const ADMIN_JWT_KEY = 'fc_admin_jwt'
const ADMIN_REFRESH_KEY = 'fc_admin_refresh'

export function getStoredAdminJwt() {
  try {
    return sessionStorage.getItem(ADMIN_JWT_KEY) || ''
  } catch {
    return ''
  }
}

export function getStoredAdminRefreshToken() {
  try {
    return sessionStorage.getItem(ADMIN_REFRESH_KEY) || ''
  } catch {
    return ''
  }
}

export function clearAdminAuthSession() {
  try {
    sessionStorage.removeItem(ADMIN_JWT_KEY)
    sessionStorage.removeItem(ADMIN_REFRESH_KEY)
  } catch {
    /* ignore */
  }
}

/** Persist access + optional refresh from Frelzon Connect admin login. */
export function setAdminAuthTokens(accessToken, refreshToken) {
  try {
    if (accessToken) sessionStorage.setItem(ADMIN_JWT_KEY, accessToken)
    else sessionStorage.removeItem(ADMIN_JWT_KEY)
    if (refreshToken != null && String(refreshToken).trim() !== '') {
      sessionStorage.setItem(ADMIN_REFRESH_KEY, String(refreshToken).trim())
    } else {
      sessionStorage.removeItem(ADMIN_REFRESH_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function setStoredAdminJwt(token) {
  try {
    if (token) {
      sessionStorage.setItem(ADMIN_JWT_KEY, token)
      sessionStorage.removeItem(ADMIN_REFRESH_KEY)
    } else {
      clearAdminAuthSession()
    }
  } catch {
    /* ignore */
  }
}

function joinUrl(base, path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

/** Extract human-readable error from FoodLoop / Frelzon JSON or status text. */
export async function readApiErrorMessage(res, body) {
  if (body && typeof body === 'object') {
    if (typeof body.error === 'string') return body.error
    if (body.success === false && typeof body.message === 'string') return body.message
    if (typeof body.message === 'string') return body.message
  }
  try {
    const t = await res.clone().text()
    if (t) return t.slice(0, 200)
  } catch {
    /* ignore */
  }
  return res.statusText || `HTTP ${res.status}`
}

export async function apiRequest(path, options = {}) {
  const base = getApiBaseUrl()
  if (!base) throw new Error('VITE_API_BASE_URL is not set')

  const { method = 'GET', body, token, headers: extraHeaders, ...rest } = options
  const headers = { ...extraHeaders }
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(joinUrl(base, path), {
    method,
    headers,
    body: body !== undefined && !(body instanceof FormData) ? JSON.stringify(body) : body,
    ...rest,
  })

  const ct = res.headers.get('content-type') || ''
  const isJson = ct.includes('application/json')
  let json = null
  if (isJson) {
    try {
      json = await res.json()
    } catch {
      json = null
    }
  }

  return { res, json }
}

export async function apiJson(path, options = {}) {
  const { res, json } = await apiRequest(path, options)
  if (res.ok) {
    if (json == null && res.status === 204) return {}
    return json ?? {}
  }
  const msg = await readApiErrorMessage(res, json)
  const err = new Error(msg)
  err.status = res.status
  err.body = json
  throw err
}

/**
 * POST /frelzon-connect/admin/login — same credentials as /api/auth/login;
 * 403 if the user does not have the admin role.
 */
export async function freizonConnectAdminLogin(email, password) {
  const { res, json } = await apiRequest('/api/frelzon-connect/admin/login', {
    method: 'POST',
    body: { email: String(email).trim(), password: String(password) },
  })
  if (res.ok && json?.data?.token) {
    return {
      token: json.data.token,
      refresh_token: json.data.refresh_token ?? null,
      user: json.data.user ?? null,
    }
  }
  let msg = await readApiErrorMessage(res, json)
  if (res.status === 403 && (!msg || msg === 'Forbidden')) {
    msg = 'This account does not have admin access (403).'
  }
  const err = new Error(msg)
  err.status = res.status
  err.body = json
  throw err
}

/** Public inventory row → app shape (camelCase). */
export function normalizeInventoryRow(row) {
  if (!row) return row
  return {
    id: row.id,
    series: row.series,
    model: row.model,
    storage: row.storage,
    status: row.status,
    qty: row.qty,
    restockIn: row.restock_in ?? row.restockIn ?? null,
    imageUrl: row.image_url ?? row.imageUrl ?? null,
    rating: row.rating ?? null,
    reviewCount: row.review_count ?? row.reviewCount ?? 0,
    compareAtPrice: row.compare_at_price ?? row.compareAtPrice ?? null,
    isNew: row.is_new ?? row.isNew ?? false,
    inTheBox: row.in_the_box ?? row.inTheBox ?? null,
    colors: Array.isArray(row.colors) && row.colors.length > 0
      ? row.colors
      : (row.color || row.color_hex || row.colorHex)
        ? [{ name: row.color || '', hex: row.color_hex || row.colorHex || '#000000' }]
        : null,
    color: row.color ?? null,
    colorHex: row.color_hex ?? row.colorHex ?? null,
    condition: row.condition ?? null,
    warranty: row.warranty ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export function pricesArrayToMap(rows) {
  const map = {}
  if (!Array.isArray(rows)) return map
  for (const r of rows) {
    if (r?.model && r?.storage != null && r.price != null) {
      map[`${r.model}|${r.storage}`] = Number(r.price)
    }
  }
  return map
}

// ─── Public API ─────────────────────────────────────────────────────────────

export async function fetchInventoryList(params = {}) {
  const q = new URLSearchParams()
  if (params.series && params.series !== 'All') q.set('series', params.series)
  if (params.status && params.status !== 'All') {
    const apiStatus =
      params.status === 'In Stock' ? 'in-stock'
      : params.status === 'Low Stock' ? 'low-stock'
      : params.status === 'Sold Out' ? 'sold-out'
      : null
    if (apiStatus) q.set('status', apiStatus)
  }
  if (params.search?.trim()) q.set('search', params.search.trim())
  const qs = q.toString()
  const path = `/api/inventory${qs ? `?${qs}` : ''}`
  const json = await apiJson(path)
  const data = Array.isArray(json?.data) ? json.data.map(normalizeInventoryRow) : []
  const meta = json?.meta && typeof json.meta === 'object' ? json.meta : {}
  return { data, meta }
}

export async function fetchInventoryById(id) {
  const json = await apiJson(`/api/inventory/${encodeURIComponent(id)}`)
  return normalizeInventoryRow(json?.data)
}

export async function fetchResellersPublic() {
  const json = await apiJson('/api/resellers')
  const data = Array.isArray(json?.data) ? json.data : []
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    subtitle: r.subtitle,
    location: r.location,
    markup: typeof r.markup === 'number' ? r.markup : parseFloat(r.markup) || 1,
    badge: r.badge ?? null,
  }))
}

export async function fetchPricesPublic() {
  const json = await apiJson('/api/prices')
  return pricesArrayToMap(json?.data)
}

export async function createFrelzonOrder(payload) {
  const { res, json } = await apiRequest('/api/orders', {
    method: 'POST',
    body: payload,
  })
  if (res.status === 201 && json?.data) return json.data
  const msg = await readApiErrorMessage(res, json)
  const err = new Error(msg)
  err.status = res.status
  err.body = json
  throw err
}

// ─── Admin API ──────────────────────────────────────────────────────────────

export async function adminFetchInventory(token) {
  const json = await apiJson('/api/admin/inventory', { token })
  const data = Array.isArray(json?.data) ? json.data.map(normalizeInventoryRow) : []
  return data
}

export async function adminCreateInventory(token, body) {
  const restRaw = body.restockIn ?? body.restock_in ?? ''
  const rest = typeof restRaw === 'string' ? restRaw.trim() : restRaw
  const imgRaw = body.imageUrl ?? body.image_url ?? ''
  const img = typeof imgRaw === 'string' ? imgRaw.trim() : imgRaw
  const imageFile = body.imageFile instanceof File ? body.imageFile : null

  const rating = body.rating != null && body.rating !== '' ? Number(body.rating) : null
  const reviewCount = body.reviewCount != null && body.reviewCount !== '' ? Number(body.reviewCount) : 0
  const compareAtPrice = body.compareAtPrice != null && body.compareAtPrice !== '' ? Number(body.compareAtPrice) : null
  const isNew = body.isNew ?? false
  const inTheBox = Array.isArray(body.inTheBox) && body.inTheBox.length > 0 ? body.inTheBox : null

  let payload
  if (imageFile) {
    payload = new FormData()
    payload.append('series', String(body.series ?? ''))
    payload.append('model', String(body.model ?? ''))
    payload.append('storage', String(body.storage ?? ''))
    payload.append('status', String(body.status ?? ''))
    payload.append('qty', String(Number(body.qty) || 0))
    if (rest != null && rest !== '') payload.append('restock_in', String(rest))
    if (img != null && img !== '') payload.append('image_url', String(img))
    if (rating != null) payload.append('rating', String(rating))
    payload.append('review_count', String(reviewCount))
    if (compareAtPrice != null) payload.append('compare_at_price', String(compareAtPrice))
    payload.append('is_new', String(isNew))
    if (inTheBox) payload.append('in_the_box', JSON.stringify(inTheBox))
    if (Array.isArray(body.colors) && body.colors.length > 0) payload.append('colors', JSON.stringify(body.colors))
    if (body.condition) payload.append('condition', String(body.condition))
    if (body.warranty) payload.append('warranty', String(body.warranty))
    payload.append('image', imageFile)
  } else {
    payload = {
      series: body.series,
      model: body.model,
      storage: body.storage,
      status: body.status,
      qty: Number(body.qty) || 0,
      restock_in: rest || null,
      image_url: img || null,
      rating,
      review_count: reviewCount,
      compare_at_price: compareAtPrice,
      is_new: isNew,
      in_the_box: inTheBox,
      colors: Array.isArray(body.colors) && body.colors.length > 0 ? body.colors : null,
      condition: body.condition || null,
      warranty: body.warranty || null,
    }
  }

  const json = await apiJson('/api/admin/inventory', { method: 'POST', token, body: payload })
  return normalizeInventoryRow(json?.data)
}

export async function adminPatchInventory(token, id, partial) {
  const imageFile = partial.imageFile instanceof File ? partial.imageFile : null
  const patch = {}
  if (partial.status != null) patch.status = partial.status
  if (partial.qty != null) patch.qty = Number(partial.qty)
  if (partial.restockIn !== undefined) {
    const r = partial.restockIn
    patch.restock_in = typeof r === 'string' ? (r.trim() || null) : r
  }
  if (partial.imageUrl !== undefined) {
    const u = partial.imageUrl
    patch.image_url = typeof u === 'string' ? (u.trim() || null) : u
  }
  if (partial.rating !== undefined) patch.rating = partial.rating != null && partial.rating !== '' ? Number(partial.rating) : null
  if (partial.reviewCount !== undefined) patch.review_count = Number(partial.reviewCount) || 0
  if (partial.compareAtPrice !== undefined) patch.compare_at_price = partial.compareAtPrice != null && partial.compareAtPrice !== '' ? Number(partial.compareAtPrice) : null
  if (partial.isNew !== undefined) patch.is_new = Boolean(partial.isNew)
  if (partial.inTheBox !== undefined) patch.in_the_box = Array.isArray(partial.inTheBox) && partial.inTheBox.length > 0 ? partial.inTheBox : null
  if (partial.colors !== undefined) patch.colors = Array.isArray(partial.colors) && partial.colors.length > 0 ? partial.colors : null
  if (partial.condition !== undefined) patch.condition = partial.condition || null
  if (partial.warranty !== undefined) patch.warranty = partial.warranty || null

  let body = patch
  if (imageFile) {
    const form = new FormData()
    Object.entries(patch).forEach(([key, value]) => {
      if (key === 'in_the_box' || key === 'colors') {
        if (value != null) form.append(key, JSON.stringify(value))
      } else if (value !== undefined && value !== null && value !== '') {
        form.append(key, String(value))
      } else if (value === null) {
        form.append(key, '')
      }
    })
    form.append('image', imageFile)
    body = form
  }

  const json = await apiJson(`/api/admin/inventory/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body,
  })
  if (json?.data) return normalizeInventoryRow(json.data)
  return null
}

export async function adminDeleteInventory(token, id) {
  const { res } = await apiRequest(`/api/admin/inventory/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
  if (res.status === 204 || res.status === 404) return
  let json = null
  try {
    json = await res.json()
  } catch {
    /* ignore */
  }
  const msg = await readApiErrorMessage(res, json)
  const err = new Error(msg)
  err.status = res.status
  err.body = json
  throw err
}

export async function adminPutPricesBulk(token, rows) {
  const body = rows.map((r) => ({ model: r.model, storage: r.storage, price: r.price }))
  const json = await apiJson('/api/admin/prices', { method: 'PUT', token, body })
  return pricesArrayToMap(json?.data)
}

export async function adminPatchPrice(token, model, storage, price) {
  const m = encodeURIComponent(model)
  const s = encodeURIComponent(storage)
  const json = await apiJson(`/api/admin/prices/${m}/${s}`, {
    method: 'PATCH',
    token,
    body: { price: Number(price) },
  })
  const d = json?.data
  if (d?.model && d?.storage != null) return { key: `${d.model}|${d.storage}`, price: Number(d.price) }
  return null
}

export async function adminDeletePrice(token, model, storage) {
  const m = encodeURIComponent(model)
  const s = encodeURIComponent(storage)
  const { res } = await apiRequest(`/api/admin/prices/${m}/${s}`, { method: 'DELETE', token })
  if (res.status === 204 || res.status === 404) return
  let json = null
  try {
    json = await res.json()
  } catch {
    /* ignore */
  }
  const msg = await readApiErrorMessage(res, json)
  const err = new Error(msg)
  err.status = res.status
  err.body = json
  throw err
}

export async function adminFetchResellers(token) {
  const json = await apiJson('/api/admin/resellers', { token })
  const data = Array.isArray(json?.data) ? json.data : []
  return data.map((r) => ({
    id: r.id,
    name: r.name,
    subtitle: r.subtitle,
    location: r.location,
    markup: typeof r.markup === 'number' ? r.markup : parseFloat(r.markup) || 1,
    badge: r.badge ?? null,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }))
}

export async function adminCreateReseller(token, body) {
  const payload = {
    id: body.id,
    name: body.name,
    subtitle: body.subtitle,
    markup: Number(body.markup),
    badge: body.badge || undefined,
    location: body.location,
  }
  const json = await apiJson('/api/admin/resellers', { method: 'POST', token, body: payload })
  const r = json?.data
  return {
    id: r.id,
    name: r.name,
    subtitle: r.subtitle,
    location: r.location,
    markup: typeof r.markup === 'number' ? r.markup : parseFloat(r.markup),
    badge: r.badge ?? null,
  }
}

export async function adminPatchReseller(token, id, partial) {
  const json = await apiJson(`/api/admin/resellers/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    token,
    body: partial,
  })
  const r = json?.data
  return {
    id: r.id,
    name: r.name,
    subtitle: r.subtitle,
    location: r.location,
    markup: typeof r.markup === 'number' ? r.markup : parseFloat(r.markup),
    badge: r.badge ?? null,
  }
}

export async function adminDeleteReseller(token, id) {
  const { res } = await apiRequest(`/api/admin/resellers/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
  })
  if (res.status === 204 || res.status === 404) return
  let json = null
  try {
    json = await res.json()
  } catch {
    /* ignore */
  }
  const msg = await readApiErrorMessage(res, json)
  const err = new Error(msg)
  err.status = res.status
  err.body = json
  throw err
}

export async function adminFetchOrders(token, params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.type) q.set('type', params.type)
  if (params.reseller_id) q.set('reseller_id', params.reseller_id)
  q.set('page', String(params.page ?? 1))
  q.set('limit', String(params.limit ?? 20))
  const qs = q.toString()
  const json = await apiJson(`/api/admin/orders?${qs}`, { token })
  return {
    data: Array.isArray(json?.data) ? json.data : [],
    meta: json?.meta && typeof json.meta === 'object' ? json.meta : {},
  }
}

export async function adminPatchOrderStatus(token, orderId, status) {
  const json = await apiJson(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    token,
    body: { status },
  })
  return json?.data
}
