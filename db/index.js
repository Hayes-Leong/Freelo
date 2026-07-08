const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'store.json');

// 确保 data 目录存在
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// 初始数据结构
const DEFAULT_DATA = {
  okrs: [],
  key_results: [],
  todos: [],
  day_status: [],
  rest_balance_log: [],
  ideas: [],
  time_records: [],
  _timer_state: {
    current_todo_id: null,
    current_start_time: null,
    status: 'idle', // idle | running | paused
  },
  config: {
    reward_per_checkin: '0.5',
    initial_rest_balance: '0',
  },
  _nextId: 1,
};

// 从磁盘加载
function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const data = JSON.parse(raw);
    // 迁移：补全新字段
    return migrate(data);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

// 数据迁移：补全旧数据中没有的字段
function migrate(data) {
  let changed = false;

  // 迁移 todos：补全 task_type 和 estimated_duration
  if (!data.time_records) {
    data.time_records = [];
    changed = true;
  }
  if (!data._timer_state) {
    data._timer_state = {
      current_todo_id: null,
      current_start_time: null,
      status: 'idle',
    };
    changed = true;
  }
  if (Array.isArray(data.todos)) {
    data.todos.forEach((t) => {
      if (!t.hasOwnProperty('task_type')) {
        t.task_type = 'work';
        changed = true;
      }
      if (!t.hasOwnProperty('estimated_duration')) {
        t.estimated_duration = 60;
        changed = true;
      }
    });
  }

  return data;
}

// 保存到磁盘
function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// 自动 ID 生成
function nextId(data) {
  return data._nextId++;
}

// ---- 数据库实例 ----
let data = load();
save(data); // 首次启动写入初始数据（含迁移结果）

