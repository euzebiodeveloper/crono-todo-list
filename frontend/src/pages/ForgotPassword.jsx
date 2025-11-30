import React, { useState } from 'react'
import { requestPasswordReset } from '../api'
import { toast } from 'react-toastify'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email) return toast.error('Preencha o email')
    setLoading(true)
    try {
      const res = await requestPasswordReset({ email })
      if (res && res.ok) {
        toast.success('Se o email estiver cadastrado, você receberá instruções para redefinir a senha')
        setEmail('')
      } else {
        toast.error(res.error || 'Erro ao solicitar recuperação')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro na requisição')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="section-bleed auth-section">
      <div className="section-inner">
        <div className="auth-card">
          <h2>Recuperar senha</h2>
          <p className="muted">Informe seu email e enviaremos instruções para redefinir sua senha.</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <input type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
