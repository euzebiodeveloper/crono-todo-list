import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerUser } from '../api'
import { toast } from 'react-toastify'

export default function Register({ onAuth }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  
  const navigate = useNavigate()
  function translateField(key) {
    const map = {
      name: 'Nome',
      email: 'Email',
      password: 'Senha',
      confirmPassword: 'Confirmação de senha'
    }
    return map[key] || key
  }

  function isValidEmail(email) {
    if (!email) return false
    // simple email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase())
  }

  function isStrongPassword(pw) {
    if (!pw) return false
    // min 8 chars, at least 1 lowercase, 1 uppercase, 1 special char
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(pw)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Client-side validation: ensure required fields are filled
    const missing = []
    const nameTrim = name && String(name).trim()
    const emailTrim = email && String(email).trim()
    const pass = password
    const confirm = confirmPassword

    if (!nameTrim) missing.push('Nome')
    if (!emailTrim) missing.push('Email')
    if (!pass || !String(pass).trim()) missing.push('Senha')
    if (!confirm || !String(confirm).trim()) missing.push('Confirmação de senha')

    if (missing.length > 0) {
      toast.error(`Por favor preencha os seguintes campos: ${missing.join(', ')}`)
      return
    }

    // Format/length validations
    if (!isValidEmail(emailTrim)) {
      toast.error('Email inválido')
      return
    }

    if (String(nameTrim).length < 2) {
      toast.error('Nome deve ter pelo menos 2 caracteres')
      return
    }

    if (!isStrongPassword(pass)) {
      toast.error('Senha deve ter no mínimo 8 caracteres e incluir pelo menos uma letra maiúscula, uma minúscula e um caractere especial')
      return
    }

    // Password match validation
    if (pass !== confirm) {
      toast.error('As senhas não coincidem')
      return
    }

    try {
      const res = await registerUser({ name, email, password })
      if (res.user && res.token) {
        if (onAuth) onAuth(res.token)
        localStorage.setItem('token', res.token)
        toast.success('Cadastro realizado com sucesso')
        navigate('/dashboard')
        return
      } else if (res.error) {
        // If server provides an array of missing fields, translate them
        if (res.missingFields && Array.isArray(res.missingFields)) {
          const labels = res.missingFields.map(f => translateField(f)).join(', ')
          toast.error(`Por favor preencha os seguintes campos: ${labels}`)
        } else if (typeof res.error === 'string' && /missing/i.test(res.error)) {
          // Generic server message mentioning missing fields
          toast.error('Por favor preencha os campos obrigatórios.')
        } else {
          toast.error(res.error)
        }
      } else {
        toast.error('Resposta inesperada do servidor')
      }
    } catch (err) {
      toast.error('Erro na requisição')
    }
  }

  return (
    <div className="section-bleed auth-section">
      <div className="section-inner">
        <div className="auth-card">
          <h2>Registrar</h2>
          <p className="muted">Crie sua conta para salvar listas, histórico e acessar seus dados em qualquer lugar.</p>
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <label className="visually-hidden" htmlFor="name">Nome</label>
            <input id="name" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} required minLength={2} />

            <label className="visually-hidden" htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" placeholder="email@example.com" value={email} onChange={e => setEmail(e.target.value)} required />

            <label className="visually-hidden" htmlFor="reg-password">Senha</label>
            <input id="reg-password" type="password" placeholder="senha" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />

            <label className="visually-hidden" htmlFor="reg-confirm-password">Confirmar senha</label>
            <input id="reg-confirm-password" type="password" placeholder="confirmar senha" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={8} />

            <button type="submit" className="btn">Criar conta</button>
          </form>
          
        </div>
      </div>
    </div>
  )
}
