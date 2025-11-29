const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

// Auth endpoints
export async function registerUser(payload) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res.json()
}

export async function loginUser(payload) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res.json()
}

// Authentication helpers: store token with expiry and read/clear safely
export function setAuthToken(token, remember = false) {
  try {
    localStorage.setItem('token', token)
    const now = Date.now()
    const ttl = remember ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // ms
    const expiresAt = now + ttl
    localStorage.setItem('token_expires', String(expiresAt))
  } catch (_) {}
}

export function clearAuthToken() {
  try {
    localStorage.removeItem('token')
    localStorage.removeItem('token_expires')
  } catch (_) {}
}

export function getAuthToken() {
  try {
    const token = localStorage.getItem('token')
    const raw = localStorage.getItem('token_expires')
    if (!token || !raw) return null
    const exp = parseInt(raw, 10)
    if (isNaN(exp)) {
      clearAuthToken()
      return null
    }
    if (Date.now() > exp) {
      // expired — clear storage
      clearAuthToken()
      return null
    }
    return token
  } catch (_) { return null }
}

export function getAuthExpiry() {
  try {
    const raw = localStorage.getItem('token_expires')
    if (!raw) return null
    const exp = parseInt(raw, 10)
    if (isNaN(exp)) return null
    return exp
  } catch (_) { return null }
}

export async function getMe() {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function resetPassword(payload) {
  const token = getAuthToken()
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  return res.json()
}

export async function fetchTodos() {
  const token = getAuthToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${API_BASE}/todos`, { headers })
  return res.json()
}

export async function fetchCompletedActivities() {
  const token = getAuthToken()
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  const res = await fetch(`${API_BASE}/todos/completed`, { headers })
  return res.json()
}

export async function createTodo(payload) {
  const token = getAuthToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  })
  return res
}

export async function updateTodo(id, payload) {
  const token = getAuthToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(payload)
  })
  return res
}

export async function deleteTodo(id) {
  const token = getAuthToken()
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE', headers })
  return res
}
