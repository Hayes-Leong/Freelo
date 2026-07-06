const express = require('express');
const router = express.Router();

// GET /api/ideas — 获取所有灵感代办（按创建时间倒序）
router.get('/', (req, res) => {
  try {
    const db = req.app.get('db');
    const ideas = db.ideas.all();
    res.json({ ideas });
  } catch (err) {
    res.status(500).json({ error: err.message || '获取灵感代办失败' });
  }
});

// POST /api/ideas — 创建灵感代办
router.post('/', (req, res) => {
  try {
    const db = req.app.get('db');
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: 'content 为必填' });
    const idea = db.ideas.insert({ content: content.trim() });
    res.status(201).json(idea);
  } catch (err) {
    res.status(500).json({ error: err.message || '创建灵感代办失败' });
  }
});

// DELETE /api/ideas/:id — 删除灵感代办
router.delete('/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const id = Number(req.params.id);
    const ok = db.ideas.delete(id);
    if (!ok) return res.status(404).json({ error: '灵感代办不存在' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || '删除灵感代办失败' });
  }
});

module.exports = router;
