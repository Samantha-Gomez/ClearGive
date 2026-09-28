const express = require('express');

const {
  createDrive,
  listOwnDrives,
  getOwnDrive,
  updateOwnDrive,
  updateDriveStatus,
} = require('../controllers/donationDriveController');

const {
  recordDonation,
  listDriveDonations,
  receiveDonation,
} = require('../controllers/donationController');

const {
  listDriveDistributions,
  recordDistribution,
} = require('../controllers/distributionController');

const {
  authenticate,
  authorize,
} = require('../middleware/authMiddleware');

const {
  requireApprovedPartner,
} = require('../middleware/partnerVerificationMiddleware');

const {
  validateObjectId,
  validateDonationDriveCreation,
  validateDonationDriveUpdate,
  validateDonationCreation,
  validateDonationReceiveAction,
  validateDistributionCreation,
} = require('../middleware/validation');

const router = express.Router();

router.use(
  authenticate,
  authorize('partner'),
  requireApprovedPartner,
);

router.post(
  '/',
  validateDonationDriveCreation,
  createDrive,
);

router.get(
  '/',
  listOwnDrives,
);

router.get(
  '/:id',
  validateObjectId,
  getOwnDrive,
);

router.patch(
  '/:id/status',
  validateObjectId,
  updateDriveStatus,
);

router.patch(
  '/:id',
  validateObjectId,
  validateDonationDriveUpdate,
  updateOwnDrive,
);

router.get(
  '/:driveId/donations',
  listDriveDonations,
);

router.post(
  '/:driveId/donations',
  validateDonationCreation,
  recordDonation,
);

router.patch(
  '/:driveId/donations/:donationId/receive',
  validateDonationReceiveAction,
  receiveDonation,
);

router.get(
  '/:driveId/distributions',
  listDriveDistributions,
);

router.post(
  '/:driveId/distributions',
  validateDistributionCreation,
  recordDistribution,
);

module.exports = router;