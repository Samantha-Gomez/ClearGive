const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/validation');

const router = express.Router();

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

router.get('/donor-only', authenticate, authorize(['donor', 'admin']), (req, res) => {
  res.json({
    message: 'Donor access confirmed.',
    role: req.user.role,
  });
});

router.get('/partner-only', authenticate, authorize(['partner', 'admin']), (req, res) => {
  res.json({
    message: 'Partner access confirmed.',
    role: req.user.role,
  });
});

router.get('/admin-only', authenticate, authorize('admin'), (req, res) => {
  res.json({
    message: 'Admin access confirmed.',
    role: req.user.role,
  });
});

router.get('/resource/:id', authenticate, validateObjectId, (req, res) => {
  const canAccess = req.user.role === 'admin' || req.user._id.toString() === req.params.id;

  if (!canAccess) {
    return res.status(403).json({ message: 'You do not have permission to access this record.' });
  }

  res.json({
    message: 'Resource access confirmed.',
    requestedId: req.params.id,
    userRole: req.user.role,
  });
});

module.exports = router;
