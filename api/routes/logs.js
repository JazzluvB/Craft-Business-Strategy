/**
 * craft-landing/api/routes/logs.js
 */
const router = require('express').Router();
const db = require('../db');
const { requireAuth, requirePermission } = require('../middleware/auth');
router.use(requireAuth);
router.get('/', requirePermission('logs:read'), (req, res) => {
  const limit = Math.min(parseInt(req.query.limit)||100, 500);
  res.json(db.getLogs(limit));
});
module.exports = router;
