const mongoose = require('mongoose');
const DonationDrive = require('../models/DonationDrive');
const Donation = require('../models/Donation');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const {
  createNotification,
  createNotifications,
} = require('../utils/notificationService');

const donationFields = [
  'contributorName',
  'item',
  'quantity',
];

const protectedDonationFields = [
  'donorId',
  'driveId',
  'status',
  'recordedAt',
  'receivedAt',
  'receivedBy',
  'distributedAt',
  'distributedBy',
  'createdAt',
  'updatedAt',
];

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const ensureBodyObject = (body) =>
  body &&
  typeof body === 'object' &&
  !Array.isArray(body);

const validateDonationBody = (body) => {
  if (!ensureBodyObject(body)) {
    return 'A request body is required.';
  }

  const protectedField =
    protectedDonationFields.find((field) =>
      Object.prototype.hasOwnProperty.call(
        body,
        field,
      ),
    );

  if (protectedField) {
    return `${protectedField} is controlled by the server.`;
  }

  const unknownField = Object.keys(body).find(
    (field) => !donationFields.includes(field),
  );

  if (unknownField) {
    return `${unknownField} is not an accepted field.`;
  }

  if (body.contributorName !== undefined) {
    if (
      typeof body.contributorName !== 'string' ||
      (
        body.contributorName.trim().length > 0 &&
        (
          body.contributorName.trim().length < 2 ||
          body.contributorName.trim().length > 150
        )
      )
    ) {
      return 'contributorName must be between 2 and 150 characters when provided.';
    }
  }

  if (
    typeof body.item !== 'string' ||
    body.item.trim().length < 2 ||
    body.item.trim().length > 150
  ) {
    return 'item must be between 2 and 150 characters.';
  }

  if (
    !Number.isInteger(body.quantity) ||
    body.quantity < 1 ||
    body.quantity > 100000000
  ) {
    return 'quantity must be a positive integer.';
  }

  return null;
};

const serializeDonation = (donation) => ({
  id: donation._id,
  driveId: donation.driveId,
  donorId: donation.donorId,
  contributorName: donation.contributorName,
  item: donation.item,
  quantity: donation.quantity,
  status: donation.status,
  recordedAt: donation.recordedAt,
  receivedAt: donation.receivedAt,
  receivedBy: donation.receivedBy,
  distributedAt: donation.distributedAt,
  distributedBy: donation.distributedBy,
  createdAt: donation.createdAt,
  updatedAt: donation.updatedAt,
});

const recordDonation = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.driveId)) {
      return res
        .status(400)
        .json({
          message:
            'Invalid donation drive ID format.',
        });
    }

    const bodyError = validateDonationBody(
      req.body,
    );

    if (bodyError) {
      return res
        .status(400)
        .json({
          message: bodyError,
        });
    }

    const drive = await DonationDrive.findOne({
      _id: req.params.driveId,
      partnerId: req.user._id,
      status: 'active',
    });

    if (!drive) {
      return res
        .status(404)
        .json({
          message:
            'Active donation drive not found.',
        });
    }

    const now = new Date();

    const donation = await Donation.create({
      driveId: drive._id,

      // Physical donations are not linked
      // to a donor account.
      donorId: null,

      contributorName:
        typeof req.body.contributorName ===
          'string' &&
        req.body.contributorName.trim().length >
          0
          ? req.body.contributorName.trim()
          : 'Anonymous Donor',

      item: req.body.item.trim(),
      quantity: req.body.quantity,

      // The partner is recording the donation
      // after physically receiving it.
      status: 'Received',
      recordedAt: now,
      receivedAt: now,
      receivedBy: req.user._id,
    });

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'donation_recorded',
      resourceType: 'Donation',
      resourceId: donation._id.toString(),
      result: 'success',
    });

    // Notify the partner who recorded the donation.
    await createNotification({
      recipient: req.user._id,
      role: 'partner',
      type: 'donation_recorded',
      title: 'Donation received',
      message: `${donation.contributorName} donated ${donation.quantity} item${
        donation.quantity === 1
          ? ''
          : 's'
      } for "${drive.title}".`,
      resourceType: 'drive',
      resourceId: drive._id.toString(),
    });

    // Notify all active admins.
    const admins = await User.find({
      role: 'admin',
      status: 'active',
    }).select('_id role');

    await createNotifications(
      admins.map((admin) => ({
        recipient: admin._id,
        role: 'admin',
        type: 'new_donation',
        title: 'New donation received',
        message: `${donation.contributorName} donated ${donation.quantity} item${
          donation.quantity === 1
            ? ''
            : 's'
        } for "${drive.title}".`,
        resourceType: 'drive',
        resourceId: drive._id.toString(),
      })),
    );

    return res
      .status(201)
      .json({
        message:
          'Donation recorded and received successfully.',
        donation:
          serializeDonation(donation),
      });
  } catch (error) {
    return next(error);
  }
};

