require('dotenv').config();
const express = require('express');
const path    = require('path');
const rateLimit = require('express-rate-limit');

const app = express();

// Body parser
app.use(express.json());

// Fix CSP para permitir inline scripts del panel admin
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "script-src 'self' 'unsafe-inline'; script-src-attr 'unsafe-inline'");
  next();
});

// Rate limit global
app.use('/api/', rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders:   false
}));

// CORS
const ALLOWED = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || ALLOWED.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// API Routes
app.use('/api/auth',     require('./api/routes/auth'));
app.use('/api/leads',    require('./api/routes/leads'));
app.use('/api/offers',   require('./api/routes/offers'));
app.use('/api/coupons',  require('./api/routes/coupons'));
app.use('/api/chatbot',  require('./api/routes/chatbot'));
app.use('/api/settings', require('./api/routes/settings'));
app.use('/api/users',    require('./api/routes/users'));
app.use('/api/logs',     require('./api/routes/logs'));

// Serve frontend desde carpeta admin
app.use(express.static(path.join(__dirname, 'admin')));
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📋 Admin panel: http://localhost:${PORT}/admin\n`);
});
