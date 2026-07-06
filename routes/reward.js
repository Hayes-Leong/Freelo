const express = require('express');
const router = express.Router();

// GET /api/reward/balance
router.get('/balance', (req, res) => {
  try {
    const db = req.app.get('db');
    const last = db.rest_balance_log.getLast();
    const balance = last ? last.balance_after : (parseFloat(db.config.get('initial_rest_balance')) || 0);
    const per_checkin = parseFloat(db.config.get('reward_per_checkin')) || 0.5;

    res.json({ balance, per_checkin });
  } catch (err) {
    res.status(500).json({ error: err.message || '获取余额失败' });
  }
});

// GET /api/reward/history?limit=20&offset=0
router.get('/history', (req, res) => {
  try {
    const db = req.app.get('db');
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const all = db.rest_balance_log.all();
    const total = all.length;
    const history = [...all].reverse().slice(offset, offset + limit);

    res.json({ history, total, limit, offset });
  } catch (err) {
    res.status(500).json({ error: err.message || '获取流水失败' });
  }
});

module.exports = router;
