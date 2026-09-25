const PartnerVerification = require('../models/PartnerVerification');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');

const editableFields = [
  'organizationName',
  'organizationType',
  'address',
  'officialEmail',
  'contactNumber',
  'authorizedRepresentativeName',
  'representativePosition',
  'registrationCertificate',
  'supportingOrganizationDocument',
  'representativeGovernmentId',
];

const serializeDocument = (document) => {
  if (!document) return null;

  return {
    originalName: document.originalName,
    mimeType: document.mimeType,
    extension: document.extension,
    size: document.size,
    storageStatus: document.storageStatus,
  };
};

const serializeVerification = (verification) => ({
  id: verification._id,
  user: verification.user && verification.user._id ? {
    id: verification.user._id,
    fullName: verification.user.fullName,
    email: verification.user.email,
    role: verification.user.role,
  } : verification.user,
  organizationName: verification.organizationName,
  organizationType: verification.organizationType,
  address: verification.address,
  officialEmail: verification.officialEmail,
  contactNumber: verification.contactNumber,
  authorizedRepresentativeName: verification.authorizedRepresentativeName,
  representativePosition: verification.representativePosition,
  registrationCertificate: serializeDocument(verification.registrationCertificate),
  supportingOrganizationDocument: serializeDocument(verification.supportingOrganizationDocument),
  representativeGovernmentId: serializeDocument(verification.representativeGovernmentId),
  status: verification.status,
  rejectionReason: verification.rejectionReason || null,
  submittedAt: verification.submittedAt,
  reviewedAt: verification.reviewedAt,
  reviewedBy: verification.reviewedBy || null,
});

const updatePartnerState = async (userId, status) => {
  await User.findOneAndUpdate(
    { _id: userId, role: 'partner' },
    { verificationStatus: status, isApproved: status === 'approved' },
  );
};

const submitVerification = async (req, res, next) => {
  try {
    const existingVerification = await PartnerVerification.findOne({ user: req.user._id });
    if (existingVerification) {
      return res.status(409).json({
        message: existingVerification.status === 'rejected'
          ? 'This verification was rejected. Use the resubmission endpoint to correct it.'
          : 'An active verification submission already exists.',
      });
    }

    const verification = await PartnerVerification.create({
      user: req.user._id,
      ...Object.fromEntries(editableFields.map((field) => [field, req.body[field]])),
      status: 'pending',
      submittedAt: new Date(),
    });

    await updatePartnerState(req.user._id, 'pending');
    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'partner_verification_submitted',
      resourceType: 'PartnerVerification',
      resourceId: verification._id.toString(),
      result: 'success',
    });

    return res.status(201).json({
      message: 'Partner verification submitted successfully.',
      verification: serializeVerification(verification),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An active verification submission already exists.' });
    }
    return next(error);
  }
};

const getMyVerification = async (req, res, next) => {
  try {
    const verification = await PartnerVerification.findOne({ user: req.user._id });
    if (!verification) {
      return res.status(404).json({ message: 'Partner verification not found.' });
    }

    return res.json({ verification: serializeVerification(verification) });
  } catch (error) {
    return next(error);
  }
};

const resubmitVerification = async (req, res, next) => {
  try {
    const verification = await PartnerVerification.findOne({ user: req.user._id });
    if (!verification) {
      return res.status(404).json({ message: 'Partner verification not found.' });
    }
    if (verification.status !== 'rejected') {
      return res.status(409).json({ message: 'Only rejected verifications can be resubmitted.' });
    }

    for (const field of editableFields) {
      if (req.body[field] !== undefined) verification[field] = req.body[field];
    }
    verification.status = 'pending';
    verification.rejectionReason = undefined;
    verification.reviewedBy = null;
    verification.reviewedAt = null;
    verification.submittedAt = new Date();
    await verification.save();

    await updatePartnerState(req.user._id, 'pending');
    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'partner_verification_resubmitted',
      resourceType: 'PartnerVerification',
      resourceId: verification._id.toString(),
      result: 'success',
    });

    return res.json({
      message: 'Partner verification resubmitted successfully.',
      verification: serializeVerification(verification),
    });
  } catch (error) {
    return next(error);
  }
};

const listVerifications = async (req, res, next) => {
  try {
    const allowedStatuses = ['pending', 'approved', 'rejected'];
    const filter = {};
    if (req.query.status !== undefined) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({ message: 'status filter is invalid.' });
      }
      filter.status = req.query.status;
    }

    const verifications = await PartnerVerification.find(filter)
      .populate('user', 'fullName email role')
      .sort({ submittedAt: -1 });

    return res.json({ verifications: verifications.map(serializeVerification) });
  } catch (error) {
    return next(error);
  }
};

const getVerificationById = async (req, res, next) => {
  try {
    const verification = await PartnerVerification.findById(req.params.id).populate('user', 'fullName email role');
    if (!verification) {
      return res.status(404).json({ message: 'Partner verification not found.' });
    }

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'partner_verification_viewed_by_admin',
      resourceType: 'PartnerVerification',
      resourceId: verification._id.toString(),
      result: 'success',
    });

    return res.json({ verification: serializeVerification(verification) });
  } catch (error) {
    return next(error);
  }
};

const approveVerification = async (req, res, next) => {
  try {
    const verification = await PartnerVerification.findById(req.params.id);
    if (!verification) {
      return res.status(404).json({ message: 'Partner verification not found.' });
    }
    if (verification.status !== 'pending') {
      return res.status(409).json({ message: 'Only pending verifications can be approved.' });
    }

    verification.status = 'approved';
    verification.reviewedAt = new Date();
    verification.reviewedBy = req.user._id;
    verification.rejectionReason = undefined;
    await verification.save();
    await updatePartnerState(verification.user, 'approved');
    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'partner_verification_approved',
      resourceType: 'PartnerVerification',
      resourceId: verification._id.toString(),
      result: 'success',
    });

    return res.json({ message: 'Partner verification approved.', verification: serializeVerification(verification) });
  } catch (error) {
    return next(error);
  }
};

const rejectVerification = async (req, res, next) => {
  try {
    const verification = await PartnerVerification.findById(req.params.id);
    if (!verification) {
      return res.status(404).json({ message: 'Partner verification not found.' });
    }
    if (verification.status !== 'pending') {
      return res.status(409).json({ message: 'Only pending verifications can be rejected.' });
    }

    verification.status = 'rejected';
    verification.rejectionReason = req.body.rejectionReason;
    verification.reviewedAt = new Date();
    verification.reviewedBy = req.user._id;
    await verification.save();
    await updatePartnerState(verification.user, 'rejected');
    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'partner_verification_rejected',
      resourceType: 'PartnerVerification',
      resourceId: verification._id.toString(),
      result: 'success',
    });

    return res.json({ message: 'Partner verification rejected.', verification: serializeVerification(verification) });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  submitVerification,
  getMyVerification,
  resubmitVerification,
  listVerifications,
  getVerificationById,
  approveVerification,
  rejectVerification,
};