const db = {
  _data: data,

  _save() {
    save(data);
  },

  // ---- OKR ----
  okrs: {
    all() {
      return data.okrs;
    },
    getById(id) {
      return data.okrs.find((r) => r.id === id) || null;
    },
    insert(row) {
      const record = { id: nextId(data), ...row, created_at: new Date().toISOString() };
      data.okrs.push(record);
      save(data);
      return record;
    },
    update(id, updates) {
      const idx = data.okrs.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      data.okrs[idx] = { ...data.okrs[idx], ...updates };
      save(data);
      return data.okrs[idx];
    },
    delete(id) {
      const idx = data.okrs.findIndex((r) => r.id === id);
      if (idx === -1) return false;

      // 递归收集所有子孙 OKR id
      const idsToDelete = new Set();
      function collectChildren(parentId) {
        idsToDelete.add(parentId);
        data.okrs.filter((o) => o.parent_id === parentId).forEach((child) => collectChildren(child.id));
      }
      collectChildren(id);

      // 删除所有子孙 OKR 及其 key_results
      idsToDelete.forEach((oid) => {
        data.key_results = data.key_results.filter((kr) => kr.okr_id !== oid);
        data.todos.forEach((t) => {
          if (t.okr_id === oid) t.okr_id = null;
        });
      });

      data.okrs = data.okrs.filter((r) => !idsToDelete.has(r.id));
      save(data);
      return true;
    },
    getChildren(parentId) {
      return data.okrs.filter((o) => o.parent_id === parentId);
    },
  },

  // ---- 关键结果 ----
  key_results: {
    getByOkr(okrId) {
      return data.key_results.filter((kr) => kr.okr_id === okrId);
    },
    insert(row) {
      const record = { id: nextId(data), completed: 0, ...row };
      data.key_results.push(record);
      save(data);
      return record;
    },
    update(id, updates) {
      const idx = data.key_results.findIndex((kr) => kr.id === id);
      if (idx === -1) return null;
      data.key_results[idx] = { ...data.key_results[idx], ...updates };
      save(data);
      return data.key_results[idx];
    },
    delete(id) {
      const idx = data.key_results.findIndex((kr) => kr.id === id);
      if (idx === -1) return false;
      data.key_results.splice(idx, 1);
      save(data);
      return true;
    },
  },

  // ---- 待办 ----
  todos: {
    getByDate(date) {
      return data.todos
        .filter((t) => t.date === date)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((t) => {
          // 计算该 todo 的总已记录时长
          const records = data.time_records.filter(
            (tr) => tr.todo_id === t.id && tr.status === 'completed'
          );
          const total_elapsed = records.reduce((sum, tr) => sum + (tr.duration_minutes || 0), 0);
          return { ...t, total_elapsed };
        });
    },
    getById(id) {
      return data.todos.find((t) => t.id === id) || null;
    },
    insert(row) {
      const record = {
        id: nextId(data),
        completed: 0,
        is_core: 0,
        sort_order: 0,
        okr_id: null,
        task_type: 'work',
        estimated_duration: 60,
        ...row,
      };
      data.todos.push(record);
      save(data);
      return record;
    },
    update(id, updates) {
      const idx = data.todos.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      data.todos[idx] = { ...data.todos[idx], ...updates };
      save(data);
      return data.todos[idx];
    },
    delete(id) {
      const idx = data.todos.findIndex((t) => t.id === id);
      if (idx === -1) return false;
      data.todos.splice(idx, 1);
      // 级联删除时间记录
      data.time_records = data.time_records.filter((tr) => tr.todo_id !== id);
      save(data);
      return true;
    },
  },

  // ---- 时间记录 ----
  time_records: {
    getByTodo(todoId) {
      return data.time_records.filter((tr) => tr.todo_id === todoId);
    },
    getByDate(date) {
      return data.time_records.filter((tr) => tr.date === date);
    },
    getByDateRange(start, end) {
      return data.time_records.filter(
        (tr) => tr.date >= start && tr.date <= end && tr.status === 'completed'
      );
    },
    insert(row) {
      const record = { id: nextId(data), ...row };
      data.time_records.push(record);
      save(data);
      return record;
    },
    update(id, updates) {
      const idx = data.time_records.findIndex((tr) => tr.id === id);
      if (idx === -1) return null;
      data.time_records[idx] = { ...data.time_records[idx], ...updates };
      save(data);
      return data.time_records[idx];
    },
    // 获取当前运行中的记录
    getRunning() {
      return data.time_records.find((tr) => tr.status === 'running');
    },
  },

  // ---- 计时器全局状态 ----
  timer_state: {
    get() {
      return data._timer_state;
    },
    set(updates) {
      Object.assign(data._timer_state, updates);
      save(data);
    },
  },

  // ---- 灵感代办 ----
  ideas: {
    all() {
      return [...(data.ideas || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },
    insert(row) {
      const record = { id: nextId(data), content: '', created_at: new Date().toISOString(), ...row };
      (data.ideas || (data.ideas = [])).push(record);
      save(data);
      return record;
    },
    delete(id) {
      const idx = (data.ideas || []).findIndex((i) => i.id === id);
      if (idx === -1) return false;
      data.ideas.splice(idx, 1);
      save(data);
      return true;
    },
  },

  // ---- 日历日期状态 ----
  day_status: {
    get(date) {
      return data.day_status.find((d) => d.date === date) || null;
    },
    getByMonth(monthPrefix) {
      return data.day_status.filter((d) => d.date.startsWith(monthPrefix));
    },
    upsert(date, updates) {
      const existing = data.day_status.find((d) => d.date === date);
      if (existing) {
        Object.assign(existing, updates);
      } else {
        data.day_status.push({ date, is_workday: 1, checkin_done: 0, core_done: 0, note: '', ...updates });
      }
      save(data);
      return data.day_status.find((d) => d.date === date);
    },
  },

  // ---- 余额流水 ----
  rest_balance_log: {
    all() {
      return data.rest_balance_log;
    },
    getLast() {
      if (data.rest_balance_log.length === 0) return null;
      return data.rest_balance_log[data.rest_balance_log.length - 1];
    },
    insert(row) {
      const record = { id: nextId(data), ...row };
      data.rest_balance_log.push(record);
      save(data);
      return record;
    },
    getPage(limit, offset) {
      const sorted = [...data.rest_balance_log].reverse();
      return sorted.slice(offset, offset + limit);
    },
  },

  // ---- 配置 ----
  config: {
    all() {
      return data.config;
    },
    get(key) {
      return data.config[key] || null;
    },
    set(key, value) {
      data.config[key] = value;
      save(data);
    },
  },

  // ---- 统计辅助方法 ----
  stats: {
    // 某日的统计摘要
    dailySummary(date) {
      const records = data.time_records.filter(
        (tr) => tr.date === date && tr.status === 'completed'
      );
      const totalMinutes = records.reduce((s, tr) => s + (tr.duration_minutes || 0), 0);

      // 按任务类型分组
      const workRecords = records.filter((tr) => {
        const todo = data.todos.find((t) => t.id === tr.todo_id);
        return todo && todo.task_type === 'work';
      });
      const studyRecords = records.filter((tr) => {
        const todo = data.todos.find((t) => t.id === tr.todo_id);
        return todo && todo.task_type === 'study';
      });

      const workMinutes = workRecords.reduce((s, tr) => s + (tr.duration_minutes || 0), 0);
      const studyMinutes = studyRecords.reduce((s, tr) => s + (tr.duration_minutes || 0), 0);

      const completedTodos = data.todos.filter(
        (t) => t.date === date && t.completed === 1
      ).length;

      return {
        date,
        total_minutes: totalMinutes,
        work_minutes: workMinutes,
        study_minutes: studyMinutes,
        completed_todos: completedTodos,
      };
    },

    // 日期范围内的每日统计（用于折线图）
    rangeSummary(start, end) {
      const days = [];
      const current = new Date(start + 'T00:00:00');
      const endDate = new Date(end + 'T00:00:00');

      while (current <= endDate) {
        const dateStr = current.toISOString().slice(0, 10);
        days.push(db.stats.dailySummary(dateStr));
        current.setDate(current.getDate() + 1);
      }

      return { start, end, days };
    },
  },
};

module.exports = db;
