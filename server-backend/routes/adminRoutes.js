const express = require('express');

const {
  getAdminUserStats,
  listAdminUsers,
  updateAdminUserStatus,
} = require('../controllers/adminController');

const {
  authenticate,
  authorize,
} = require('../middleware/authMiddleware');
const {
  validateObjectId,
  validateAdminUserStatus,
} = require('../middleware/validation');

const router = express.Router();

router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  getAdminUserStats,
);

router.get(
  '/users',
  authenticate,
  authorize('admin'),
  listAdminUsers,
);

router.patch(
  '/users/:id/status',
  authenticate,
  authorize('admin'),
  validateObjectId,
  validateAdminUserStatus,
  updateAdminUserStatus,
);

module.exports = router;
