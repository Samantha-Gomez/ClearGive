const express = require('express');
const {
  listAdminDrives,
  getAdminDrive,
} = require('../controllers/donationDriveController');
const {
  authenticate,
  authorize,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.get(
  '/',
  authenticate,
  authorize('admin'),
  listAdminDrives,
);

router.get(
  '/:id',
  authenticate,
  authorize('admin'),
  getAdminDrive,
);

module.exports = router;