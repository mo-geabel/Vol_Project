const express = require('express');
const router = express.Router();
const {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  enrollStaffAsStudent,
} = require('../controllers/studentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/staff-enroll', protect(['admin']), enrollStaffAsStudent);

router.route('/')
  .get(protect(), getStudents)
  .post(protect(['admin']), createStudent);

router.route('/:id')
  .get(protect(), getStudentById)
  .put(protect(['admin', 'teacher']), updateStudent)
  .delete(protect(['admin']), deleteStudent);

module.exports = router;
