const express = require('express');
const router = express.Router();
const {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} = require('../controllers/classController');
const { protect } = require('../middlewares/authMiddleware');

// Accessible by both admin and teacher (internally handled)
router.route('/')
  .get(protect(), getClasses)
  .post(protect(['admin']), createClass); // Only Admin creates

router.route('/:id')
  .get(protect(), getClassById)
  .put(protect(['admin']), updateClass) // Only admin updates
  .delete(protect(['admin']), deleteClass); // Only admin deletes

module.exports = router;
