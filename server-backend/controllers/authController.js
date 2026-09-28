const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');

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

    const allowedRegistrationRoles = ['donor', 'partner'];

    if (!allowedRegistrationRoles.includes(role)) {
      return res.status(400).json({
        message: 'Only donor and partner accounts can be registered publicly.',
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({
      fullName,
      email,
      contactNumber,
      password,
      role,
      organizationName:
        role === 'partner' ? organizationName : undefined,
      organizationType:
        role === 'partner' ? organizationType : undefined,
      status: 'active',
      verificationStatus:
        role === 'partner' ? 'not_submitted' : undefined,
    });

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
      message: 'User registered successfully.',
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
  getCurrentUser,
};