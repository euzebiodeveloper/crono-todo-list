import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import Login from './pages/Login'
import Register from './pages/Register'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <header style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Crono</h1>
          <nav>
            <Link to="/">Home</Link> |
            <Link to="/about" style={{ marginLeft: 8 }}>About</Link> |
            <Link to="/login" style={{ marginLeft: 8 }}>Login</Link> |
            <Link to="/register" style={{ marginLeft: 8 }}>Register</Link>
          </nav>
        </header>

        <main style={{ marginTop: 20 }}>
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
