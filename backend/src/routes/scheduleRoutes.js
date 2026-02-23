const express = require('express');
const router = express.Router();
const {
  getSchedule,
  setupSchedule,
} = require('../controllers/scheduleController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect(['admin']), setupSchedule); // Only admin configures calendar

router.route('/:monthYear')
  .get(protect(), getSchedule);

module.exports = router;
