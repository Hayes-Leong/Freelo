const express = require('express');
const router = express.Router();

/**
 * POST /api/timer/start
 * 开始计时。自动停止上一个运行中的计时。
 * Body: { todo_id, date }
 */
router.post('/start', (req, res) => {
  try {
    const db = req.app.get('db');
    const { todo_id, date } = req.body;
    const recordType = req.body.record_type || 'manual';

    if (!todo_id || !date) {
      return res.status(400).json({ error: '缺少 todo_id 或 date' });
    }

    const todo = db.todos.getById(todo_id);
    if (!todo) {
      return res.status(404).json({ error: '待办不存在' });
    }

    if (todo.date !== date) {
      return res.status(400).json({ error: '任务日期不匹配' });
    }

    // 如果已有运行中的计时，先自动停止
    const runningRecord = db.time_records.getRunning();
    if (runningRecord) {
      const now = new Date();
      const startTime = new Date(runningRecord.start_time);
      const durationMinutes = Math.round((now - startTime) / 60000);
      db.time_records.update(runningRecord.id, {
        end_time: now.toISOString(),
        duration_minutes: Math.max(0, durationMinutes),
        status: 'completed',
      });
    }

    // 获取该 todo 已完成的分段
    const completedSegments = db.time_records.getByTodo(todo_id)
      .filter(tr => tr.status === 'completed');

    // 创建新的计时分段
    const now = new Date().toISOString();
    const record = db.time_records.insert({
      todo_id,
      date,
      start_time: now,
      end_time: null,
      duration_minutes: 0,
      status: 'running',
      record_type: recordType,
    });

    // 更新全局计时器状态
    db.timer_state.set({
      current_todo_id: todo_id,
      current_start_time: now,
      status: 'running',
      record_type: recordType,
    });

    res.status(201).json({
      ...record,
      segments: completedSegments.map(s => ({
        duration_minutes: s.duration_minutes,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || '开始计时失败' });
  }
});

/**
 * POST /api/timer/pause
 * 暂停当前计时。计算当前分段的时长。
 */
router.post('/pause', (req, res) => {
  try {
    const db = req.app.get('db');
    const timerState = db.timer_state.get();

    if (timerState.status !== 'running') {
      return res.status(400).json({ error: '当前没有运行中的计时' });
    }

    const runningRecord = db.time_records.getRunning();
    if (!runningRecord) {
      // 状态不一致，修复
      db.timer_state.set({ current_todo_id: null, current_start_time: null, status: 'idle' });
      return res.status(400).json({ error: '未找到运行中的计时记录' });
    }

    const now = new Date();
    const startTime = new Date(runningRecord.start_time);
    const durationMinutes = Math.round((now - startTime) / 60000);

    // 更新当前分段为已完成
    db.time_records.update(runningRecord.id, {
      end_time: now.toISOString(),
      duration_minutes: Math.max(0, durationMinutes),
      status: 'completed',
    });

    // 更新全局状态
    db.timer_state.set({
      current_todo_id: runningRecord.todo_id,
      current_start_time: null,
      status: 'paused',
    });

    // 返回所有已完成的 segments
    const allSegments = db.time_records.getByTodo(runningRecord.todo_id)
      .filter(tr => tr.status === 'completed');

    res.json({
      status: 'paused',
      segments: allSegments.map(s => ({
        duration_minutes: s.duration_minutes,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || '暂停失败' });
  }
});

/**
 * POST /api/timer/resume
 * 继续计时。创建新的计时分段。
 */
router.post('/resume', (req, res) => {
  try {
    const db = req.app.get('db');
    const timerState = db.timer_state.get();

    if (timerState.status !== 'paused') {
      return res.status(400).json({ error: '当前没有暂停中的计时' });
    }

    if (!timerState.current_todo_id) {
      return res.status(400).json({ error: '计时状态异常' });
    }

    const now = new Date().toISOString();

    // 创建新的计时分段
    const todo = db.todos.getById(timerState.current_todo_id);
    const record = db.time_records.insert({
      todo_id: timerState.current_todo_id,
      date: todo ? todo.date : new Date().toISOString().slice(0, 10),
      start_time: now,
      end_time: null,
      duration_minutes: 0,
      status: 'running',
      record_type: timerState.record_type || 'manual',
    });

    // 更新全局状态
    db.timer_state.set({
      current_todo_id: timerState.current_todo_id,
      current_start_time: now,
      status: 'running',
    });

    // 返回已完成的分段
    const completedSegments = db.time_records.getByTodo(timerState.current_todo_id)
      .filter(tr => tr.status === 'completed');

    res.json({
      ...record,
      segments: completedSegments.map(s => ({
        duration_minutes: s.duration_minutes,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || '恢复失败' });
  }
});

/**
 * POST /api/timer/stop
 * 停止计时。结束当前分段。
 */
router.post('/stop', (req, res) => {
  try {
    const db = req.app.get('db');
    const timerState = db.timer_state.get();

    if (timerState.status === 'idle') {
      return res.status(400).json({ error: '当前没有运行中的计时' });
    }

    const runningRecord = db.time_records.getRunning();
    if (runningRecord) {
      const now = new Date();
      const startTime = new Date(runningRecord.start_time);
      const durationMinutes = Math.round((now - startTime) / 60000);
      db.time_records.update(runningRecord.id, {
        end_time: now.toISOString(),
        duration_minutes: Math.max(0, durationMinutes),
        status: 'completed',
      });
    }

    const todoId = timerState.current_todo_id;

    // 重置全局状态
    db.timer_state.set({
      current_todo_id: null,
      current_start_time: null,
      status: 'idle',
    });

    // 返回所有分段
    const allSegments = todoId
      ? db.time_records.getByTodo(todoId).filter(tr => tr.status === 'completed')
      : [];

    const lastId = allSegments.length > 0 ? allSegments[allSegments.length - 1].id : null;

    res.json({
      status: 'idle',
      last_record_id: lastId,
      total_minutes: allSegments.reduce((s, seg) => s + (seg.duration_minutes || 0), 0),
      segments: allSegments.map(s => ({
        id: s.id,
        duration_minutes: s.duration_minutes,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || '停止失败' });
  }
});

/**
 * PUT /api/timer/record/:id
 * 更新分段类型（番茄完成后将 manual 升级为 pomodoro）
 */
router.put('/record/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const id = Number(req.params.id);
    const { record_type } = req.body;
    if (!record_type) return res.status(400).json({ error: '缺少 record_type' });
    const updated = db.time_records.update(id, { record_type });
    if (!updated) return res.status(404).json({ error: '记录不存在' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || '更新失败' });
  }
});

/**
 * GET /api/timer/current
 * 获取当前计时状态（用于页面刷新后恢复）
 */
router.get('/current', (req, res) => {
  try {
    const db = req.app.get('db');
    const timerState = db.timer_state.get();

    if (timerState.status === 'idle' || !timerState.current_todo_id) {
      return res.json({ status: 'idle' });
    }

    const todo = db.todos.getById(timerState.current_todo_id);

    // 获取已完成的分段
    const completedSegments = db.time_records.getByTodo(timerState.current_todo_id)
      .filter(tr => tr.status === 'completed');

    // 获取运行中的记录
    const runningRecord = db.time_records.getRunning();

    res.json({
      status: timerState.status,
      todo_id: timerState.current_todo_id,
      todo_content: todo ? todo.content : '',
      date: todo ? todo.date : '',
      start_time: runningRecord ? runningRecord.start_time : timerState.current_start_time,
      segments: completedSegments.map(s => ({
        duration_minutes: s.duration_minutes,
        start_time: s.start_time,
        end_time: s.end_time,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message || '获取计时状态失败' });
  }
});

module.exports = router;
