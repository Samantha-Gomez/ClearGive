const User = require('../models/User');

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

module.exports = {
  getAdminUserStats,
};