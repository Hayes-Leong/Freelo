# Freelo

> 独立开发者、自由职业者、数字游民、一人公司、超级个体的 OKR 日程管理器

Freelo 是一个以月日历为核心的轻量级 OKR 管理工具，帮助你兼顾季度/月度/周度目标与每日待办。

## 功能特性

- **月日历视图** — 直观查看每日打卡、待办、休息日状态
- **OKR 目标树** — 季度 → 月度 → 周度三级目标拆分，支持关键结果（KR）
- **每日待办** — 核心任务 + 普通待办，支持复选框与设为核心
- **打卡机制** — 完成核心任务后打卡，累计休息奖池余额
- **代办看板** — 随时记录中长期灵感，写每日待办时参考
- **节日/节气标注** — 日历中自动显示中国法定节假日和节气

## 技术栈

- **后端：** Node.js + Express
- **前端：** 原生 HTML/CSS/JS + Tailwind CSS（CDN）
- **存储：** JSON 文件（`data/store.json`）
- **日期处理：** date-fns

## 快速开始

```bash
# 克隆项目
git clone https://github.com/你的用户名/freelo.git
cd freelo

# 安装依赖
npm install

# 启动服务
npm start
```

浏览器打开 `http://localhost:4000`。

默认端口可通过环境变量修改：`PORT=8080 npm start`

## 项目结构

```
freelo/
├── server.js          # Express 入口
├── public/
│   └── index.html     # 全部前端（HTML+CSS+JS）
├── routes/            # API 路由
│   ├── index.js       # 路由汇总
│   ├── calendar.js    # 日历 & 日期状态
│   ├── todos.js       # 每日待办
│   ├── okrs.js        # OKR & KR
│   ├── checkin.js     # 打卡
│   ├── reward.js      # 余额奖池
│   └── ideas.js       # 灵感代办看板
├── db/
│   └── index.js       # JSON 文件数据库
├── data/
│   └── store.json     # 运行时数据（已 gitignore）
└── package.json
```

## 使用说明

1. **左侧 OKR 面板** — 添加季度/月度/周度目标，每个目标可拆分为多个关键结果
2. **中间日历** — 点击日期查看详情，日历格内直接显示待办摘要
3. **右侧详情面板** — 管理当日待办（设为核心任务后打卡）、切换休息日、查看奖池余额
4. **代办看板** — 右下角随时记录灵感，与每日待办独立

### 打卡规则

- 每天最多一个核心任务，完成后方可打卡
- 打卡成功 +0.5 天余额
- 设为休息日消耗 1 天余额
- 未来日期不可打卡

## License

MIT
