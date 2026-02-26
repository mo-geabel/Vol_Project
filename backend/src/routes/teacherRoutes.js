const express = require('express');
const router = express.Router();
const { getTeacherStats, getTeacherClasses, getTeacherTopStudents, getTeacherDashboardGraphs } = require('../controllers/teacherController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/stats', protect(['teacher']), getTeacherStats);
router.get('/classes', protect(['teacher']), getTeacherClasses);
router.get('/top-students', protect(['teacher']), getTeacherTopStudents);
router.get('/graphs', protect(['teacher']), getTeacherDashboardGraphs);

module.exports = router;
