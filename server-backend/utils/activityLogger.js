const ActivityLog = require('../models/ActivityLog');

const logActivity = async ({
  user,
  role,
  action,
  resourceType = '',
  resourceId = '',
  details = '',
  result = 'success',
}) => {
  try {
    await ActivityLog.create({
      user,
      role,
      action,
      resourceType,
      resourceId,
      details,
      result,
      timestamp: new Date(),
    });
  } catch (error) {
    // Keep the main request flow working even if the audit log itself fails.
    console.error('Activity log failed:', error.message);
  }
};

module.exports = {
  logActivity,
};
