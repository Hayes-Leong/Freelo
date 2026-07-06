const express = require('express');
const router = express.Router();
const {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  parse,
} = require('date-fns');
const { getAnnotation } = require('./calendar-data');

// GET /api/calendar?month=YYYY-MM
router.get('/', (req, res) => {
  try {
    const db = req.app.get('db');
    const monthStr = req.query.month || format(new Date(), 'yyyy-MM');
    const monthDate = parse(monthStr, 'yyyy-MM', new Date());

    // 计算日历网格的起止日期（补齐前后月份空白）
    const firstDay = startOfMonth(monthDate);
    const lastDay = endOfMonth(monthDate);
    const calStart = startOfWeek(firstDay, { weekStartsOn: 0 });
    const calEnd = endOfWeek(lastDay, { weekStartsOn: 0 });

    // 获取该月所有 day_status 记录，建立 Map
    const statusRecords = db.day_status.getByMonth(monthStr);
    const statusMap = {};
    statusRecords.forEach((s) => {
      statusMap[s.date] = s;
    });

    // 获取该月所有待办，按日期分组
    const allTodos = db._data.todos;
    const todosByDate = {};
    allTodos.forEach((t) => {
      if (!todosByDate[t.date]) todosByDate[t.date] = [];
      todosByDate[t.date].push({ content: t.content, is_core: t.is_core === 1 });
    });

    // 构建每一天的数据
    const days = eachDayOfInterval({ start: calStart, end: calEnd }).map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd');
      const status = statusMap[dateStr] || null;
      const isCurrentMonth = format(d, 'yyyy-MM') === monthStr;

      const annotation = getAnnotation(dateStr);

      return {
        date: dateStr,
        is_workday: status ? status.is_workday : 1,
        checkin_done: status ? status.checkin_done : 0,
        todos: todosByDate[dateStr] || [],
        is_padding: !isCurrentMonth,
        annotation: annotation || null,
      };
    });

    res.json({ month: monthStr, days });
  } catch (err) {
    res.status(500).json({ error: err.message || '获取日历数据失败' });
  }
});

// PUT /api/calendar/:date  设置工作日/休息日
router.put('/:date', (req, res) => {
  try {
    const db = req.app.get('db');
    const { date } = req.params;
    const { is_workday } = req.body;

    if (is_workday === undefined) return res.status(400).json({ error: '缺少 is_workday 参数' });

    const dayStatus = db.day_status.get(date);
    const current = dayStatus ? dayStatus.is_workday : 1;

    const last = db.rest_balance_log.getLast();
    const balance = last ? last.balance_after : (parseFloat(db.config.get('initial_rest_balance')) || 0);
    const cost = 1;

    // 切为休息日：需要校验余额
    if (is_workday === 0 || is_workday === false) {
      if (current === 0) return res.status(400).json({ error: '已经是休息日' });

      if (balance < cost) return res.status(400).json({ error: `余额不足（当前 ${balance} 天，需要 ${cost} 天）` });

      const newBalance = balance - cost;
      db.rest_balance_log.insert({
        date,
        change_amount: -cost,
        reason: '设置休息日',
        balance_after: newBalance,
      });

      db.day_status.upsert(date, { is_workday: 0 });
      return res.json({ is_workday: 0, balance_after: newBalance });
    }

    // 切回工作日：返还余额
    if (current === 1) return res.status(400).json({ error: '已经是工作日' });

    const newBalance = balance + cost;
    db.rest_balance_log.insert({
      date,
      change_amount: cost,
      reason: '恢复工作日',
      balance_after: newBalance,
    });

    db.day_status.upsert(date, { is_workday: 1 });
    res.json({ is_workday: 1, balance_after: newBalance });
  } catch (err) {
    res.status(500).json({ error: err.message || '更新失败' });
  }
});

module.exports = router;
