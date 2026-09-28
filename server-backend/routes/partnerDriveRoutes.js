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

const User = require('../models/User');

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

/*
 * Search registered donors.
 *
 * This route MUST be before /:id so "donors"
 * is not treated as a drive ID.
 */
router.get(
  '/donors/search',
  async (req, res, next) => {
    try {
      const search =
        typeof req.query.q === 'string'
          ? req.query.q.trim()
          : '';

      if (search.length < 2) {
        return res.json({
          donors: [],
        });
      }

      const donors = await User.find({
        role: 'donor',
        status: 'active',
        fullName: {
          $regex: search,
          $options: 'i',
        },
      })
        .select('_id fullName email')
        .sort({
          fullName: 1,
        })
        .limit(10);

      return res.json({
        donors: donors.map((donor) => ({
          id: donor._id,
          fullName: donor.fullName,
          email: donor.email,
        })),
      });
    } catch (error) {
      return next(error);
    }
  },
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