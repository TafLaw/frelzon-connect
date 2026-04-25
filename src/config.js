/** FoodLoop API origin — no trailing slash (e.g. http://localhost:3000). */
export function getApiBaseUrl() {
  const raw = import.meta.env.VITE_API_BASE_URL
  if (raw == null || String(raw).trim() === '') return ''
  return String(raw).trim().replace(/\/+$/, '')
}

export function isApiMode() {
  return Boolean(getApiBaseUrl())
}
