const express = require('express');
const router = express.Router();

/**
 * GET /api/stats/daily?date=YYYY-MM-DD
 * 获取某日的统计摘要
 */
router.get('/daily', (req, res) => {
  try {
    const db = req.app.get('db');
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: '缺少 date 参数' });
    }
    const summary = db.stats.dailySummary(date);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message || '获取每日统计失败' });
  }
});

/**
 * GET /api/stats/range?start=YYYY-MM-DD&end=YYYY-MM-DD
 * 获取日期范围内的每日统计（用于折线图）
 */
router.get('/range', (req, res) => {
  try {
    const db = req.app.get('db');
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: '缺少 start 或 end 参数' });
    }
    const data = db.stats.rangeSummary(start, end);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || '获取统计范围失败' });
  }
});

/**
 * GET /api/stats/achievements
 * 获取成就数据（连续打卡天数、累计番茄数、里程碑）
 */
router.get('/achievements', (req, res) => {
  try {
    const db = req.app.get('db');
    const data = db.stats.achievements();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || '获取成就数据失败' });
  }
});

module.exports = router;
