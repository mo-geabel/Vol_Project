const express = require('express');
const router = express.Router();
const { 
  getTeachersAttendance, 
  markTeachersAttendance,
  getTeacherAttendanceHistory
} = require('../controllers/teacherAttendanceController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect(['admin']));

router.get('/history/:id', getTeacherAttendanceHistory);
router.get('/:date', getTeachersAttendance);
router.post('/', markTeachersAttendance);

module.exports = router;
