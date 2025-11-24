import React from 'react'
import TodoItem from './TodoItem'

export default function TodoList({ todos, onToggle, onDelete }) {
  if (!todos || todos.length === 0) return <p>Sem tarefas ainda.</p>
  return (
    <ul>
      {todos.map(t => (
        <TodoItem key={t._id} todo={t} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </ul>
  )
}
