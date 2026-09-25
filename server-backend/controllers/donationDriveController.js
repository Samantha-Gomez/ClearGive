const mongoose = require('mongoose');
const DonationDrive = require('../models/DonationDrive');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');

const editableDriveFields = [
  'title',
  'description',
  'category',
  'targetQuantity',
  'location',
  'assistanceReference',
];
const protectedDriveFields = ['partnerId', 'status', 'createdAt', 'updatedAt'];
const driveStatuses = ['active', 'paused', 'completed', 'cancelled'];
const driveStatusTransitions = {
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const ensureBodyObject = (body) => body && typeof body === 'object' && !Array.isArray(body);

const validateEditableBody = (body, allowedFields, protectedFields) => {
  if (!ensureBodyObject(body)) return 'A request body is required.';

  const protectedField = protectedFields.find((field) => Object.prototype.hasOwnProperty.call(body, field));
  if (protectedField) return `${protectedField} is controlled by the server.`;

  const unknownField = Object.keys(body).find((field) => !allowedFields.includes(field));
  if (unknownField) return `${unknownField} is not an accepted field.`;

  return null;
};

const serializeDrive = (drive) => {
  const populatedPartner = drive.partnerId && drive.partnerId._id ? drive.partnerId : null;

  return {
    id: drive._id,
    partnerId: populatedPartner ? populatedPartner._id : drive.partnerId,
    partner: populatedPartner ? {
      id: populatedPartner._id,
      fullName: populatedPartner.fullName,
      organizationName: populatedPartner.organizationName,
    } : undefined,
    title: drive.title,
    description: drive.description,
    category: drive.category,
    targetQuantity: drive.targetQuantity,
    location: drive.location,
    assistanceReference: drive.assistanceReference || null,
    status: drive.status,
    createdAt: drive.createdAt,
    updatedAt: drive.updatedAt,
  };
};

const createDrive = async (req, res, next) => {
  try {
    const bodyError = validateEditableBody(req.body, editableDriveFields, protectedDriveFields);
    if (bodyError) return res.status(400).json({ message: bodyError });

    const drive = await DonationDrive.create({
      ...Object.fromEntries(editableDriveFields.map((field) => [field, req.body[field]])),
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
    const drives = await DonationDrive.find({ partnerId: req.user._id }).sort({ createdAt: -1 });
    return res.json({ drives: drives.map(serializeDrive) });
  } catch (error) {
    return next(error);
  }
};

const getOwnDrive = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid donation drive ID format.' });
    }

    const drive = await DonationDrive.findOne({ _id: req.params.id, partnerId: req.user._id });
    if (!drive) {
      return res.status(404).json({ message: 'Donation drive not found.' });
    }

    return res.json({ drive: serializeDrive(drive) });
  } catch (error) {
    return next(error);
  }
};

const updateOwnDrive = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid donation drive ID format.' });
    }

    const bodyError = validateEditableBody(req.body, editableDriveFields, protectedDriveFields);
    if (bodyError) return res.status(400).json({ message: bodyError });
    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'At least one drive field must be provided.' });
    }

    const updates = Object.fromEntries(
      editableDriveFields
        .filter((field) => req.body[field] !== undefined)
        .map((field) => [field, req.body[field]])
    );
    const drive = await DonationDrive.findOneAndUpdate(
      { _id: req.params.id, partnerId: req.user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!drive) {
      return res.status(404).json({ message: 'Donation drive not found.' });
    }

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'donation_drive_updated',
      resourceType: 'DonationDrive',
      resourceId: drive._id.toString(),
      result: 'success',
    });

    return res.json({ message: 'Donation drive updated successfully.', drive: serializeDrive(drive) });
  } catch (error) {
    return next(error);
  }
};

const updateDriveStatus = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid donation drive ID format.' });
    }

    const bodyError = validateEditableBody(req.body, ['status'], ['partnerId', 'createdAt', 'updatedAt']);
    if (bodyError) return res.status(400).json({ message: bodyError });
    if (typeof req.body.status !== 'string' || !driveStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: 'status is invalid.' });
    }

    const drive = await DonationDrive.findOne({ _id: req.params.id, partnerId: req.user._id });
    if (!drive) {
      return res.status(404).json({ message: 'Donation drive not found.' });
    }

    if (!driveStatusTransitions[drive.status].includes(req.body.status)) {
      return res.status(409).json({ message: `Cannot change drive status from ${drive.status} to ${req.body.status}.` });
    }

    drive.status = req.body.status;
    await drive.save();
    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'donation_drive_status_changed',
      resourceType: 'DonationDrive',
      resourceId: drive._id.toString(),
      details: `${drive.status} status set by the owning partner.`,
      result: 'success',
    });

    return res.json({ message: 'Donation drive status updated successfully.', drive: serializeDrive(drive) });
  } catch (error) {
    return next(error);
  }
};

const buildPublicDriveFilter = async (query) => {
  const filter = { status: 'active' };
  if (query.category) filter.category = query.category;
  if (query.location) filter.location = { $regex: query.location, $options: 'i' };

  if (query.q) {
    const search = { $regex: query.q, $options: 'i' };
    const matchingPartners = await User.find({
      role: 'partner',
      $or: [{ fullName: search }, { organizationName: search }],
    }).select('_id');
    filter.$or = [
      { title: search },
      { description: search },
      { location: search },
      { partnerId: { $in: matchingPartners.map((partner) => partner._id) } },
    ];
  }

  return filter;
};

const listPublicActiveDrives = async (req, res, next) => {
  try {
    const filter = await buildPublicDriveFilter(req.query || {});
    const drives = await DonationDrive.find(filter)
      .populate('partnerId', 'fullName organizationName')
      .sort({ createdAt: -1 });

    return res.json({ drives: drives.map(serializeDrive) });
  } catch (error) {
    return next(error);
  }
};

const getPublicActiveDrive = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid donation drive ID format.' });
    }

    const drive = await DonationDrive.findOne({ _id: req.params.id, status: 'active' })
      .populate('partnerId', 'fullName organizationName');
    if (!drive) {
      return res.status(404).json({ message: 'Active donation drive not found.' });
    }

    return res.json({ drive: serializeDrive(drive) });
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
};
