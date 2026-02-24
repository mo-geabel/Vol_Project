const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect(['admin']), settingsController.getSettings);
router.post('/', protect(['admin']), settingsController.updateSettings);

module.exports = router;
