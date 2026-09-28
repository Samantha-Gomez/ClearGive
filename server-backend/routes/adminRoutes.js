const express = require('express');

const {
  getAdminUserStats,
} = require('../controllers/adminController');

const {
  authenticate,
  authorize,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  getAdminUserStats,
);

module.exports = router;
