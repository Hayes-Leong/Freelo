const express = require('express');
const router = express.Router();

// GET /api/todos?date=YYYY-MM-DD
router.get('/', (req, res) => {
  try {
    const db = req.app.get('db');
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: '缺少 date 参数' });
    const todos = db.todos.getByDate(date);
    res.json({ date, todos });
  } catch (err) {
    res.status(500).json({ error: err.message || '获取待办失败' });
  }
});

// POST /api/todos
router.post('/', (req, res) => {
  try {
    const db = req.app.get('db');
    const { date, content, is_core, task_type, estimated_duration } = req.body;

    if (!date || !content) {
      return res.status(400).json({ error: 'date 和 content 为必填' });
    }
    if (!task_type) {
      return res.status(400).json({ error: 'task_type 为必填（work 或 study）' });
    }
    if (!estimated_duration || estimated_duration < 15) {
      return res.status(400).json({ error: 'estimated_duration 为必填，最小 15 分钟' });
    }

    // 若设为核心任务，先清除该日其他核心
    if (is_core) {
      const existing = db.todos.getByDate(date);
      existing.forEach((t) => {
        if (t.is_core) db.todos.update(t.id, { is_core: 0 });
      });
    }

    const todo = db.todos.insert({
      date,
      content,
      is_core: is_core ? 1 : 0,
      task_type,
      estimated_duration,
    });
    res.status(201).json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message || '创建待办失败' });
  }
});

// PUT /api/todos/:id
router.put('/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const id = Number(req.params.id);
    const todo = db.todos.getById(id);
    if (!todo) return res.status(404).json({ error: '待办不存在' });

    const updates = {};

    if (req.body.content !== undefined) updates.content = req.body.content;
    if (req.body.completed !== undefined) updates.completed = req.body.completed ? 1 : 0;
    if (req.body.is_core !== undefined) {
      updates.is_core = req.body.is_core ? 1 : 0;
      // 若设为核心，清除同日期其他核心
      if (updates.is_core) {
        const siblings = db.todos.getByDate(todo.date);
        siblings.forEach((t) => {
          if (t.id !== id && t.is_core) db.todos.update(t.id, { is_core: 0 });
        });
      }
    }
    if (req.body.task_type !== undefined) updates.task_type = req.body.task_type;
    if (req.body.estimated_duration !== undefined) updates.estimated_duration = req.body.estimated_duration;

    const updated = db.todos.update(id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || '更新待办失败' });
  }
});

// DELETE /api/todos/:id
router.delete('/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const id = Number(req.params.id);
    const ok = db.todos.delete(id);
    if (!ok) return res.status(404).json({ error: '待办不存在' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || '删除待办失败' });
  }
});

module.exports = router;
