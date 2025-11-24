import React, { useState } from 'react'
import { registerUser } from '../api'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    try {
      const res = await registerUser({ name, email, password })
      if (res.user) {
        setMessage('Cadastro realizado com sucesso')
      } else if (res.error) {
        setMessage(res.error)
      } else {
        setMessage('Resposta inesperada do servidor')
      }
    } catch (err) {
      setMessage('Erro na requisição')
    }
  }

  return (
    <div>
      <h2>Registrar</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
        <input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
        <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="senha" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Criar conta</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}
