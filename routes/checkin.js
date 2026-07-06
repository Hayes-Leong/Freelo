const express = require('express');
const router = express.Router();

// 获取当前余额
function getBalance(db) {
  const last = db.rest_balance_log.getLast();
  if (last) return last.balance_after;
  return parseFloat(db.config.get('initial_rest_balance')) || 0;
}

// POST /api/checkin/:date
router.post('/:date', (req, res) => {
  try {
    const db = req.app.get('db');
    const { date } = req.params;

    // 不允许未来日期打卡
    const today = new Date().toISOString().slice(0, 10);
    if (date > today) return res.status(400).json({ error: '不能提前打卡未来日期' });

    // 获取或初始化日状态
    const dayStatus = db.day_status.get(date);
    const is_workday = dayStatus ? dayStatus.is_workday : 1;
    const checkin_done = dayStatus ? dayStatus.checkin_done : 0;

    // 校验1：必须是工作日
    if (!is_workday) return res.status(400).json({ error: '休息日无需打卡' });

    // 校验2：尚未打卡
    if (checkin_done) return res.status(400).json({ error: '今日已打卡' });

    // 校验3：核心任务已完成
    const todos = db.todos.getByDate(date);
    const coreDone = todos.some((t) => t.is_core === 1 && t.completed === 1);
    if (!coreDone) return res.status(400).json({ error: '请先完成核心任务再打卡' });

    // 计算余额
    const rewardPerCheckin = parseFloat(db.config.get('reward_per_checkin')) || 0.5;
    const currentBalance = getBalance(db);
    const newBalance = currentBalance + rewardPerCheckin;

    // 记录流水
    db.rest_balance_log.insert({
      date,
      change_amount: rewardPerCheckin,
      reason: '每日打卡',
      balance_after: newBalance,
    });

    // 更新日状态
    db.day_status.upsert(date, { checkin_done: 1, core_done: 1 });

    res.json({ balance_after: newBalance, earned: rewardPerCheckin });
  } catch (err) {
    res.status(500).json({ error: err.message || '打卡失败' });
  }
});

module.exports = router;
