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
      if (res.token) setMessage('Login realizado com sucesso')
      else if (res.error) setMessage(res.error)
      else setMessage('Resposta inesperada do servidor')
    } catch (err) {
      setMessage('Erro na requisição')
    }
  }

  return (
    <div className="section-bleed auth-section">
      <div className="section-inner">
        <h2>Entrar</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="visually-hidden" htmlFor="email">Email</label>
          <input id="email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />

          <label className="visually-hidden" htmlFor="password">Senha</label>
          <input id="password" type="password" placeholder="senha" value={password} onChange={e => setPassword(e.target.value)} />

          <button type="submit" className="btn">Entrar</button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  )
}
