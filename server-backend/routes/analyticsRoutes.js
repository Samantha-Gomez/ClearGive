const express = require('express');

const {
  getAdminAnalytics,
} = require('../controllers/analyticsController');

const {
  authenticate,
  authorize,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  getAdminAnalytics,
);

module.exports = router;
