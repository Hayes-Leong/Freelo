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
  config: {
    reward_per_checkin: '0.5',
    initial_rest_balance: '0',
  },
  _nextId: 1,
};

// 从磁盘加载，或初始化默认数据
function load() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
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
save(data); // 首次启动写入初始数据

const db = {
  // 获取原始数据引用（仅用于内部操作）
  _data: data,

  // 保存
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
        // 删 key_results
        data.key_results = data.key_results.filter((kr) => kr.okr_id !== oid);
        // 解除关联 todos
        data.todos.forEach((t) => {
          if (t.okr_id === oid) t.okr_id = null;
        });
      });

      data.okrs = data.okrs.filter((r) => !idsToDelete.has(r.id));
      save(data);
      return true;
    },
    // 获取某 OKR 的子级
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
      return data.todos.filter((t) => t.date === date).sort((a, b) => a.sort_order - b.sort_order);
    },
    getById(id) {
      return data.todos.find((t) => t.id === id) || null;
    },
    insert(row) {
      const record = { id: nextId(data), completed: 0, is_core: 0, sort_order: 0, okr_id: null, ...row };
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
      save(data);
      return true;
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
    // 获取某月所有记录
    getByMonth(monthPrefix) {
      // monthPrefix = 'YYYY-MM'
      return data.day_status.filter((d) => d.date.startsWith(monthPrefix));
    },
    // 设置或更新日期状态
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
};

module.exports = db;
