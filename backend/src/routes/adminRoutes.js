const express = require('express');
const router = express.Router();
const { getAdminStats, getTopStudents, getDashboardGraphs, getDatabaseStatus } = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/stats', protect(['admin']), getAdminStats);
router.get('/top-students', protect(['admin']), getTopStudents);
router.get('/graphs', protect(['admin']), getDashboardGraphs);
router.get('/db-status', protect(['admin']), getDatabaseStatus);

module.exports = router;
