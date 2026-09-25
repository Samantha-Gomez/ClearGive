const express = require('express');
const {
  listPublicActiveDrives,
  getPublicActiveDrive,
} = require('../controllers/donationDriveController');
const { recordDonation } = require('../controllers/donationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  validateObjectId,
  validatePublicDriveQuery,
  validateDonationCreation,
} = require('../middleware/validation');

const router = express.Router();

router.get('/', validatePublicDriveQuery, listPublicActiveDrives);
router.get('/:id', validateObjectId, getPublicActiveDrive);
router.post('/:driveId/donations', authenticate, authorize('donor'), validateDonationCreation, recordDonation);

module.exports = router;
