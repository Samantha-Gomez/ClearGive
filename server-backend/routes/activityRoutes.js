const express = require('express');
const { getAllActivities } = require('../controllers/activityController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
  '/admin',
  authenticate,
  authorize('admin'),
  getAllActivities
);

module.exports = router;