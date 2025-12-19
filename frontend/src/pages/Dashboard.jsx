import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMe, resetPassword, fetchTodos } from '../api'
import { toast } from 'react-toastify'

export default function Dashboard({ onLogout }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)

  // reset password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [resetMsg, setResetMsg] = useState(null)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setErr(null)
      try {
        const me = await getMe()
        if (me && me.user) {
          // ensure user's name is title-cased (first letter of each word capitalized)
          const name = (me.user.name || '')
          const titleName = String(name).trim().split(/\s+/).map(w => w ? (w.charAt(0).toUpperCase() + w.slice(1)) : '').filter(Boolean).join(' ')
          setUser({ ...me.user, name: titleName })
        }
        const t = await fetchTodos()
        setTodos(Array.isArray(t) ? t : [])
      } catch (e) {
        setErr('Falha ao carregar dados')
        toast.error('Falha ao carregar dados')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // show welcome toast once after a fresh login
  useEffect(() => {
    try {
      const just = sessionStorage.getItem('justLoggedIn')
      if (just === 'true') {
        if (user && user.name) toast.success(`Bem-vindo, ${user.name}`)
        else toast.success('Bem-vindo')
        sessionStorage.removeItem('justLoggedIn')
      }
    } catch (e) {
      // ignore sessionStorage errors
    }
  }, [user])

  function translateServerMessage(msg) {
    if (!msg) return msg
    const m = String(msg)
    // known english -> pt-BR translations
    if (m === 'Current password is incorrect') return 'Senha atual incorreta'
    if (m === 'Invalid current password') return 'Senha atual inválida'
    // fallback: return original message (may already be Portuguese)
    return msg
  }

  function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true)
    if (onLogout) onLogout()
    navigate('/')
  }

  async function handleReset(e) {
    e.preventDefault()
    if (resetting) return;
    setResetMsg(null)
    // client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setResetMsg('Preencha todos os campos de senha')
      toast.error('Preencha todos os campos de senha')
      return
    }
    if (newPassword !== confirmPassword) {
      setResetMsg('A nova senha e a confirmação não coincidem')
      toast.error('A nova senha e a confirmação não coincidem')
      return
    }
    setResetting(true)
    try {
      const res = await resetPassword({ currentPassword, newPassword })
      if (res && res.ok) {
        const successMsg = 'Senha atualizada com sucesso'
        setResetMsg(successMsg)
        toast.success(successMsg)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else if (res && res.error) {
        const translated = translateServerMessage(res.error)
        setResetMsg(translated)
        toast.error(translated)
      } else {
        const fallback = 'Erro ao atualizar senha'
        setResetMsg(fallback)
        toast.error(fallback)
      }
    } catch (err) {
      setResetMsg('Erro na solicitação')
      toast.error('Erro na solicitação')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="section-bleed">
      <div className="section-inner">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <button className="btn secondary" onClick={handleLogout} disabled={loggingOut}>Sair</button>
        </div>
        {loading && <p className="muted">Carregando...</p>}
        {err && <p className="message">{err}</p>}

        {user && (
          <div className="card" style={{ marginBottom: 18 }}>
            <h4>Minha conta</h4>
            <p><strong>Nome:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        )}

        <div className="card" style={{ marginBottom: 18 }}>
          <h4>Resetar senha</h4>
          <form onSubmit={handleReset} className="auth-form">
            <input type="password" placeholder="Senha atual" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} disabled={resetting} />
            <input type="password" placeholder="Nova senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={resetting} />
            <input type="password" placeholder="Confirmar nova senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={resetting} />
            <button className="btn" type="submit" disabled={resetting}>{resetting ? 'Atualizando...' : 'Atualizar senha'}</button>
          </form>
        </div>

        

        
      </div>
    </div>
  )
}
