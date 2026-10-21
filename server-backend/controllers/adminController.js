const User = require('../models/User');
const { getPagination, getPaginationMeta } = require('../utils/pagination');
const { logActivity } = require('../utils/activityLogger');

const getAdminUserStats = async (req, res, next) => {
  try {
    const [donors, partners] = await Promise.all([
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'partner' }),
    ]);

    return res.json({
      stats: {
        totalDonors: donors,
        totalPartners: partners,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const listAdminUsers = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const filter = {};
    const search = typeof req.query.q === 'string'
      ? req.query.q.trim().slice(0, 100)
      : '';

    if (['donor', 'partner', 'admin'].includes(req.query.role)) {
      filter.role = req.query.role;
    }

    if (['active', 'suspended'].includes(req.query.status)) {
      filter.status = req.query.status;
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapedSearch, 'i');
      filter.$or = [
        { fullName: searchRegex },
        { organizationName: searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('fullName role status emailVerified organizationName verificationStatus createdAt lastLoginAt anonymizedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.json({
      users,
      pagination: getPaginationMeta({ page, limit, total }),
    });
  } catch (error) {
    return next(error);
  }
};

const updateAdminUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user._id.equals(req.user._id)) {
      return res.status(400).json({
        message: 'You cannot change your own account status here.',
      });
    }

    if (user.anonymizedAt) {
      return res.status(409).json({
        message: 'Anonymized accounts cannot be reactivated or modified.',
      });
    }

    const previousStatus = user.status;
    user.status = req.body.status;
    await user.save();

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'admin_user_status_changed',
      resourceType: 'User',
      resourceId: user._id.toString(),
      details: `User status changed from ${previousStatus} to ${user.status}.`,
      result: 'success',
    });

    return res.json({
      message: `User ${user.status === 'active' ? 'reactivated' : 'suspended'} successfully.`,
      user: {
        id: user._id,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAdminUserStats,
  listAdminUsers,
  updateAdminUserStatus,
};
