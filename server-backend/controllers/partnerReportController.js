const mongoose = require('mongoose');
const DonationDrive = require('../models/DonationDrive');
const Donation = require('../models/Donation');
const Distribution = require('../models/Distribution');

const validQueryFields = new Set(['from', 'to', 'driveId']);

const parseDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : date;
};

const parseFilters = (query) => {
  const unknownField = Object.keys(query).find(
    (field) => !validQueryFields.has(field),
  );

  if (unknownField) {
    return { error: `${unknownField} is not an accepted report filter.` };
  }

  let from;
  let toExclusive;

  if (query.from !== undefined) {
    from = parseDate(query.from);
    if (!from) {
      return { error: 'from must be a valid date in YYYY-MM-DD format.' };
    }
  }

  if (query.to !== undefined) {
    const to = parseDate(query.to);
    if (!to) {
      return { error: 'to must be a valid date in YYYY-MM-DD format.' };
    }
    toExclusive = new Date(to);
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  }

  if (from && toExclusive && from >= toExclusive) {
    return { error: 'from must be on or before to.' };
  }

  let driveId;

  if (query.driveId !== undefined) {
    if (
      typeof query.driveId !== 'string' ||
      !mongoose.Types.ObjectId.isValid(query.driveId)
    ) {
      return { error: 'driveId must be a valid drive ID.' };
    }
    driveId = query.driveId;
  }

  return {
    filters: {
      from,
      toExclusive,
      driveId,
    },
  };
};

const getDateFilter = (field, filters) => {
  const dateFilter = {};

  if (filters.from) dateFilter.$gte = filters.from;
  if (filters.toExclusive) dateFilter.$lt = filters.toExclusive;

  return Object.keys(dateFilter).length
    ? { [field]: dateFilter }
    : {};
};

const resolveReportContext = async (req, res) => {
  const parsed = parseFilters(req.query);

  if (parsed.error) {
    res.status(400).json({ message: parsed.error });
    return null;
  }

  const { filters } = parsed;
  let driveIds;

  if (filters.driveId) {
    const drive = await DonationDrive.findOne({
      _id: filters.driveId,
      partnerId: req.user._id,
    }).select('_id');

    if (!drive) {
      res.status(404).json({ message: 'Donation drive not found.' });
      return null;
    }

    driveIds = [drive._id];
  } else {
    const drives = await DonationDrive.find({
      partnerId: req.user._id,
    }).select('_id');

    driveIds = drives.map((drive) => drive._id);
  }

  return { filters, driveIds };
};

const escapeCsvCell = (value) => {
  let text = value === null || value === undefined ? '' : String(value);

  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
};

const toCsv = (headers, rows) =>
  [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(','))
    .join('\r\n');

const formatDate = (date) =>
  date instanceof Date && !Number.isNaN(date.getTime())
    ? date.toISOString()
    : '';

const sendCsv = (res, filename, headers, rows) => {
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });

  return res.send(toCsv(headers, rows));
};

const exportDrives = async (req, res, next) => {
  try {
    const context = await resolveReportContext(req, res);
    if (!context) return;

    const { filters, driveIds } = context;
    const drives = await DonationDrive.find({
      _id: { $in: driveIds },
      ...getDateFilter('createdAt', filters),
    }).sort({ createdAt: 1 });
    const driveDateRange = getDateFilter('receivedAt', filters);
    const receivedTotals = drives.length
      ? await Donation.aggregate([
          {
            $match: {
              driveId: { $in: drives.map((drive) => drive._id) },
              receivedAt: { $ne: null, ...driveDateRange.receivedAt },
            },
          },
          {
            $group: {
              _id: '$driveId',
              total: { $sum: '$quantity' },
            },
          },
        ])
      : [];
    const totalsByDrive = new Map(
      receivedTotals.map((result) => [result._id.toString(), result.total]),
    );

    return sendCsv(
      res,
      'cleargive-drives.csv',
      ['Drive Title', 'Category', 'Target Quantity', 'Received Quantity', 'Status', 'Date'],
      drives.map((drive) => [
        drive.title,
        drive.category,
        drive.targetQuantity,
        totalsByDrive.get(drive._id.toString()) || 0,
        drive.status,
        formatDate(drive.createdAt),
      ]),
    );
  } catch (error) {
    return next(error);
  }
};

const exportDonations = async (req, res, next) => {
  try {
    const context = await resolveReportContext(req, res);
    if (!context) return;

    const { filters, driveIds } = context;
    const donations = await Donation.find({
      driveId: { $in: driveIds },
      ...getDateFilter('recordedAt', filters),
    })
      .populate('driveId', 'title')
      .sort({ recordedAt: 1 });

    return sendCsv(
      res,
      'cleargive-donations.csv',
      ['Contributor Name', 'Drive', 'Item', 'Quantity', 'Status', 'Date'],
      donations.map((donation) => [
        donation.contributorName,
        donation.driveId?.title,
        donation.item,
        donation.quantity,
        donation.status,
        formatDate(donation.recordedAt),
      ]),
    );
  } catch (error) {
    return next(error);
  }
};

const exportDistributions = async (req, res, next) => {
  try {
    const context = await resolveReportContext(req, res);
    if (!context) return;

    const { filters, driveIds } = context;
    const distributions = await Distribution.find({
      driveId: { $in: driveIds },
      ...getDateFilter('createdAt', filters),
    })
      .populate('driveId', 'title')
      .populate('donationId', 'item')
      .sort({ createdAt: 1 });

    return sendCsv(
      res,
      'cleargive-distributions.csv',
      ['Drive', 'Item', 'Quantity Distributed', 'Beneficiaries', 'Date', 'Notes'],
      distributions.map((distribution) => [
        distribution.driveId?.title,
        distribution.donationId?.item,
        distribution.quantityDistributed,
        distribution.beneficiariesAssisted,
        formatDate(distribution.createdAt),
        distribution.notes,
      ]),
    );
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  exportDrives,
  exportDonations,
  exportDistributions,
};