const express = require('express');
const {
  authenticate,
  authorize,
  authorizeConfiguredAdmin,
} = require('../middleware/authMiddleware');
const {
  validateObjectId,
} = require('../middleware/validation');

const router = express.Router();

const authorizeResourceOwnerOrAdmin = (req, res, next) => {
  if (req.user.role === 'admin') {
    return authorizeConfiguredAdmin(req, res, next);
  }

  if (req.user._id.toString() !== req.params.id) {
    return res.status(403).json({
      message: 'You do not have permission to access this record.',
    });
  }

  next();
};

// Any authenticated ClearGive user.
router.get('/dashboard', authenticate, (req, res) => {
  res.json({
    message: `Welcome to the protected ClearGive dashboard, ${req.user.role}.`,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      role: req.user.role,
    },
  });
});

// Donor or admin access.
router.get(
  '/donor-only',
  authenticate,
  authorize('donor', 'admin'),
  (req, res) => {
    res.json({
      message: 'Donor access confirmed.',
      role: req.user.role,
    });
  },
);

// Partner or admin access.
router.get(
  '/partner-only',
  authenticate,
  authorize('partner', 'admin'),
  (req, res) => {
    res.json({
      message: 'Partner access confirmed.',
      role: req.user.role,
    });
  },
);

// Admin-only access.
router.get(
  '/admin-only',
  authenticate,
  authorize('admin'),
  (req, res) => {
    res.json({
      message: 'Admin access confirmed.',
      role: req.user.role,
    });
  },
);

// User can access their own resource; admin can access any resource.
router.get(
  '/resource/:id',
  authenticate,
  validateObjectId,
  authorizeResourceOwnerOrAdmin,
  (req, res) => {
    res.json({
      message: 'Resource access confirmed.',
      requestedId: req.params.id,
      userRole: req.user.role,
    });
  },
);

module.exports = router;