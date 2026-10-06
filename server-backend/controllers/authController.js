const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const { sendEmailVerificationOtp } = require('../services/emailService');

const emailVerificationLifetimeMs = 10 * 60 * 1000;
const publicRegistrationRoles = ['donor', 'partner'];

const generateEmailOtp = () =>
  crypto.randomInt(100000, 1000000).toString();

const isPublicRegistrationRole = (role) =>
  publicRegistrationRoles.includes(role);

const createToken = (user) => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign(
    {
      sub: user._id,
      role: user.role,
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    }
  );
};

const registerUser = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      contactNumber,
      password,
      role,
      organizationName,
      organizationType,
    } = req.body;

    if (!isPublicRegistrationRole(role)) {
      return res.status(400).json({
        message: 'Only donor and partner accounts can be registered publicly.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      });
    }

    const otp = generateEmailOtp();
    const otpHash = await bcrypt.hash(otp, 12);
    const user = await User.create({
      fullName,
      email: normalizedEmail,
      contactNumber,
      password,
      role,
      emailVerified: false,
      emailVerificationOtpHash: otpHash,
      emailVerificationOtpExpiresAt: new Date(
        Date.now() + emailVerificationLifetimeMs,
      ),
      organizationName:
        role === 'partner' ? organizationName : undefined,
      organizationType:
        role === 'partner' ? organizationType : undefined,
      status: 'active',
      verificationStatus:
        role === 'partner' ? 'not_submitted' : undefined,
    });

    try {
      await sendEmailVerificationOtp({ to: user.email, otp });
    } catch (error) {
      await User.deleteOne({ _id: user._id }).catch(() => {});
      return next(error);
    }

    await logActivity({
      user: user._id,
      role: user.role,
      action: 'user_registered',
      resourceType: 'User',
      resourceId: user._id.toString(),
      details: 'New user registered to the system.',
      result: 'success',
    });

    return res.status(201).json({
      message: 'Verification code sent. Enter it to verify your email.',
      verificationRequired: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      });
    }

    return next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid email or password.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        message: 'This account is suspended and cannot log in.',
      });
    }

    if (
      isPublicRegistrationRole(user.role) &&
      user.emailVerified === false
    ) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_VERIFICATION_REQUIRED',
      });
    }

    const token = createToken(user);

    user.lastLoginAt = new Date();
    await user.save();

    await logActivity({
      user: user._id,
      role: user.role,
      action: 'user_logged_in',
      resourceType: 'User',
      resourceId: user._id.toString(),
      details: 'User logged into the system successfully.',
      result: 'success',
    });

    return res.json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const { otp } = req.body;
    const user = await User.findOne({ email }).select(
      '+emailVerificationOtpHash +emailVerificationOtpExpiresAt',
    );

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired verification code.',
      });
    }

    if (user.emailVerified === true) {
      return res.status(409).json({
        message: 'This email has already been verified.',
      });
    }

    if (
      !isPublicRegistrationRole(user.role) ||
      user.emailVerified !== false ||
      !user.emailVerificationOtpHash ||
      !user.emailVerificationOtpExpiresAt
    ) {
      return res.status(400).json({
        message: 'There is no pending email verification for this account.',
      });
    }

    const now = new Date();

    if (user.emailVerificationOtpExpiresAt <= now) {
      return res.status(410).json({
        message: 'This verification code has expired. Request a new code.',
      });
    }

    const isOtpValid = await bcrypt.compare(
      otp,
      user.emailVerificationOtpHash,
    );

    if (!isOtpValid) {
      return res.status(400).json({
        message: 'Incorrect verification code.',
      });
    }

    const result = await User.updateOne(
      {
        _id: user._id,
        role: user.role,
        emailVerified: false,
        emailVerificationOtpHash: user.emailVerificationOtpHash,
        emailVerificationOtpExpiresAt: { $gt: now },
      },
      {
        $set: { emailVerified: true },
        $unset: {
          emailVerificationOtpHash: 1,
          emailVerificationOtpExpiresAt: 1,
        },
      },
    );

    if (result.matchedCount !== 1) {
      return res.status(400).json({
        message: 'This verification code is invalid, expired, or already used.',
      });
    }

    return res.json({ message: 'Email verified successfully.' });
  } catch (error) {
    return next(error);
  }
};

const resendEmailVerification = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const responseMessage =
      'If an unverified donor or partner account exists for this email, a new code has been sent.';
    const user = await User.findOne({
      email,
      role: { $in: publicRegistrationRoles },
      emailVerified: false,
    });

    if (!user) {
      return res.json({ message: responseMessage });
    }

    const otp = generateEmailOtp();
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + emailVerificationLifetimeMs);
    const result = await User.updateOne(
      { _id: user._id, emailVerified: false },
      {
        $set: {
          emailVerificationOtpHash: otpHash,
          emailVerificationOtpExpiresAt: expiresAt,
        },
      },
    );

    if (result.matchedCount !== 1) {
      return res.json({ message: responseMessage });
    }

    await sendEmailVerificationOtp({ to: user.email, otp });

    return res.json({ message: responseMessage });
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    return res.json({
      user: {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyEmail,
  resendEmailVerification,
  getCurrentUser,
};