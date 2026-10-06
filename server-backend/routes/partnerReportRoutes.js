const express = require('express');
const {
  exportDrives,
  exportDonations,
  exportDistributions,
} = require('../controllers/partnerReportController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { requireApprovedPartner } = require('../middleware/partnerVerificationMiddleware');

const router = express.Router();

router.use(authenticate, authorize('partner'), requireApprovedPartner);

router.get('/drives/export', exportDrives);
router.get('/donations/export', exportDonations);
router.get('/distributions/export', exportDistributions);

module.exports = router;