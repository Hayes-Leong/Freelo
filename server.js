const express = require('express');
const path = require('path');

// 初始化数据库
const db = require('./db');

const app = express();
app.set('db', db);

// 中间件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API 路由
app.use('/api', require('./routes'));

// SPA 兜底：非 API 的 GET 请求返回首页
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
});
