const express = require('express');
const router = express.Router();
const {
  getEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
} = require('../controllers/enrollmentController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect(), getEnrollments)
  .post(protect(['admin']), createEnrollment); // Only Admin enrolls

router.route('/:id')
  .put(protect(['admin']), updateEnrollment) // Only Admin updates (status or class)
  .delete(protect(['admin']), deleteEnrollment);

module.exports = router;
