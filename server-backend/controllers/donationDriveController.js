const mongoose = require('mongoose');
const DonationDrive = require('../models/DonationDrive');
const Donation = require('../models/Donation');
const Distribution = require('../models/Distribution');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const {
  createNotifications,
} = require('../utils/notificationService');

const editableDriveFields = [
  'title',
  'description',
  'category',
  'targetQuantity',
  'location',
  'assistanceReference',
];

const protectedDriveFields = [
  'partnerId',
  'status',
  'createdAt',
  'updatedAt',
];

const driveStatuses = [
  'active',
  'paused',
  'completed',
  'cancelled',
];

const driveStatusTransitions = {
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const ensureBodyObject = (body) =>
  body && typeof body === 'object' && !Array.isArray(body);

const validateEditableBody = (
  body,
  allowedFields,
  protectedFields,
) => {
  if (!ensureBodyObject(body)) {
    return 'A request body is required.';
  }

  const protectedField = protectedFields.find((field) =>
    Object.prototype.hasOwnProperty.call(body, field),
  );

  if (protectedField) {
    return `${protectedField} is controlled by the server.`;
  }

  const unknownField = Object.keys(body).find(
    (field) => !allowedFields.includes(field),
  );

  if (unknownField) {
    return `${unknownField} is not an accepted field.`;
  }

  return null;
};

const serializeDrive = (drive) => {
  const populatedPartner =
    drive.partnerId && drive.partnerId._id
      ? drive.partnerId
      : null;

  return {
    id: drive._id,
    partnerId: populatedPartner
      ? populatedPartner._id
      : drive.partnerId,

    partner: populatedPartner
      ? {
          id: populatedPartner._id,
          fullName: populatedPartner.fullName,
          organizationName: populatedPartner.organizationName,
        }
      : undefined,

    title: drive.title,
    description: drive.description,
    category: drive.category,
    targetQuantity: drive.targetQuantity,
    location: drive.location,
    assistanceReference:
      drive.assistanceReference || null,
    status: drive.status,
    createdAt: drive.createdAt,
    updatedAt: drive.updatedAt,
  };
};

const createDrive = async (req, res, next) => {
  try {
    const bodyError = validateEditableBody(
      req.body,
      editableDriveFields,
      protectedDriveFields,
    );

    if (bodyError) {
      return res.status(400).json({ message: bodyError });
    }

    const drive = await DonationDrive.create({
      ...Object.fromEntries(
        editableDriveFields.map((field) => [
          field,
          req.body[field],
        ]),
      ),
      partnerId: req.user._id,
      status: 'active',
    });

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'donation_drive_created',
      resourceType: 'DonationDrive',
      resourceId: drive._id.toString(),
      result: 'success',
    });

    const admins = await User.find({
      role: 'admin',
      status: 'active',
    }).select('_id role');

    await createNotifications(
      admins.map((admin) => ({
        recipient: admin._id,
        role: 'admin',
        type: 'new_donation_drive',
        title: 'New donation drive',
        message: `A new donation drive, "${drive.title}", has been created by a partner organization.`,
        resourceType: 'drive',
        resourceId: drive._id.toString(),
      })),
    );

    return res.status(201).json({
      message: 'Donation drive created successfully.',
      drive: serializeDrive(drive),
    });
  } catch (error) {
    return next(error);
  }
};

const listOwnDrives = async (req, res, next) => {
  try {
    const drives = await DonationDrive.find({
      partnerId: req.user._id,
    }).sort({ createdAt: -1 });

    return res.json({
      drives: drives.map(serializeDrive),
    });
  } catch (error) {
    return next(error);
  }
};

const getOwnDrive = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation drive ID format.',
      });
    }

    const drive = await DonationDrive.findOne({
      _id: req.params.id,
      partnerId: req.user._id,
    });

    if (!drive) {
      return res.status(404).json({
        message: 'Donation drive not found.',
      });
    }

    return res.json({
      drive: serializeDrive(drive),
    });
  } catch (error) {
    return next(error);
  }
};

const updateOwnDrive = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation drive ID format.',
      });
    }

    const bodyError = validateEditableBody(
      req.body,
      editableDriveFields,
      protectedDriveFields,
    );

    if (bodyError) {
      return res.status(400).json({ message: bodyError });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: 'At least one drive field must be provided.',
      });
    }

    const updates = Object.fromEntries(
      editableDriveFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]]),
    );

    const drive = await DonationDrive.findOneAndUpdate(
      {
        _id: req.params.id,
        partnerId: req.user._id,
      },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!drive) {
      return res.status(404).json({
        message: 'Donation drive not found.',
      });
    }

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'donation_drive_updated',
      resourceType: 'DonationDrive',
      resourceId: drive._id.toString(),
      result: 'success',
    });

    return res.json({
      message: 'Donation drive updated successfully.',
      drive: serializeDrive(drive),
    });
  } catch (error) {
    return next(error);
  }
};

