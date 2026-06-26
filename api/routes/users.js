/**
 * craft-landing/api/routes/users.js
 */
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth, requireRole, requirePermission, logActivity } = require('../middleware/auth');

const VALID_ROLES = ['superadmin','admin','editor','soporte'];

// All routes require auth
router.use(requireAuth);

// ── GET /api/users ────────────────────────────────────────
router.get('/', requirePermission('users:read'), (req, res) => {
  const users = db.getUsers().map(({ passwordHash, ...u }) => u);
  res.json(users);
});

// ── GET /api/users/:id ────────────────────────────────────
router.get('/:id', requirePermission('users:read'), (req, res) => {
  const user = db.getUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

// ── POST /api/users ───────────────────────────────────────
router.post('/', requirePermission('users:create'), [
  body('username').trim().isLength({min:3,max:30}).withMessage('Usuario 3-30 chars').escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({min:8}).withMessage('Contraseña mínimo 8 caracteres'),
  body('role').isIn(VALID_ROLES).withMessage('Rol inválido'),
  body('name').trim().notEmpty().escape()
], logActivity('USER_CREATE'), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password, role, name } = req.body;

  // Solo superadmin puede crear otro superadmin
  if (role === 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'Solo el Super Admin puede crear Super Admins' });
  }

  if (db.getUserByUsername(username)) return res.status(409).json({ error: 'Username en uso' });
  if (db.getUserByEmail(email))       return res.status(409).json({ error: 'Email en uso' });

  const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const passwordHash = await bcrypt.hash(password, rounds);

  const user = db.createUser({
    id: uuid(), username, email, name, role, passwordHash,
    active: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), lastLogin: null
  });

  const { passwordHash: _, ...safe } = user;
  res.status(201).json(safe);
});

// ── PATCH /api/users/:id ──────────────────────────────────
router.patch('/:id', requirePermission('users:update'), [
  body('email').optional().isEmail().normalizeEmail(),
  body('role').optional().isIn(VALID_ROLES),
  body('name').optional().trim().escape(),
  body('active').optional().isBoolean()
], logActivity('USER_UPDATE'), async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const target = db.getUserById(req.params.id);
  if (!target) return res.status(404).json({ error: 'Usuario no encontrado' });

  // No puedes degradar a otro superadmin si no eres superadmin
  if (target.role === 'superadmin' && req.user.role !== 'superadmin') {
    return res.status(403).json({ error: 'No puedes modificar un Super Admin' });
  }

  const updates = {};
  ['name','email','role','active'].forEach(k => {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  });

  // Password change
  if (req.body.password) {
    if (req.body.password.length < 8) return res.status(400).json({ error: 'Contraseña mínimo 8 chars' });
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    updates.passwordHash = await bcrypt.hash(req.body.password, rounds);
  }

  const updated = db.updateUser(req.params.id, updates);
  const { passwordHash, ...safe } = updated;
  res.json(safe);
});

// ── DELETE /api/users/:id ─────────────────────────────────
router.delete('/:id', requireRole('superadmin'), logActivity('USER_DELETE'), (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  db.deleteUser(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
