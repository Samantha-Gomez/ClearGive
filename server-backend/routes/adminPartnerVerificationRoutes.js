const express = require('express');
const {
  listVerifications,
  getVerificationById,
  getVerificationDocument,
  approveVerification,
  rejectVerification,
} = require('../controllers/partnerVerificationController');
const {
  authenticate,
  authorizeConfiguredAdmin,
} = require('../middleware/authMiddleware');
const { validateObjectId, validateRejectionRequest } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate, authorizeConfiguredAdmin);
router.get('/', listVerifications);
router.get(
  '/:id/documents/:documentType',
  validateObjectId,
  getVerificationDocument,
);
router.get('/:id', validateObjectId, getVerificationById);
router.patch('/:id/approve', validateObjectId, approveVerification);
router.patch('/:id/reject', validateObjectId, validateRejectionRequest, rejectVerification);

module.exports = router;