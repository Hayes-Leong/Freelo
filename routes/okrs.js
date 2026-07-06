const express = require('express');
const router = express.Router();
const {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachWeekOfInterval,
  format,
  parse,
} = require('date-fns');

// 季度划分：3-5=Q1, 6-8=Q2, 9-11=Q3, 12-2=Q4
const QUARTER_MONTHS = {
  1: [3, 4, 5],
  2: [6, 7, 8],
  3: [9, 10, 11],
  4: [12, 1, 2],
};

function getQuarterInfo(monthStr) {
  const d = parse(monthStr, 'yyyy-MM', new Date());
  const m = d.getMonth() + 1; // 1-12
  const y = d.getFullYear();

  // 计算季度
  const shifted = (m - 3 + 12) % 12;
  const q = Math.floor(shifted / 3) + 1;
  const yearLabel = (m === 1 || m === 2) ? y - 1 : y;

  // 季度包含的月份
  const months = QUARTER_MONTHS[q];

  // 季度起止日期
  const firstM = months[0];
  const lastM = months[2];
  const startYear = (q === 4 && months[0] === 12) ? yearLabel : yearLabel;
  const endYear = (q === 4 && months[2] <= 2) ? yearLabel + 1 : yearLabel;

  const start = `${startYear}-${String(firstM).padStart(2, '0')}-01`;
  const end = format(endOfMonth(new Date(endYear, lastM - 1, 1)), 'yyyy-MM-dd');

  return { q, yearLabel, months, start, end };
}

// 月份中文名
const MONTH_NAMES = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

function overlaps(a1, a2, b1, b2) {
  return a1 <= b2 && a2 >= b1;
}

