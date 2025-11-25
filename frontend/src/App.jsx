import React, { useState, useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navRef = useRef()

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
              <Link to="/login">Login</Link>
              <Link to="/register">Registrar</Link>
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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
