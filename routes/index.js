const express = require('express');
const router = express.Router();

// 健康检查端点
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/calendar', require('./calendar'));
router.use('/todos', require('./todos'));
router.use('/checkin', require('./checkin'));
router.use('/reward', require('./reward'));
router.use('/okrs', require('./okrs'));
router.use('/ideas', require('./ideas'));

module.exports = router;
