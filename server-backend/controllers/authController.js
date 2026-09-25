const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');

const createToken = (user) => {
  const secret = process.env.JWT_SECRET || 'dev_jwt_secret_change_me';

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
    const { fullName, email, contactNumber, password, role, organizationName, organizationType } = req.body;

    if (role === 'admin') {
      return res.status(400).json({ message: 'Admin registration is not allowed from the public registration form.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      fullName,
      email,
      contactNumber,
      password,
      role,
      organizationName: role === 'partner' ? organizationName : undefined,
      organizationType: role === 'partner' ? organizationType : undefined,
      status: 'active',
      verificationStatus: role === 'partner' ? 'not_submitted' : undefined,
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

    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'This account is suspended and cannot log in.' });
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

    res.json({
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
    next(error);
  }
};

const getCurrentUser = async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      status: req.user.status,
    },
  });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