// ---- GET /api/okrs?month=YYYY-MM ----
router.get('/', (req, res) => {
  try {
    const db = req.app.get('db');
    const monthStr = req.query.month || format(new Date(), 'yyyy-MM');
    const info = getQuarterInfo(monthStr);

    // 查找该季度下所有季度级别的 OKR
    const quarterOkrs = db.okrs.all().filter((o) =>
      o.level === 'quarter' && overlaps(o.start_date, o.end_date, info.start, info.end)
    );
    quarterOkrs.forEach((o) => { o.krs = db.key_results.getByOkr(o.id); });

    // 构建每个月份的数据（含 OKR 和周 OKR）
    const monthSlots = info.months.map((mn) => {
      const mYear = (info.q === 4 && mn <= 2) ? info.yearLabel + 1 : info.yearLabel;
      const mStart = `${mYear}-${String(mn).padStart(2, '0')}-01`;
      const mEnd = format(endOfMonth(new Date(mYear, mn - 1, 1)), 'yyyy-MM-dd');

      // 该月份的月度 OKR
      const mOkrs = db.okrs.all().filter((o) =>
        o.level === 'month' && overlaps(o.start_date, o.end_date, mStart, mEnd)
      );
      mOkrs.forEach((mo) => {
        mo.krs = db.key_results.getByOkr(mo.id);
        // 子周度 OKR
        mo.weeks = db.okrs.all().filter((wo) =>
          wo.level === 'week' && wo.parent_id === mo.id &&
          overlaps(wo.start_date, wo.end_date, mStart, mEnd)
        );
        mo.weeks.forEach((wo) => {
          wo.krs = db.key_results.getByOkr(wo.id);
        });
      });

      return {
        month: mn,
        label: MONTH_NAMES[mn - 1],
        start: mStart,
        end: mEnd,
        okrs: mOkrs,
        // 该月的周列表（用于添加周 OKR 时选择）
        weeks: eachWeekOfInterval(
          { start: new Date(mStart + 'T00:00:00'), end: new Date(mEnd + 'T00:00:00') },
          { weekStartsOn: 1 }
        ).map((ws) => ({
          start: format(ws, 'yyyy-MM-dd'),
          end: format(endOfWeek(ws, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          label: format(ws, 'M/d') + '-' + format(endOfWeek(ws, { weekStartsOn: 1 }), 'M/d'),
        })),
      };
    });

    res.json({
      quarterLabel: `${info.yearLabel}年第${['一', '二', '三', '四'][info.q - 1]}季度`,
      quarterYear: info.yearLabel,
      quarterNum: info.q,
      quarters: quarterOkrs,
      months: monthSlots,
    });
  } catch (err) {
    res.status(500).json({ error: err.message || '获取 OKR 失败' });
  }
});

// ---- POST /api/okrs （日期自动计算）----
router.post('/', (req, res) => {
  try {
    const db = req.app.get('db');
    const { level, title, parent_id, month: refMonth, weekStart, weekEnd } = req.body;

    if (!level || !title) {
      return res.status(400).json({ error: 'level 和 title 为必填' });
    }
    if (!['quarter', 'month', 'week'].includes(level)) {
      return res.status(400).json({ error: 'level 必须是 quarter/month/week' });
    }

    // 自动计算日期
    let start_date, end_date;
    const refMonthStr = (refMonth || format(new Date(), 'yyyy-MM')).slice(0, 7);

    if (level === 'quarter') {
      const info = getQuarterInfo(refMonthStr);
      start_date = info.start;
      end_date = info.end;
    } else if (level === 'month') {
      const info = getQuarterInfo(refMonthStr);
      // refMonth 应指定具体月份，默认取当前月份
      const m = refMonth ? parseInt(refMonth.split('-')[1]) : (new Date().getMonth() + 1);
      const mYear = parseInt(refMonthStr.split('-')[0]);
      start_date = `${mYear}-${String(m).padStart(2, '0')}-01`;
      end_date = format(endOfMonth(new Date(mYear, m - 1, 1)), 'yyyy-MM-dd');
    } else if (level === 'week') {
      if (!weekStart || !weekEnd) {
        return res.status(400).json({ error: '周度 OKR 需要 weekStart 和 weekEnd' });
      }
      start_date = weekStart;
      end_date = weekEnd;
    }

    const okr = db.okrs.insert({
      level,
      title,
      start_date,
      end_date,
      parent_id: parent_id || null,
    });
    res.status(201).json(okr);
  } catch (err) {
    res.status(500).json({ error: err.message || '创建 OKR 失败' });
  }
});

// ---- PUT /api/okrs/:id ----
router.put('/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const id = Number(req.params.id);
    const okr = db.okrs.getById(id);
    if (!okr) return res.status(404).json({ error: 'OKR 不存在' });

    const updates = {};
    if (req.body.title !== undefined) updates.title = req.body.title;
    if (req.body.start_date !== undefined) updates.start_date = req.body.start_date;
    if (req.body.end_date !== undefined) updates.end_date = req.body.end_date;

    const updated = db.okrs.update(id, updates);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message || '更新 OKR 失败' });
  }
});

// ---- DELETE /api/okrs/:id ----
router.delete('/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const id = Number(req.params.id);
    const ok = db.okrs.delete(id);
    if (!ok) return res.status(404).json({ error: 'OKR 不存在' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message || '删除 OKR 失败' });
  }
});

// ---- KR CRUD ----
router.get('/:id/krs', (req, res) => {
  try {
    const db = req.app.get('db');
    const krs = db.key_results.getByOkr(Number(req.params.id));
    res.json({ krs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/krs', (req, res) => {
  try {
    const db = req.app.get('db');
    const okrId = Number(req.params.id);
    if (!db.okrs.getById(okrId)) return res.status(404).json({ error: 'OKR 不存在' });
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content 为必填' });
    const kr = db.key_results.insert({ okr_id: okrId, content });
    res.status(201).json(kr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/krs/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    const id = Number(req.params.id);
    const updates = {};
    if (req.body.content !== undefined) updates.content = req.body.content;
    if (req.body.completed !== undefined) updates.completed = req.body.completed ? 1 : 0;
    const kr = db.key_results.update(id, updates);
    if (!kr) return res.status(404).json({ error: 'KR 不存在' });
    res.json(kr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/krs/:id', (req, res) => {
  try {
    const db = req.app.get('db');
    if (!db.key_results.delete(Number(req.params.id))) return res.status(404).json({ error: 'KR 不存在' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
