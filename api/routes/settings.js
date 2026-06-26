/**
 * craft-landing/api/routes/settings.js
 */
const router = require('express').Router();
const db = require('../db');
const { requireAuth, requirePermission, logActivity } = require('../middleware/auth');
router.use(requireAuth);
router.get('/',   requirePermission('settings:read'),   (req, res) => res.json(db.getSettings()));
router.patch('/', requirePermission('settings:update'), logActivity('SETTINGS_UPDATE'), (req, res) => {
  // Validate urgencyEnd is a valid date if provided
  if (req.body.urgencyEnd && isNaN(Date.parse(req.body.urgencyEnd))) {
    return res.status(400).json({ error: 'urgencyEnd debe ser una fecha válida' });
  }
  res.json(db.updateSettings(req.body));
});
// Public endpoint — landing page uses this for urgency countdown
router.get('/public', (req, res) => {
  const s = db.getSettings();
  res.json({ urgencyEnd: s.urgencyEnd, urgencyLabel: s.urgencyLabel, trialDays: s.trialDays });
});
module.exports = router;
