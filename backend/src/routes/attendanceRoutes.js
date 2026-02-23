const express = require('express');
const router = express.Router();
const { getAttendance, markAttendance } = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect(), markAttendance);

router.route('/:classId/:date')
  .get(protect(), getAttendance);

module.exports = router;
