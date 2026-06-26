/**
 * craft-landing/api/routes/offers.js
 */
const router = require('express').Router();
const { v4: uuid } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { requireAuth, requirePermission, logActivity } = require('../middleware/auth');

router.use(requireAuth);

// ── OFFERS ────────────────────────────────────────────────
router.get('/',        requirePermission('offers:read'),   (req, res) => res.json(db.getOffers()));
router.post('/',       requirePermission('offers:create'),
  [body('title').trim().notEmpty().escape(), body('discount').isNumeric()],
  logActivity('OFFER_CREATE'), (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const offer = db.createOffer({
      id: uuid(), ...req.body, active: true,
      createdBy: req.user.id, createdAt: new Date().toISOString()
    });
    res.status(201).json(offer);
  });
router.patch('/:id',   requirePermission('offers:update'),   logActivity('OFFER_UPDATE'),  (req, res) => {
  const updated = db.updateOffer(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Oferta no encontrada' });
  res.json(updated);
});
router.delete('/:id',  requirePermission('offers:delete'),   logActivity('OFFER_DELETE'),  (req, res) => {
  db.deleteOffer(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
