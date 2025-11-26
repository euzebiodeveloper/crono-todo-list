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

// If you later want todo endpoints again, restore functions here.
// If you later want todo endpoints again, restore functions here.

export async function getMe() {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.json()
}

export async function resetPassword(payload) {
  const token = localStorage.getItem('token')
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  return res.json()
}

export async function fetchTodos() {
  const res = await fetch(`${API_BASE}/todos`)
  return res.json()
}

export async function createTodo(payload) {
  const res = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res
}

export async function updateTodo(id, payload) {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  return res
}

export async function deleteTodo(id) {
  const res = await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' })
  return res
}
