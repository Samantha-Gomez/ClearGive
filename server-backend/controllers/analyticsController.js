const DonationDrive = require('../models/DonationDrive');
const Donation = require('../models/Donation');
const Distribution = require('../models/Distribution');

const getAdminAnalytics = async (req, res, next) => {
  try {
    const [
      drives,
      donations,
      distributions,
    ] = await Promise.all([
      DonationDrive.find()
        .select(
          'title category status targetQuantity createdAt',
        )
        .sort({ createdAt: 1 }),

      Donation.find()
        .select(
          'driveId quantity status createdAt receivedAt distributedAt',
        )
        .sort({ createdAt: 1 }),

      Distribution.find()
        .select(
          'driveId quantityDistributed beneficiariesAssisted createdAt',
        )
        .sort({ createdAt: 1 }),
    ]);

    const totalDrives = drives.length;

    const activeDrives = drives.filter(
      (drive) => drive.status === 'active',
    ).length;

    const completedDrives = drives.filter(
      (drive) => drive.status === 'completed',
    ).length;

    const totalDonated = donations.reduce(
      (sum, donation) =>
        sum + Number(donation.quantity || 0),
      0,
    );

    const totalReceived = donations
      .filter(
        (donation) =>
          donation.status === 'Received' ||
          donation.status === 'Distributed',
      )
      .reduce(
        (sum, donation) =>
          sum + Number(donation.quantity || 0),
        0,
      );

    const totalDistributed =
      distributions.reduce(
        (sum, distribution) =>
          sum +
          Number(
            distribution.quantityDistributed || 0,
          ),
        0,
      );

    const beneficiariesAssisted =
      distributions.reduce(
        (sum, distribution) =>
          sum +
          Number(
            distribution.beneficiariesAssisted || 0,
          ),
        0,
      );

    // Calculate the time between a donation being received
    // and the donation being fully distributed.
    const completedDonationDelays = donations
      .filter(
        (donation) =>
          donation.status === 'Distributed' &&
          donation.receivedAt &&
          donation.distributedAt,
      )
      .map((donation) => {
        const receivedTime = new Date(
          donation.receivedAt,
        ).getTime();

        const distributedTime = new Date(
          donation.distributedAt,
        ).getTime();

        if (
          Number.isNaN(receivedTime) ||
          Number.isNaN(distributedTime) ||
          distributedTime < receivedTime
        ) {
          return null;
        }

        return (
          (distributedTime - receivedTime) /
          (1000 * 60 * 60 * 24)
        );
      })
      .filter((days) => days !== null);

    const averageDistributionDelay =
      completedDonationDelays.length > 0
        ? completedDonationDelays.reduce(
            (sum, days) => sum + days,
            0,
          ) / completedDonationDelays.length
        : 0;

    const longestDistributionDelay =
      completedDonationDelays.length > 0
        ? Math.max(...completedDonationDelays)
        : 0;

    const statusBreakdown = {
      active: 0,
      paused: 0,
      completed: 0,
      cancelled: 0,
    };

    drives.forEach((drive) => {
      if (
        Object.prototype.hasOwnProperty.call(
          statusBreakdown,
          drive.status,
        )
      ) {
        statusBreakdown[drive.status] += 1;
      }
    });

    const categoryBreakdown = {};

    drives.forEach((drive) => {
      const category = drive.category || 'Other';

      categoryBreakdown[category] =
        (categoryBreakdown[category] || 0) + 1;
    });

    const monthlyActivity = {};

    const addMonthlyValue = (
      dateValue,
      field,
      amount,
    ) => {
      if (!dateValue) return;

      const date = new Date(dateValue);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const month = date.toISOString().slice(0, 7);

      if (!monthlyActivity[month]) {
        monthlyActivity[month] = {
          month,
          drives: 0,
          donated: 0,
          distributed: 0,
          beneficiaries: 0,
        };
      }

      monthlyActivity[month][field] += amount;
    };

    drives.forEach((drive) => {
      addMonthlyValue(
        drive.createdAt,
        'drives',
        1,
      );
    });

    donations.forEach((donation) => {
      addMonthlyValue(
        donation.createdAt,
        'donated',
        Number(donation.quantity || 0),
      );
    });

    distributions.forEach((distribution) => {
      addMonthlyValue(
        distribution.createdAt,
        'distributed',
        Number(
          distribution.quantityDistributed || 0,
        ),
      );

      addMonthlyValue(
        distribution.createdAt,
        'beneficiaries',
        Number(
          distribution.beneficiariesAssisted || 0,
        ),
      );
    });

    const monthly = Object.values(
      monthlyActivity,
    ).sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    const driveDistributionMap = {};

    distributions.forEach((distribution) => {
      const driveId =
        distribution.driveId?.toString();

      if (!driveId) return;

      if (!driveDistributionMap[driveId]) {
        driveDistributionMap[driveId] = {
          totalDistributed: 0,
          beneficiariesAssisted: 0,
        };
      }

      driveDistributionMap[driveId]
        .totalDistributed +=
        Number(
          distribution.quantityDistributed || 0,
        );

      driveDistributionMap[driveId]
        .beneficiariesAssisted +=
        Number(
          distribution.beneficiariesAssisted || 0,
        );
    });

    const driveBreakdown = drives.map((drive) => {
      const driveId = drive._id.toString();

      const driveDonations = donations.filter(
        (donation) =>
          donation.driveId?.toString() ===
          driveId,
      );

      const donated = driveDonations.reduce(
        (sum, donation) =>
          sum + Number(donation.quantity || 0),
        0,
      );

      const received = driveDonations
        .filter(
          (donation) =>
            donation.status === 'Received' ||
            donation.status === 'Distributed',
        )
        .reduce(
          (sum, donation) =>
            sum + Number(donation.quantity || 0),
          0,
        );

      const distribution =
        driveDistributionMap[driveId] || {
          totalDistributed: 0,
          beneficiariesAssisted: 0,
        };

      return {
        id: drive._id,
        title: drive.title,
        category: drive.category,
        status: drive.status,
        targetQuantity: drive.targetQuantity,
        donated,
        received,
        distributed:
          distribution.totalDistributed,
        beneficiaries:
          distribution.beneficiariesAssisted,
      };
    });

    return res.json({
      summary: {
        totalDrives,
        activeDrives,
        completedDrives,
        totalDonated,
        totalReceived,
        totalDistributed,
        beneficiariesAssisted,

        averageDistributionDelay:
          Number(
            averageDistributionDelay.toFixed(2),
          ),

        longestDistributionDelay:
          Number(
            longestDistributionDelay.toFixed(2),
          ),

        completedDonations:
          completedDonationDelays.length,
      },

      statusBreakdown,

      categoryBreakdown,

      monthlyActivity: monthly,

      driveBreakdown,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAdminAnalytics,
};