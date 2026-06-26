/**
 * craft-landing/api/routes/chatbot.js
 */
const router = require('express').Router();
const db = require('../db');
const { requireAuth, requirePermission, logActivity } = require('../middleware/auth');
router.use(requireAuth);
router.get('/',   requirePermission('chatbot:read'),   (req, res) => res.json(db.getChatbot()));
router.patch('/', requirePermission('chatbot:update'), logActivity('CHATBOT_UPDATE'), (req, res) => {
  res.json(db.updateChatbot(req.body));
});
module.exports = router;
