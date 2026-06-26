/**
 * craft-landing/api/routes/auth.js
 */
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const db      = require('../db');
const { requireAuth, logActivity } = require('../middleware/auth');

// Strict rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  message: { error: 'Demasiados intentos. Espera 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login', authLimiter, [
  body('username').trim().notEmpty().withMessage('Usuario requerido').escape(),
  body('password').notEmpty().withMessage('Contraseña requerida')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, password } = req.body;

  // Accept username OR email
  const user = db.getUserByUsername(username) || db.getUserByEmail(username);

  if (!user || !user.active) {
    // Constant-time fake compare to prevent timing attacks
    await bcrypt.compare(password, '$2a$12$invalidhashtopreventtimingattack');
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    db.addLog({ userId: user.id, username: user.username, action: 'LOGIN_FAILED', ip: req.ip });
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = signToken(user);
  db.updateUser(user.id, { lastLogin: new Date().toISOString() });
  db.addLog({ userId: user.id, username: user.username, role: user.role, action: 'LOGIN_OK', ip: req.ip });

  res.json({
    token,
    user: { id: user.id, username: user.username, email: user.email, role: user.role, name: user.name }
  });
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', requireAuth, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// ── POST /api/auth/logout ─────────────────────────────────
router.post('/logout', requireAuth, logActivity('LOGOUT'), (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
