const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // collect missing fields to return structured response
    const missing = []
    if (!name) missing.push('name')
    if (!email) missing.push('email')
    if (!password) missing.push('password')
    if (missing.length) return res.status(400).json({ error: 'Missing fields', missingFields: missing })

    // basic validations
    if (String(name).trim().length < 2) return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' })
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(String(email).toLowerCase())) return res.status(400).json({ error: 'Email inválido' })

    // strong password: min 8 chars, at least 1 lowercase, 1 uppercase, 1 special char
    const strongPw = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/
    if (!strongPw.test(String(password))) return res.status(400).json({ error: 'Senha fraca: mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas e caracteres especiais' })

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email já cadastrado' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({ name, email, passwordHash });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Credenciais inválidas' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Erro ao autenticar usuário' });
  }
});

// simple auth middleware: expects `Authorization: Bearer <token>`
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid authorization header' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// GET /api/auth/me - returns basic user info (requires auth)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Me error', err);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// POST /api/auth/reset-password - change password (requires auth)
router.post('/reset-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const missing = []
    if (!currentPassword) missing.push('currentPassword')
    if (!newPassword) missing.push('newPassword')
    if (missing.length) return res.status(400).json({ error: 'Missing fields', missingFields: missing })

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Senha atual incorreta' });

    // enforce strong new password
    const strongPw = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/
    if (!strongPw.test(String(newPassword))) return res.status(400).json({ error: 'Senha fraca: mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas e caracteres especiais' })

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    console.error('Reset password error', err);
    res.status(500).json({ error: 'Erro ao atualizar senha' });
  }
});

module.exports = router;
