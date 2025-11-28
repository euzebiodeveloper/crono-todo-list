import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../api'
import { toast } from 'react-toastify'

export default function Login({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      const res = await loginUser({ email, password })
      if (res.token) {
        // store token and notify parent
        if (onAuth) onAuth(res.token)
        localStorage.setItem('token', res.token)
        toast.success('Login realizado com sucesso')
        navigate('/dashboard')
        return
      }
      else if (res.error) toast.error(res.error)
      else toast.error('Resposta inesperada do servidor')
    } catch (err) {
      toast.error('Erro na requisição')
    }
  }

  return (
    <div className="section-bleed auth-section">
      <div className="section-inner">
        <div className="auth-card">
          <h2>Entrar</h2>
          <p className="muted">Acesse sua conta para gerenciar suas tarefas e sincronizar entre dispositivos.</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <label className="visually-hidden" htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} />

            <label className="visually-hidden" htmlFor="password">Senha</label>
            <input id="password" type="password" placeholder="senha" value={password} onChange={e => setPassword(e.target.value)} />

            <button type="submit" className="btn">Entrar</button>
          </form>
          
        </div>
      </div>
    </div>
  )
}
