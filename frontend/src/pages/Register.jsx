import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../api'

export default function Register({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [message, setMessage] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    try {
      const res = await registerUser({ name, email, password })
      if (res.user && res.token) {
        if (onAuth) onAuth(res.token)
        localStorage.setItem('token', res.token)
        setMessage('Cadastro realizado com sucesso')
        navigate('/dashboard')
        return
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
    <div className="section-bleed auth-section">
      <div className="section-inner">
        <div className="auth-card">
          <h2>Registrar</h2>
          <p className="muted">Crie sua conta para salvar listas, histórico e acessar seus dados em qualquer lugar.</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="visually-hidden" htmlFor="name">Nome</label>
            <input id="name" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />

            <label className="visually-hidden" htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />

            <label className="visually-hidden" htmlFor="reg-password">Senha</label>
            <input id="reg-password" type="password" placeholder="senha" value={password} onChange={e => setPassword(e.target.value)} />

            <button type="submit" className="btn">Criar conta</button>
          </form>
          {message && <p className="message">{message}</p>}
        </div>
      </div>
    </div>
  )
}
