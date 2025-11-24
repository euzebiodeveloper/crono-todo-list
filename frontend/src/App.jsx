import React, { useEffect, useState } from 'react'
import { fetchTodos, createTodo, toggleTodo, deleteTodo } from './api'
import TodoList from './components/TodoList'

export default function App() {
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    fetchTodos().then(setTodos)
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    if (!title.trim()) return
    const t = await createTodo({ title })
    setTodos([t, ...todos])
    setTitle('')
  }

  async function handleToggle(id) {
    const updated = await toggleTodo(id)
    setTodos(todos.map(t => t._id === id ? updated : t))
  }

  async function handleDelete(id) {
    await deleteTodo(id)
    setTodos(todos.filter(t => t._id !== id))
  }

  return (
    <div className="app">
      <h1>Crono Todo List</h1>
      <form onSubmit={handleAdd}>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nova tarefa" />
        <button type="submit">Adicionar</button>
      </form>

      <TodoList todos={todos} onToggle={handleToggle} onDelete={handleDelete} />
    </div>
  )
}
