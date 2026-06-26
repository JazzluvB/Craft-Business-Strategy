/**
 * craft-landing/api/routes/leads.js
 */
const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth, requirePermission, logActivity } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', requirePermission('leads:read'), (req, res) => {
  let leads = db.getLeads();
  const { plan, search, from, to } = req.query;
  if (plan)   leads = leads.filter(l => l.plan === plan);
  if (search) leads = leads.filter(l =>
    (l.email||'').includes(search) || (l.business||'').includes(search));
  if (from)   leads = leads.filter(l => l.createdAt >= from);
  if (to)     leads = leads.filter(l => l.createdAt <= to);
  res.json(leads.slice().reverse());
});

// Export CSV
router.get('/export', requirePermission('leads:export'), (req, res) => {
  const leads = db.getLeads();
  const header = 'ID,Email,Negocio,Plan,Fecha\n';
  const rows = leads.map(l =>
    `${l.id},"${l.email}","${l.business}","${l.plan}","${l.createdAt}"`).join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="craft-leads.csv"');
  res.send(header + rows);
});

// Public endpoint — called from landing page modal
router.post('/public', [
  body('email').isEmail().normalizeEmail(),
  body('business').trim().notEmpty().escape(),
  body('plan').optional().trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const lead = db.createLead({
    id: uuid(), email: req.body.email, business: req.body.business,
    plan: req.body.plan || 'Pro', source: 'landing',
    createdAt: new Date().toISOString(), ip: req.ip
  });
  res.status(201).json({ ok: true, id: lead.id });
});

router.delete('/:id', requirePermission('leads:delete'), logActivity('LEAD_DELETE'), (req, res) => {
  db.deleteLead(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
