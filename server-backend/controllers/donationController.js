const mongoose = require('mongoose');
const DonationDrive = require('../models/DonationDrive');
const Donation = require('../models/Donation');
const { logActivity } = require('../utils/activityLogger');

const donationFields = ['item', 'quantity'];
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

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const ensureBodyObject = (body) => body && typeof body === 'object' && !Array.isArray(body);

const validateDonationBody = (body) => {
  if (!ensureBodyObject(body)) return 'A request body is required.';

  const protectedField = protectedDonationFields.find((field) => Object.prototype.hasOwnProperty.call(body, field));
  if (protectedField) return `${protectedField} is controlled by the server.`;

  const unknownField = Object.keys(body).find((field) => !donationFields.includes(field));
  if (unknownField) return `${unknownField} is not an accepted field.`;

  if (typeof body.item !== 'string' || body.item.trim().length < 2 || body.item.trim().length > 150) {
    return 'item must be between 2 and 150 characters.';
  }
  if (!Number.isInteger(body.quantity) || body.quantity < 1) {
    return 'quantity must be a positive integer.';
  }

  return null;
};

const serializeDonation = (donation) => ({
  id: donation._id,
  driveId: donation.driveId,
  donorId: donation.donorId,
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
      return res.status(400).json({ message: 'Invalid donation drive ID format.' });
    }

    const bodyError = validateDonationBody(req.body);
    if (bodyError) return res.status(400).json({ message: bodyError });

    const drive = await DonationDrive.findOne({ _id: req.params.driveId, status: 'active' });
    if (!drive) {
      return res.status(404).json({ message: 'Active donation drive not found.' });
    }

    const donation = await Donation.create({
      driveId: drive._id,
      donorId: req.user._id,
      item: req.body.item.trim(),
      quantity: req.body.quantity,
      status: 'Recorded',
      recordedAt: new Date(),
    });

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'donation_recorded',
      resourceType: 'Donation',
      resourceId: donation._id.toString(),
      result: 'success',
    });

    return res.status(201).json({ message: 'Donation recorded successfully.', donation: serializeDonation(donation) });
  } catch (error) {
    return next(error);
  }
};

const listDriveDonations = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.driveId)) {
      return res.status(400).json({ message: 'Invalid donation drive ID format.' });
    }

    const drive = await DonationDrive.findOne({ _id: req.params.driveId, partnerId: req.user._id });
    if (!drive) {
      return res.status(404).json({ message: 'Donation drive not found.' });
    }

    const donations = await Donation.find({ driveId: drive._id }).sort({ recordedAt: -1 });
    return res.json({ donations: donations.map(serializeDonation) });
  } catch (error) {
    return next(error);
  }
};

const receiveDonation = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.driveId) || !isValidObjectId(req.params.donationId)) {
      return res.status(400).json({ message: 'Invalid drive or donation ID format.' });
    }
    if (!ensureBodyObject(req.body) || Object.keys(req.body).length > 0) {
      return res.status(400).json({ message: 'Donation receive action does not accept a request body.' });
    }

    const drive = await DonationDrive.findOne({ _id: req.params.driveId, partnerId: req.user._id });
    if (!drive) {
      return res.status(404).json({ message: 'Donation drive not found.' });
    }

    const donation = await Donation.findOne({ _id: req.params.donationId, driveId: drive._id });
    if (!donation) {
      return res.status(404).json({ message: 'Donation not found for this drive.' });
    }
    if (donation.status !== 'Recorded') {
      return res.status(409).json({ message: `Cannot receive a donation in ${donation.status} status.` });
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

    return res.json({ message: 'Donation marked as received.', donation: serializeDonation(donation) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  recordDonation,
  listDriveDonations,
  receiveDonation,
};