const listDriveDonations = async (
  req,
  res,
  next,
) => {
  try {
    if (!isValidObjectId(req.params.driveId)) {
      return res
        .status(400)
        .json({
          message:
            'Invalid donation drive ID format.',
        });
    }

    const drive = await DonationDrive.findOne({
      _id: req.params.driveId,
      partnerId: req.user._id,
    });

    if (!drive) {
      return res
        .status(404)
        .json({
          message: 'Donation drive not found.',
        });
    }

    const donations = await Donation.find({
      driveId: drive._id,
    }).sort({
      recordedAt: -1,
    });

    return res.json({
      donations: donations.map(
        serializeDonation,
      ),
    });
  } catch (error) {
    return next(error);
  }
};

/*
 * Kept temporarily so the existing route file
 * does not break if it still imports this function.
 *
 * New donations are already automatically
 * marked as Received, so the frontend no longer
 * calls this endpoint.
 */
const receiveDonation = async (
  req,
  res,
  next,
) => {
  try {
    if (
      !isValidObjectId(
        req.params.driveId,
      ) ||
      !isValidObjectId(
        req.params.donationId,
      )
    ) {
      return res.status(400).json({
        message:
          'Invalid drive or donation ID format.',
      });
    }

    if (
      !ensureBodyObject(req.body) ||
      Object.keys(req.body).length > 0
    ) {
      return res.status(400).json({
        message:
          'Donation receive action does not accept a request body.',
      });
    }

    const drive = await DonationDrive.findOne({
      _id: req.params.driveId,
      partnerId: req.user._id,
    });

    if (!drive) {
      return res.status(404).json({
        message:
          'Donation drive not found.',
      });
    }

    const donation = await Donation.findOne({
      _id: req.params.donationId,
      driveId: drive._id,
    });

    if (!donation) {
      return res.status(404).json({
        message:
          'Donation not found for this drive.',
      });
    }

    if (donation.status !== 'Recorded') {
      return res.status(409).json({
        message: `Cannot receive a donation in ${donation.status} status.`,
      });
    }

    donation.status = 'Received';
    donation.receivedAt = new Date();
    donation.receivedBy = req.user._id;

    await donation.save();

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'donation_received',
      resourceType: 'Donation',
      resourceId: donation._id.toString(),
      result: 'success',
    });

    if (donation.donorId) {
      await createNotification({
        recipient: donation.donorId,
        role: 'donor',
        type: 'donation_received',
        title: 'Donation received',
        message: `Your donation for "${drive.title}" has been marked as received by the partner.`,
        resourceType: 'drive',
        resourceId: drive._id.toString(),
      });
    }

    await createNotification({
      recipient: req.user._id,
      role: 'partner',
      type: 'donation_received',
      title: 'Donation received',
      message: `The donation from ${
        donation.contributorName ||
        'Anonymous Donor'
      } for "${drive.title}" has been marked as received.`,
      resourceType: 'drive',
      resourceId: drive._id.toString(),
    });

    return res.json({
      message:
        'Donation marked as received.',
      donation:
        serializeDonation(donation),
    });
  } catch (error) {
    return next(error);
  }
};

const getMyDonations = async (
  req,
  res,
  next,
) => {
  try {
    const donations = await Donation.find({
      donorId: req.user._id,
    })
      .populate(
        'driveId',
        'title category location status',
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      donations,
    });
  } catch (error) {
    console.error(
      'Get my donations error:',
      error,
    );

    return res.status(500).json({
      message:
        'Unable to retrieve donation history.',
    });
  }
};

const getAllDonations = async (
  req,
  res,
  next,
) => {
  try {
    const donations = await Donation.find()
      .populate(
        'donorId',
        'fullName email',
      )
      .populate(
        'driveId',
        'title category location status',
      )
      .sort({
        createdAt: -1,
      });

    return res.json({
      donations,
    });
  } catch (error) {
    console.error(
      'Get all donations error:',
      error,
    );

    return res.status(500).json({
      message:
        'Unable to retrieve donation records.',
    });
  }
};

module.exports = {
  recordDonation,
  listDriveDonations,
  receiveDonation,
  getMyDonations,
  getAllDonations,
};