const express = require('express');
const {
  listVerifications,
  getVerificationById,
  approveVerification,
  rejectVerification,
} = require('../controllers/partnerVerificationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { requireConfiguredAdmin } = require('../middleware/partnerVerificationMiddleware');
const { validateObjectId, validateRejectionRequest } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate, authorize('admin'), requireConfiguredAdmin);
router.get('/', listVerifications);
router.get('/:id', validateObjectId, getVerificationById);
router.patch('/:id/approve', validateObjectId, approveVerification);
router.patch('/:id/reject', validateObjectId, validateRejectionRequest, rejectVerification);

module.exports = router;