const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

// Only Admins can manage users
router.route('/')
  .get(protect(['admin']), getUsers);

router.route('/:id')
  .get(protect(['admin']), getUserById)
  .put(protect(['admin']), updateUser)
  .delete(protect(['admin']), deleteUser);

module.exports = router;
