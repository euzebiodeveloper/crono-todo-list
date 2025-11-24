import React from 'react'

export default function TodoItem({ todo, onToggle, onDelete }) {
  return (
    <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input type="checkbox" checked={todo.completed} onChange={() => onToggle(todo._id)} />
      <span style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>{todo.title}</span>
      <button onClick={() => onDelete(todo._id)}>Apagar</button>
    </li>
  )
}
