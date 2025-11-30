import React from 'react'

export default function TodoItem({ todo, onToggle, onDelete }) {
  const checkboxId = `checkbox-${todo._id}`

  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px' }}>
      {/* Lixeira no lugar da posição antiga do checkbox */}
      <button
        onClick={() => onDelete(todo._id)}
        aria-label={`Apagar ${todo.title}`}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
        }}
      >
        {/* ícone de lixeira (SVG) */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Checkbox junto ao título */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
        <input
          id={checkboxId}
          type="checkbox"
          checked={!!todo.completed}
          onChange={() => onToggle(todo._id)}
          aria-label={`Marcar ${todo.title} como concluída`}
        />
        <label htmlFor={checkboxId} style={{ cursor: 'pointer', flex: 1, margin: 0, textDecoration: todo.completed ? 'line-through' : 'none' }}>
          {todo.title}
        </label>
      </div>

    </li>
  )
}
