# Freelo

> 独立开发者、自由职业者、数字游民、一人公司、超级个体的 OKR 日程管理器

Freelo 是一个以月日历为核心的轻量级 OKR 管理工具，融合**柳比歇夫时间管理法**，帮助你兼顾目标规划、每日待办与时间开销统计。

## 功能特性

- **月日历视图** — 直观查看每日打卡、待办、休息日状态，自动标注中国节日/节气
- **OKR 目标树** — 季度 → 月度 → 周度三级目标拆分，支持关键结果（KR）
- **每日待办** — 核心任务 + 普通待办，支持任务类型（工作/学习）和预估时间
- **柳比歇夫计时** — 秒表正计时，暂停/继续保留分段，关闭浏览器后计时继续
- **时间统计** — 今日总结卡片 + ECharts 趋势折线图（周/月/季可切换）
- **打卡机制** — 完成核心任务后打卡，累计休息奖池余额
- **代办看板** — 随时记录中长期灵感，写每日待办时参考
- **温润日式 UI** — 米白底、暖灰文字、稻黄/墨绿配色，克制治愈

## 技术栈

- **后端：** Node.js + Express
- **前端：** Vue 3 (Composition API) + Vite
- **CSS：** Tailwind CSS 3（本地构建，自定义色板）
- **图表：** ECharts 5
- **存储：** JSON 文件（`data/store.json`）
- **日期处理：** date-fns

## 快速开始

```bash
# 克隆项目
git clone https://github.com/你的用户名/freelo.git
cd freelo

# 安装依赖
npm install

# 开发模式（两个终端）
npm run dev          # 终端1: Express 后端 (:4000)
npm run dev:client   # 终端2: Vite 前端 (:3000)

# 浏览器打开 http://localhost:3000

# 生产模式
npm run build        # 构建前端
npm start            # Express 托管一切 (:4000)
```

默认端口可通过环境变量修改：`PORT=8080 npm start`

## 项目结构

```
freelo/
├── server.js              # Express 入口
├── vite.config.js         # Vite 构建配置
├── tailwind.config.js     # Tailwind 温润日式色板
├── src/                   # Vue 前端源码
│   ├── main.js            # 应用入口
│   ├── App.vue            # 根组件
│   ├── styles/main.css    # 全局样式
│   ├── composables/       # 组合式函数
│   │   ├── useApi.js      # API 请求封装
│   │   ├── useTimer.js    # 秒表状态机
│   │   └── useToast.js    # Toast/Confirm
│   └── components/        # Vue 组件
│       ├── layout/        # AppHeader / AppLayout
│       ├── calendar/      # CalendarGrid / CalendarCell
│       ├── todo/          # TodoPanel / TodoItem / TodoForm
│       ├── timer/         # TimerWidget
│       ├── okr/           # OkrPanel / OkrItem / KrList / OkrFormModal
│       ├── stats/         # StatsPanel / TimeChart
│       ├── ideas/         # IdeaKanban
│       └── common/        # ToastContainer / ConfirmModal
├── routes/                # API 路由
│   ├── calendar.js        # 日历 & 日期状态
│   ├── todos.js           # 每日待办（含 task_type、预估时间）
│   ├── okrs.js            # OKR & KR
│   ├── timer.js           # 计时 API（start/pause/resume/stop）
│   ├── stats.js           # 统计 API（daily/range）
│   ├── checkin.js         # 打卡
│   ├── reward.js          # 余额奖池
│   └── ideas.js           # 灵感代办看板
├── db/index.js            # JSON 文件数据库（含自动迁移）
├── data/store.json        # 运行时数据（已 gitignore）
└── package.json
```

## 使用说明

### 日历 & 待办
1. **左侧 OKR 面板** — 添加季度/月度/周度目标，每个目标可拆分为多个关键结果
2. **中间日历** — 点击日期查看详情，日历格内直接显示待办摘要
3. **右侧详情面板** — 管理当日待办、打卡、切换休息日、查看奖池余额

### 计时流程
1. 选中日期 → 创建待办（选择工作/学习类型 + 预估时间）
2. 点击待办旁的 ▶ → 底部弹出秒表面板，开始正计时
3. 可随时暂停/继续，每次暂停产生一个时间分段
4. 点击 ⏹ 停止计时，数据自动保存
5. 关闭浏览器后计时继续在后台运行

### 时间统计
1. 点击右上角 📈 图标打开统计抽屉
2. 上方为今日耗时总结（工作/学习分类）
3. 下方为趋势折线图，可切换周/月/季时间跨度
4. 若今日无记录，显示最近记录日期作为参考

### 打卡规则
- 每天最多一个核心任务，完成后方可打卡
- 打卡成功 +0.5 天余额
- 设为休息日消耗 1 天余额
- 未来日期不可打卡
- 计时与打卡独立，核心任务完成即可打卡

## License

MIT
