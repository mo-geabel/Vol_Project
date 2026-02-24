const express = require('express');
const router = express.Router();
const { getAdminStats } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/stats', protect(['admin']), getAdminStats);

module.exports = router;
