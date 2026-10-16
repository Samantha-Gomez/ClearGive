const DonationDrive = require('../models/DonationDrive');

async function expirePastDonationDrives(filter = {}) {
  await DonationDrive.updateMany(
    {
      ...filter,
      status: { $in: ['active', 'paused'] },
      deadline: { $lt: new Date() },
    },
    { $set: { status: 'expired' } },
  );
}

module.exports = { expirePastDonationDrives };
