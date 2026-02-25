const express = require('express');
const router = express.Router();
const { 
  logQuranProgress, 
  logNotPrepared, 
  logTheoryProgress, 
  getClassDailyProgress,
  getProgressForEnrollment, 
  getSurahs 
} = require('../controllers/progressController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/surahs', protect(), getSurahs);
router.get('/class/:classId/date/:date', protect(), getClassDailyProgress);

router.route('/quran')
  .post(protect(), logQuranProgress);

router.route('/not-prepared')
  .post(protect(), logNotPrepared);

router.route('/theory')
  .post(protect(), logTheoryProgress);

router.get('/enrollment/:id', protect(), getProgressForEnrollment);

module.exports = router;
