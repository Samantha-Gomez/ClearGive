const mongoose = require('mongoose');
const DonationDrive = require('../models/DonationDrive');
const Donation = require('../models/Donation');
const Distribution = require('../models/Distribution');
const { logActivity } = require('../utils/activityLogger');

const distributionFields = ['donationId', 'quantityDistributed', 'beneficiariesAssisted', 'notes', 'proofMetadata'];
const protectedDistributionFields = [
  'driveId',
  'recordedBy',
  'createdAt',
  'updatedAt',
  'status',
  'partnerId',
  'donorId',
  'receivedAt',
  'receivedBy',
  'distributedAt',
  'distributedBy',
];

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const ensureBodyObject = (body) => body && typeof body === 'object' && !Array.isArray(body);

const validateDistributionBody = (body) => {
  if (!ensureBodyObject(body)) return 'A request body is required.';

  const protectedField = protectedDistributionFields.find((field) => Object.prototype.hasOwnProperty.call(body, field));
  if (protectedField) return `${protectedField} is controlled by the server.`;

  const unknownField = Object.keys(body).find((field) => !distributionFields.includes(field));
  if (unknownField) return `${unknownField} is not an accepted field.`;

  if (!body.donationId || !isValidObjectId(body.donationId)) {
    return 'donationId must be a valid MongoDB ObjectId.';
  }
  if (!Number.isInteger(body.quantityDistributed) || body.quantityDistributed < 1) {
    return 'quantityDistributed must be a positive integer.';
  }
  if (!Number.isInteger(body.beneficiariesAssisted) || body.beneficiariesAssisted < 1) {
    return 'beneficiariesAssisted must be a positive integer.';
  }
  if (body.notes !== undefined && (typeof body.notes !== 'string' || body.notes.trim().length > 1000)) {
    return 'notes must be 1000 characters or fewer.';
  }

  return null;
};

const serializeDistribution = (distribution) => ({
  id: distribution._id,
  driveId: distribution.driveId,
  donationId: distribution.donationId,
  quantityDistributed: distribution.quantityDistributed,
  beneficiariesAssisted: distribution.beneficiariesAssisted,
  notes: distribution.notes || null,
  proofMetadata: distribution.proofMetadata || null,
  recordedBy: distribution.recordedBy,
  createdAt: distribution.createdAt,
  updatedAt: distribution.updatedAt,
});

const getOwnedDrive = async (driveId, partnerId) => {
  if (!isValidObjectId(driveId)) return null;
  return DonationDrive.findOne({ _id: driveId, partnerId });
};

const getDistributedQuantity = async (donationId) => {
  const result = await Distribution.aggregate([
    { $match: { donationId } },
    { $group: { _id: null, total: { $sum: '$quantityDistributed' } } },
  ]);

  return result[0] ? result[0].total : 0;
};

const recordDistribution = async (req, res, next) => {
  try {
    const drive = await getOwnedDrive(req.params.driveId, req.user._id);
    if (!drive) {
      return res.status(404).json({ message: 'Donation drive not found.' });
    }

    const bodyError = validateDistributionBody(req.body);
    if (bodyError) return res.status(400).json({ message: bodyError });

    const donation = await Donation.findOne({ _id: req.body.donationId, driveId: drive._id });
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found for this drive.' });
    }
    if (donation.status !== 'Received') {
      return res.status(409).json({ message: `Cannot distribute a donation in ${donation.status} status.` });
    }

    const distributedQuantity = await getDistributedQuantity(donation._id);
    const remainingQuantity = donation.quantity - distributedQuantity;
    if (req.body.quantityDistributed > remainingQuantity) {
      return res.status(409).json({ message: 'Distributed quantity cannot exceed the remaining received quantity.' });
    }

    const distribution = await Distribution.create({
      driveId: drive._id,
      donationId: donation._id,
      quantityDistributed: req.body.quantityDistributed,
      beneficiariesAssisted: req.body.beneficiariesAssisted,
      notes: req.body.notes === undefined ? undefined : req.body.notes.trim(),
      proofMetadata: req.body.proofMetadata,
      recordedBy: req.user._id,
    });

    const totalDistributed = distributedQuantity + distribution.quantityDistributed;
    if (totalDistributed === donation.quantity) {
      donation.status = 'Distributed';
      donation.distributedAt = new Date();
      donation.distributedBy = req.user._id;
      await donation.save();

      await logActivity({
        user: req.user._id,
        role: req.user.role,
        action: 'donation_marked_distributed',
        resourceType: 'Donation',
        resourceId: donation._id.toString(),
        result: 'success',
      });
    }

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'distribution_recorded',
      resourceType: 'Distribution',
      resourceId: distribution._id.toString(),
      result: 'success',
    });

    return res.status(201).json({
      message: 'Distribution recorded successfully.',
      distribution: serializeDistribution(distribution),
      donationStatus: donation.status,
    });
  } catch (error) {
    return next(error);
  }
};

const listDriveDistributions = async (req, res, next) => {
  try {
    const drive = await getOwnedDrive(req.params.driveId, req.user._id);
    if (!drive) {
      return res.status(404).json({ message: 'Donation drive not found.' });
    }

    const distributions = await Distribution.find({ driveId: drive._id }).sort({ createdAt: -1 });
    return res.json({ distributions: distributions.map(serializeDistribution) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  recordDistribution,
  listDriveDistributions,
};