const updateDriveStatus = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation drive ID format.',
      });
    }

    const bodyError = validateEditableBody(
      req.body,
      ['status'],
      ['partnerId', 'createdAt', 'updatedAt'],
    );

    if (bodyError) {
      return res.status(400).json({ message: bodyError });
    }

    if (
      typeof req.body.status !== 'string' ||
      !driveStatuses.includes(req.body.status)
    ) {
      return res.status(400).json({
        message: 'status is invalid.',
      });
    }

    const drive = await DonationDrive.findOne({
      _id: req.params.id,
      partnerId: req.user._id,
    });

    if (!drive) {
      return res.status(404).json({
        message: 'Donation drive not found.',
      });
    }

    if (
      !driveStatusTransitions[drive.status].includes(
        req.body.status,
      )
    ) {
      return res.status(409).json({
        message: `Cannot change drive status from ${drive.status} to ${req.body.status}.`,
      });
    }

    const previousStatus = drive.status;

    drive.status = req.body.status;
    await drive.save();

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'donation_drive_status_changed',
      resourceType: 'DonationDrive',
      resourceId: drive._id.toString(),
      details: `Drive status changed from ${previousStatus} to ${drive.status}.`,
      result: 'success',
    });

    return res.json({
      message: 'Donation drive status updated successfully.',
      drive: serializeDrive(drive),
    });
  } catch (error) {
    return next(error);
  }
};

const buildPublicDriveFilter = async (query) => {
  const filter = {
    status: 'active',
  };

  if (query.category) {
    filter.category = query.category;
  }

  if (query.location) {
    filter.location = {
      $regex: query.location,
      $options: 'i',
    };
  }

  if (query.q) {
    const search = {
      $regex: query.q,
      $options: 'i',
    };

    const matchingPartners = await User.find({
      role: 'partner',
      $or: [
        { fullName: search },
        { organizationName: search },
      ],
    }).select('_id');

    filter.$or = [
      { title: search },
      { description: search },
      { location: search },
      {
        partnerId: {
          $in: matchingPartners.map(
            (partner) => partner._id,
          ),
        },
      },
    ];
  }

  return filter;
};

/* =========================
   PUBLIC DRIVE STATISTICS
========================= */

const addPublicDriveStats = async (drive) => {
  const donations = await Donation.find({
    driveId: drive._id,
  }).select('quantity status');

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

  return {
    totalDonated,
    totalReceived,
  };
};

const serializePublicDrive = async (drive) => {
  const serialized = serializeDrive(drive);
  const stats = await addPublicDriveStats(drive);

  return {
    ...serialized,
    stats,
  };
};

const listPublicActiveDrives = async (req, res, next) => {
  try {
    const filter = await buildPublicDriveFilter(
      req.query || {},
    );

    const drives = await DonationDrive.find(filter)
      .populate(
        'partnerId',
        'fullName organizationName',
      )
      .sort({ createdAt: -1 });

    const serializedDrives = await Promise.all(
      drives.map(serializePublicDrive),
    );

    return res.json({
      drives: serializedDrives,
    });
  } catch (error) {
    return next(error);
  }
};

const getPublicActiveDrive = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation drive ID format.',
      });
    }

    const drive = await DonationDrive.findOne({
      _id: req.params.id,
      status: 'active',
    }).populate(
      'partnerId',
      'fullName organizationName',
    );

    if (!drive) {
      return res.status(404).json({
        message: 'Active donation drive not found.',
      });
    }

    return res.json({
      drive: await serializePublicDrive(drive),
    });
  } catch (error) {
    return next(error);
  }
};

/* =========================
   ADMIN DRIVE FUNCTIONS
========================= */

const addAdminDriveStats = async (drive) => {
  const driveId = drive._id;

  const donations = await Donation.find({
    driveId,
  }).select('quantity status');

  const distributions = await Distribution.find({
    driveId,
  }).select(
    'quantityDistributed beneficiariesAssisted',
  );

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

  const totalDistributed = distributions.reduce(
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

  return {
    totalDonations: donations.length,
    totalDonated,
    totalReceived,
    totalDistributed,
    beneficiariesAssisted,
  };
};

const serializeAdminDrive = async (drive) => {
  const serialized = serializeDrive(drive);
  const stats = await addAdminDriveStats(drive);

  return {
    ...serialized,
    stats,
  };
};

const listAdminDrives = async (req, res, next) => {
  try {
    const drives = await DonationDrive.find()
      .populate(
        'partnerId',
        'fullName organizationName email',
      )
      .sort({ createdAt: -1 });

    const serializedDrives = await Promise.all(
      drives.map(serializeAdminDrive),
    );

    return res.json({
      drives: serializedDrives,
    });
  } catch (error) {
    return next(error);
  }
};

const getAdminDrive = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid donation drive ID format.',
      });
    }

    const drive = await DonationDrive.findById(
      req.params.id,
    ).populate(
      'partnerId',
      'fullName organizationName email',
    );

    if (!drive) {
      return res.status(404).json({
        message: 'Donation drive not found.',
      });
    }

    return res.json({
      drive: await serializeAdminDrive(drive),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createDrive,
  listOwnDrives,
  getOwnDrive,
  updateOwnDrive,
  updateDriveStatus,
  listPublicActiveDrives,
  getPublicActiveDrive,
  listAdminDrives,
  getAdminDrive,
};