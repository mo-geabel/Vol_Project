const express = require('express');
const router = express.Router();
const { getTeacherStats, getTeacherClasses } = require('../controllers/teacherController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/stats', protect(['teacher']), getTeacherStats);
router.get('/classes', protect(['teacher']), getTeacherClasses);

module.exports = router;
