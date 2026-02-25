const express = require('express');
const router = express.Router();
const { getClassProgressReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/progress/:classId', protect(['admin']), getClassProgressReport);

module.exports = router;
