import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser, setAuthToken } from '../api'
import { toast } from 'react-toastify'

export default function Login({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await loginUser({ email, password })
      if (res.token) {
        // store token with expiry depending on remember checkbox
        try { setAuthToken(res.token, remember) } catch (_) {}
        // notify parent
        if (onAuth) onAuth(res.token)
        // mark that a login just happened so Dashboard can show a welcome message
        try { sessionStorage.setItem('justLoggedIn', 'true') } catch (e) {}
        toast.success('Login realizado com sucesso')
        navigate('/dashboard')
        return
      }
      else if (res.error) toast.error(res.error)
      else toast.error('Resposta inesperada do servidor')
    } catch (err) {
      toast.error('Erro na requisição')
    } finally {
      setLoading(false)
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
            <input id="email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />

            <label className="visually-hidden" htmlFor="password">Senha</label>
            <input id="password" type="password" placeholder="senha" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />

            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              <span>Lembrar senha</span>
            </label>

            <button type="submit" className="btn" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
          </form>
          
        </div>
      </div>
    </div>
  )
}
