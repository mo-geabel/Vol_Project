const express = require('express');
const router = express.Router();
const { logQuranProgress, logTheoryProgress, getProgressForEnrollment } = require('../controllers/progressController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/quran')
  .post(protect(), logQuranProgress);

router.route('/theory')
  .post(protect(), logTheoryProgress);

router.route('/:id')
  .get(protect(), getProgressForEnrollment);

module.exports = router;
