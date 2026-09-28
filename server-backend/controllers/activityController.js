const ActivityLog = require('../models/ActivityLog');

const getAllActivities = async (req, res) => {
  try {
    const activities = await ActivityLog.find()
      .populate('user', 'fullName email')
      .sort({ timestamp: -1 });

    res.json({ activities });
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