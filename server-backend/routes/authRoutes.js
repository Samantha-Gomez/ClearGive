const express = require('express');
const {
	registerUser,
	loginUser,
	forgotPassword,
	resetPassword,
	verifyEmail,
	resendEmailVerification,
	getCurrentUser,
	changePassword,
	anonymizeAccount,
	logoutUser,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const {
	validateRegistration,
	validateLogin,
	validateForgotPassword,
	validatePasswordReset,
	validateAccountDeletion,
	validateEmailVerification,
	validateEmailVerificationResend,
} = require('../middleware/validation');
const {
	authLimiter,
	emailVerificationResendLimiter,
} = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, validateRegistration, registerUser);
router.post('/login', authLimiter, validateLogin, loginUser);
router.post('/logout', logoutUser);
router.post(
	'/forgot-password',
	authLimiter,
	validateForgotPassword,
	forgotPassword,
);

router.post(
	'/reset-password',
	authLimiter,
	validatePasswordReset,
	resetPassword,
);
router.post('/verify-email', authLimiter, validateEmailVerification, verifyEmail);
router.post(
	'/resend-email-verification',
	authLimiter,
	validateEmailVerificationResend,
	emailVerificationResendLimiter,
	resendEmailVerification,
);
router.get('/me', authenticate, getCurrentUser);
router.patch('/change-password', authenticate, changePassword);
router.delete(
	'/me',
	authenticate,
	validateAccountDeletion,
	anonymizeAccount,
);

module.exports = router;
