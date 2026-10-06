const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error('JWT_SECRET is not configured.');
      return res.status(500).json({
        message: 'Authentication service is not properly configured.',
      });
    }

    const decoded = jwt.verify(token, secret);

    if (
      !decoded.sub ||
      !mongoose.Types.ObjectId.isValid(decoded.sub)
    ) {
      return res.status(401).json({
        message: 'Invalid or expired token.',
      });
    }

    const user = await User.findById(decoded.sub).select('-password');

    if (!user) {
      return res.status(401).json({
        message: 'User not found or token invalid.',
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        message: 'This account is not active.',
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Invalid or expired token.',
    });
  }
};

const authorizeConfiguredAdmin = (req, res, next) => {
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || '')
    .trim()
    .toLowerCase();
  const userEmail =
    typeof req.user?.email === 'string'
      ? req.user.email.trim().toLowerCase()
      : '';

  if (
    !req.user ||
    req.user.role !== 'admin' ||
    !configuredAdminEmail ||
    userEmail !== configuredAdminEmail
  ) {
    return res.status(403).json({
      message: 'You do not have permission to access this resource.',
    });
  }

  next();
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const roles = allowedRoles.flat();

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource.',
      });
    }

    if (req.user.role === 'admin') {
      return authorizeConfiguredAdmin(req, res, next);
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authorizeConfiguredAdmin,
};