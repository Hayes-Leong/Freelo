// 2026 年节气 + 公历节日数据
// 节气日期为近似值（±1天浮动），节日为公历固定日期

const CALENDAR_2026 = {
  // 节气 (date: 'MM-DD' -> { name, emoji })
  '01-05': { name: '小寒', emoji: '❄️', type: 'term' },
  '01-20': { name: '大寒', emoji: '🥶', type: 'term' },
  '02-04': { name: '立春', emoji: '🌱', type: 'term' },
  '02-19': { name: '雨水', emoji: '🌧️', type: 'term' },
  '03-06': { name: '惊蛰', emoji: '⚡', type: 'term' },
  '03-21': { name: '春分', emoji: '🌸', type: 'term' },
  '04-05': { name: '清明', emoji: '🍃', type: 'term' },
  '04-20': { name: '谷雨', emoji: '🌾', type: 'term' },
  '05-05': { name: '立夏', emoji: '🌿', type: 'term' },
  '05-21': { name: '小满', emoji: '🌻', type: 'term' },
  '06-06': { name: '芒种', emoji: '🌾', type: 'term' },
  '06-21': { name: '夏至', emoji: '☀️', type: 'term' },
  '07-07': { name: '小暑', emoji: '🔥', type: 'term' },
  '07-23': { name: '大暑', emoji: '☀️', type: 'term' },
  '08-07': { name: '立秋', emoji: '🍂', type: 'term' },
  '08-23': { name: '处暑', emoji: '🌤️', type: 'term' },
  '09-08': { name: '白露', emoji: '💧', type: 'term' },
  '09-23': { name: '秋分', emoji: '🍁', type: 'term' },
  '10-08': { name: '寒露', emoji: '🥀', type: 'term' },
  '10-23': { name: '霜降', emoji: '❄️', type: 'term' },
  '11-07': { name: '立冬', emoji: '🧊', type: 'term' },
  '11-22': { name: '小雪', emoji: '🌨️', type: 'term' },
  '12-07': { name: '大雪', emoji: '⛄', type: 'term' },
  '12-22': { name: '冬至', emoji: '🥟', type: 'term' },

  // 公历节日
  '01-01': { name: '元旦', emoji: '🎉', type: 'holiday' },
  '02-14': { name: '情人节', emoji: '💝', type: 'holiday' },
  '03-08': { name: '妇女节', emoji: '👩', type: 'holiday' },
  '03-12': { name: '植树节', emoji: '🌳', type: 'holiday' },
  '04-01': { name: '愚人节', emoji: '😜', type: 'holiday' },
  '05-01': { name: '劳动节', emoji: '🛠️', type: 'holiday' },
  '05-04': { name: '青年节', emoji: '🌟', type: 'holiday' },
  '06-01': { name: '儿童节', emoji: '🧒', type: 'holiday' },
  '07-01': { name: '建党节', emoji: '🚩', type: 'holiday' },
  '08-01': { name: '建军节', emoji: '⭐', type: 'holiday' },
  '09-10': { name: '教师节', emoji: '📚', type: 'holiday' },
  '10-01': { name: '国庆节', emoji: '🇨🇳', type: 'holiday' },
  '12-25': { name: '圣诞节', emoji: '🎄', type: 'holiday' },
};

// 根据完整日期 YYYY-MM-DD 查找标注
function getAnnotation(dateStr) {
  const mmdd = dateStr.slice(5); // 'MM-DD'
  const entry = CALENDAR_2026[mmdd];

  // 同一天可能既有节气又有节日，优先显示节气
  if (!entry) return null;

  // 特殊：清明既是节气也是节日
  if (mmdd === '04-05') return { name: '清明节', emoji: '🍃', type: 'holiday' };
  // 元旦覆盖节气（如果冲突）
  if (mmdd === '01-01') return { name: '元旦', emoji: '🎉', type: 'holiday' };

  return entry;
}

module.exports = { getAnnotation };
