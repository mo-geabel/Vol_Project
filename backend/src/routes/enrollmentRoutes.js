const express = require('express');
const router = express.Router();
const {
  getEnrollments,
  createEnrollment,
  updateEnrollmentStatus,
  deleteEnrollment,
} = require('../controllers/enrollmentController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect(), getEnrollments)
  .post(protect(['admin']), createEnrollment); // Only Admin enrolls

router.route('/:id')
  .put(protect(['admin']), updateEnrollmentStatus) // Only Admin updates status (e.g. reactivates)
  .delete(protect(['admin']), deleteEnrollment);

module.exports = router;
