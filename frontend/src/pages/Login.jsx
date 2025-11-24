import React, { useState } from 'react'
import { loginUser } from '../api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    try {
      const res = await loginUser({ email, password })
      if (res.token) {
        setMessage('Login realizado com sucesso')
        // salvar token (exemplo): localStorage.setItem('token', res.token)
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
      <h2>Login</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
        <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="senha" value={password} onChange={e => setPassword(e.target.value)} />
        <button type="submit">Entrar</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  )
}
