const express = require('express');
const {
  submitVerification,
  getMyVerification,
  resubmitVerification,
} = require('../controllers/partnerVerificationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const {
  validatePartnerVerificationSubmission,
  validatePartnerVerificationResubmission,
} = require('../middleware/validation');

const router = express.Router();

router.use(authenticate, authorize('partner'));
router.post('/', validatePartnerVerificationSubmission, submitVerification);
router.get('/me', getMyVerification);
router.patch('/me', validatePartnerVerificationResubmission, resubmitVerification);

module.exports = router;