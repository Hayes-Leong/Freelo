const express = require('express');
const path = require('path');

// 初始化数据库
const db = require('./db');

const app = express();
app.set('db', db);

// 中间件
app.use(express.json());

// 判断是否为开发模式
const isDev = process.argv.includes('--dev') || process.env.NODE_ENV === 'development';

if (isDev) {
  // 开发模式：Vite Dev Server 做前端代理
  console.log('🔧 开发模式：请同时运行 Vite Dev Server（npm run dev:client）');
  console.log('   或手动运行: npx vite --config vite.config.js');
  app.use(express.static(path.join(__dirname, 'public')));
} else {
  // 生产模式：托管 Vite 构建产物
  app.use(express.static(path.join(__dirname, 'dist')));
}

// API 路由
app.use('/api', require('./routes'));

// SPA 兜底
if (!isDev) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// 统一错误处理
app.use((err, req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.status(500).json({ error: err.message || '服务器内部错误' });
  } else {
    next(err);
  }
});

// 启动服务
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Freelo 已启动：http://localhost:${PORT}`);
  if (isDev) console.log('前端开发服务器默认运行在 http://localhost:3000');
});
