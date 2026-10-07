const express = require('express');
const {
	registerUser,
	loginUser,
	forgotPassword,
	resetPassword,
	verifyEmail,
	resendEmailVerification,
	getCurrentUser,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const {
	validateRegistration,
	validateLogin,
	validateForgotPassword,
	validatePasswordReset,
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

module.exports = router;
