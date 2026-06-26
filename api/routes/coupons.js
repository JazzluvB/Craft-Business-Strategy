/**
 * craft-landing/api/routes/coupons.js
 */
const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth, requirePermission, logActivity } = require('../middleware/auth');

router.use(requireAuth);

router.get('/',  requirePermission('coupons:read'),   (req, res) => res.json(db.getCoupons()));

// Public validation endpoint — landing page can call this
router.get('/validate/:code', (req, res) => {
  const c = db.getCouponByCode(req.params.code.toUpperCase());
  if (!c || !c.active) return res.status(404).json({ valid: false });
  const now = new Date();
  if (c.expiresAt && new Date(c.expiresAt) < now) return res.json({ valid: false, reason: 'expirado' });
  if (c.usesLimit && c.usesCount >= c.usesLimit) return res.json({ valid: false, reason: 'agotado' });
  res.json({ valid: true, discount: c.discount, type: c.type, description: c.description });
});

router.post('/',  requirePermission('coupons:create'), [
  body('code').trim().notEmpty().toUpperCase().escape(),
  body('discount').isNumeric(),
  body('type').isIn(['percent','fixed']).withMessage('percent o fixed')
], logActivity('COUPON_CREATE'), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  if (db.getCouponByCode(req.body.code)) return res.status(409).json({ error: 'Código ya existe' });
  const coupon = db.createCoupon({
    id: uuid(), code: req.body.code.toUpperCase(),
    discount: req.body.discount, type: req.body.type,
    description: req.body.description || '',
    active: true, usesCount: 0,
    usesLimit: req.body.usesLimit || null,
    expiresAt: req.body.expiresAt || null,
    plan: req.body.plan || 'all',
    createdBy: req.user.id, createdAt: new Date().toISOString()
  });
  res.status(201).json(coupon);
});

router.patch('/:id',  requirePermission('coupons:update'), logActivity('COUPON_UPDATE'), (req, res) => {
  const updated = db.updateCoupon(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Cupón no encontrado' });
  res.json(updated);
});

router.delete('/:id', requirePermission('coupons:delete'), logActivity('COUPON_DELETE'), (req, res) => {
  db.deleteCoupon(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
