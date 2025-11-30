import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Home from './pages/Home'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Atividades from './pages/Atividades'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import { getAuthToken, clearAuthToken, setAuthToken, getAuthExpiry } from './api'

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthToken())
  const navRef = useRef()

  // schedule automatic logout when token expires
  useEffect(() => {
    try {
      const exp = getAuthExpiry()
      if (!exp) return
      const ms = exp - Date.now()
      if (ms <= 0) {
        clearAuthToken(); setIsAuthenticated(false); return
      }
      const t = setTimeout(() => {
        clearAuthToken(); setIsAuthenticated(false); try { toast.info('Sessão expirada') } catch (_) {}
        try { window.location.href = '/' } catch (_) {}
      }, ms)
      return () => clearTimeout(t)
    } catch (_) {}
  }, [])

  // small component used inside the Router to logout and redirect home
  function LogoutButton() {
    const navigate = useNavigate()
    function handleLogout() {
      clearAuthToken()
      setIsAuthenticated(false)
      setMenuOpen(false)
      try { toast.info('Você saiu da conta') } catch (_) {}
      navigate('/')
    }
    return (
      <button className="btn secondary" onClick={handleLogout}>
        Sair
      </button>
    )
  }

  // close menu on outside click
  useEffect(() => {
    function onDoc(e) {
      if (!menuOpen) return
      // If click is outside the nav AND not the mobile-menu-button, close the menu.
      // This prevents the sequence where pointerdown closes the menu and the
      // button's click handler toggles it back open.
      const clickedInsideNav = navRef.current && navRef.current.contains(e.target)
      const clickedToggle = e.target && (e.target.closest && e.target.closest('.mobile-menu-button'))
      if (!clickedInsideNav && !clickedToggle) setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onDoc)
    return () => document.removeEventListener('pointerdown', onDoc)
  }, [menuOpen])

  return (
    <BrowserRouter>
      <div className="app">
        <header className="site-header">
          <div className="header-left">
            <Link to="/" aria-label="Home">
              <img src="/images/name-logo.png" alt="Crono" className="logo logo-name" />
              <img src="/images/icon.png" alt="" aria-hidden="true" className="logo logo-icon" />
            </Link>
          </div>

          <div className="header-right">
            <nav ref={navRef} className={`header-nav ${menuOpen ? 'open' : ''}`} aria-label="Main navigation">
              <Link to="/">Home</Link>
              <Link to="/about">Sobre</Link>
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard">Dashboard</Link>
                  <Link to="/atividades">Atividades</Link>
                  <LogoutButton />
                </>
              ) : (
                <>
                  <Link to="/login">Login</Link>
                  <Link to="/register">Registrar</Link>
                </>
              )}
            </nav>

            <button
              className={`mobile-menu-button ${menuOpen ? 'open' : ''}`}
              aria-expanded={menuOpen}
              aria-label="Toggle menu"
              onClick={() => setMenuOpen(v => !v)}
            >
              <span className="burger" />
            </button>
          </div>
        </header>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login onAuth={(token, remember=false) => { try { setAuthToken(token, remember) } catch(_){}; setIsAuthenticated(true); }} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:code" element={<ResetPassword />} />
            <Route path="/register" element={<Register onAuth={(token) => { try { setAuthToken(token, false) } catch(_){}; setIsAuthenticated(true); }} />} />
            <Route path="/dashboard" element={<Dashboard onLogout={() => { clearAuthToken(); setIsAuthenticated(false); try { toast.info('Você saiu da conta') } catch (_) {} }} />} />
            <Route path="/atividades" element={<Atividades />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
