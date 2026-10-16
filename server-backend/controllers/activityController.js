const ActivityLog = require('../models/ActivityLog');
const { getPagination, getPaginationMeta } = require('../utils/pagination');

const getAllActivities = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const [activities, total] = await Promise.all([
      ActivityLog.find()
      .populate('user', 'fullName email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
      ActivityLog.countDocuments(),
    ]);

    res.json({ activities, pagination: getPaginationMeta({ page, limit, total }) });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      message: 'Unable to retrieve activity logs.',
    });
  }
};

module.exports = {
  getAllActivities,
};
