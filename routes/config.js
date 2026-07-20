const express = require('express');
const router = express.Router();

// GET /api/config
router.get('/', (req, res) => {
  try {
    const db = req.app.get('db');
    res.json({ config: db.config.all() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/config
router.put('/', (req, res) => {
  try {
    const db = req.app.get('db');
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: '缺少 key' });
    db.config.set(key, value);
    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
