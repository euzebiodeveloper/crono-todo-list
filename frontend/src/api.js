const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'

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
  return res.json()
}

export async function toggleTodo(id) {
  const res = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  return res.json()
}

export async function deleteTodo(id) {
  await fetch(`${API_BASE}/todos/${id}`, { method: 'DELETE' })
}
