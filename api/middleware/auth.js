/**
 * craft-landing/api/middleware/auth.js
 * JWT authentication + role-based access control
 */
const jwt = require('jsonwebtoken');
const db  = require('../db');

const ROLES = {
  superadmin: 4,
  admin:      3,
  editor:     2,
  soporte:    1
};

// ── PERMISSIONS MAP ────────────────────────────────────────
const PERMISSIONS = {
  superadmin: ['*'],  // todo
  admin: [
    'users:read','users:create','users:update',
    'leads:read','leads:export','leads:delete',
    'offers:read','offers:create','offers:update','offers:delete',
    'coupons:read','coupons:create','coupons:update','coupons:delete',
    'chatbot:read','chatbot:update',
    'settings:read','settings:update',
    'logs:read'
  ],
  editor: [
    'leads:read',
    'offers:read','offers:create','offers:update',
    'coupons:read','coupons:create','coupons:update',
    'chatbot:read','chatbot:update',
    'settings:read'
  ],
  soporte: [
    'leads:read',
    'chatbot:read',
    'logs:read'
  ]
};

function hasPermission(role, permission) {
  const perms = PERMISSIONS[role] || [];
  return perms.includes('*') || perms.includes(permission);
}

// ── VERIFY TOKEN ──────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token  = header && header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user    = db.getUserById(payload.id);

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Cuenta inactiva o no encontrada' });
    }

    req.user = { id: user.id, username: user.username, role: user.role, email: user.email };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', expired: true });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// ── REQUIRE ROLE ──────────────────────────────────────────
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (req.user.role === 'superadmin') return next(); // superadmin bypasses all
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }
    next();
  };
}

// ── REQUIRE PERMISSION ────────────────────────────────────
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    if (!hasPermission(req.user.role, permission)) {
      return res.status(403).json({ error: `Permiso requerido: ${permission}` });
    }
    next();
  };
}

// ── ACTIVITY LOGGER MIDDLEWARE ────────────────────────────
function logActivity(action) {
  return (req, res, next) => {
    const orig = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode < 400 && req.user) {
        db.addLog({
          userId:   req.user.id,
          username: req.user.username,
          role:     req.user.role,
          action,
          ip:       req.ip,
          ua:       req.get('user-agent'),
          method:   req.method,
          path:     req.path,
          status:   res.statusCode
        });
      }
      return orig(body);
    };
    next();
  };
}

module.exports = { requireAuth, requireRole, requirePermission, logActivity, hasPermission, PERMISSIONS, ROLES };
