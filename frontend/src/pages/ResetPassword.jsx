import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { verifyResetCode, performPasswordReset } from '../api'
import { toast } from 'react-toastify'

export default function ResetPassword() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [valid, setValid] = useState(false)
  const [user, setUser] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // strong password: min 8 chars, at least 1 lowercase, 1 uppercase, 1 special char
  const strongPw = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/
  const isStrong = strongPw.test(String(newPassword))
  const passwordsMatch = newPassword === confirm
  

  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        const res = await verifyResetCode(code)
        if (mounted) {
          if (res && res.ok) {
            setValid(true)
            setUser(res.user)
          } else {
            toast.error(res.error || 'Código inválido')
            setValid(false)
          }
        }
      } catch (err) {
        console.error(err)
        toast.error('Erro na verificação')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [code])

  async function handleSubmit(e) {
    e.preventDefault()
    if (submitting) return;
    if (!newPassword) return toast.error('Informe a nova senha')
    if (!isStrong) return toast.error('Senha fraca: mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas e caracteres especiais')
    if (!passwordsMatch) return toast.error('As senhas não coincidem')
    setSubmitting(true)
    try {
      const res = await performPasswordReset(code, { newPassword })
      if (res && res.ok) {
        toast.success('Senha atualizada com sucesso')
        navigate('/login')
      } else {
        toast.error(res.error || 'Erro ao atualizar senha')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro na requisição')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="section-bleed auth-section"><div className="section-inner"><p>Verificando código...</p></div></div>
  if (!valid) return <div className="section-bleed auth-section"><div className="section-inner"><p>Código inválido ou expirado.</p></div></div>

  return (
    <div className="section-bleed auth-section">
      <div className="section-inner">
        <div className="auth-card">
          <h2>Redefinir senha</h2>
          <p className="muted">Usuário: {user && user.name} — {user && user.email}</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <input type="password" placeholder="Nova senha" value={newPassword} onChange={e => { setNewPassword(e.target.value) }} disabled={submitting} />
            <input type="password" placeholder="Confirmar nova senha" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={submitting} />
            <button className="btn" type="submit" disabled={submitting || !newPassword}>{submitting ? 'Enviando...' : 'Atualizar senha'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
