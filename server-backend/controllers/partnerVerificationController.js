const mongoose = require('mongoose');
const fs = require('node:fs/promises');
const { createReadStream } = require('node:fs');
const PartnerVerification = require('../models/PartnerVerification');
const User = require('../models/User');
const {
  documentTypes,
  getVerificationFilePath,
  inspectVerificationFile,
  removeVerificationFile,
  storeVerificationFile,
} = require('../utils/verificationDocumentStorage');
const { logActivity } = require('../utils/activityLogger');
const {
  createNotification,
  createNotifications,
} = require('../utils/notificationService');

const editableFields = [
  'organizationName',
  'organizationType',
  'address',
  'officialEmail',
  'contactNumber',
  'authorizedRepresentativeName',
  'representativePosition',
];

const documentFields = [
  'registrationCertificate',
  'supportingOrganizationDocument',
  'representativeGovernmentId',
];

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const ensureBodyObject = (body) =>
  body && typeof body === 'object' && !Array.isArray(body);

const validateVerificationBody = (
  body,
  { requireAllFields = false } = {},
) => {
  if (!ensureBodyObject(body)) {
    return 'A request body is required.';
  }

  const protectedFields = [
    '_id',
    'user',
    'status',
    'rejectionReason',
    'submittedAt',
    'reviewedAt',
    'reviewedBy',
    'createdAt',
    'updatedAt',
    'verificationStatus',
    'isApproved',
  ];

  const protectedField = protectedFields.find((field) =>
    Object.prototype.hasOwnProperty.call(body, field),
  );

  if (protectedField) {
    return `${protectedField} is controlled by the server.`;
  }

  const unknownField = Object.keys(body).find(
    (field) => !editableFields.includes(field),
  );

  if (unknownField) {
    return `${unknownField} is not an accepted field.`;
  }

  const requiredTextFields = [
    'organizationName',
    'organizationType',
    'address',
    'officialEmail',
    'contactNumber',
    'authorizedRepresentativeName',
    'representativePosition',
  ];

  if (requireAllFields) {
    const missingField = requiredTextFields.find(
      (field) =>
        typeof body[field] !== 'string' ||
        body[field].trim().length === 0,
    );

    if (missingField) {
      return `${missingField} is required.`;
    }
  }

  const textLimits = {
    organizationName: 150,
    organizationType: 100,
    address: 300,
    officialEmail: 254,
    contactNumber: 30,
    authorizedRepresentativeName: 150,
    representativePosition: 100,
  };

  for (const field of requiredTextFields) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'string') {
        return `${field} must be a string.`;
      }

      if (
        body[field].trim().length < 1 ||
        body[field].trim().length > textLimits[field]
      ) {
        return `${field} must be between 1 and ${textLimits[field]} characters.`;
      }
    }
  }

  if (body.officialEmail !== undefined) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(body.officialEmail.trim())) {
      return 'officialEmail must be a valid email address.';
    }
  }

  return null;
};

const serializeDocument = (document) => {
  if (!document) {
    return null;
  }

  return {
    documentType: document.documentType,
    originalName: document.originalName,
    mimeType: document.mimeType,
    extension: document.extension,
    size: document.size,
    storageStatus: document.storageStatus,
    uploadedAt: document.uploadedAt || null,
    downloadAvailable:
      document.storageStatus === 'stored' &&
      document.storageProvider === 'local' &&
      Boolean(document.storageKey),
  };
};

const serializeVerification = (verification) => ({
  id: verification._id,
  user:
    verification.user && verification.user._id
      ? {
          id: verification.user._id,
          fullName: verification.user.fullName,
          email: verification.user.email,
          role: verification.user.role,
        }
      : verification.user,
  organizationName: verification.organizationName,
  organizationType: verification.organizationType,
  address: verification.address,
  officialEmail: verification.officialEmail,
  contactNumber: verification.contactNumber,
  authorizedRepresentativeName:
    verification.authorizedRepresentativeName,
  representativePosition: verification.representativePosition,
  registrationCertificate: serializeDocument(
    verification.registrationCertificate,
  ),
  supportingOrganizationDocument: serializeDocument(
    verification.supportingOrganizationDocument,
  ),
  representativeGovernmentId: serializeDocument(
    verification.representativeGovernmentId,
  ),
  status: verification.status,
  rejectionReason: verification.rejectionReason || null,
  submittedAt: verification.submittedAt,
  reviewedAt: verification.reviewedAt,
  reviewedBy: verification.reviewedBy || null,
});

const saveUploadedDocuments = async (
  files,
  { requireAllFields = false, verification = null } = {},
) => {
  const selectedFiles = {};

  for (const field of documentFields) {
    const file = files?.[field]?.[0];

    if (!file) {
      if (requireAllFields) {
        const error = new Error(`${documentTypes[field]} is required.`);
        error.statusCode = 400;
        throw error;
      }

      continue;
    }

    selectedFiles[field] = inspectVerificationFile(file, field);
  }

  const storedDocuments = {};

  try {
    for (const field of documentFields) {
      if (selectedFiles[field]) {
        storedDocuments[field] = await storeVerificationFile(
          files[field][0],
          selectedFiles[field],
        );
      }
    }
  } catch (error) {
    await Promise.allSettled(
      Object.values(storedDocuments).map(removeVerificationFile),
    );
    throw error;
  }

  const replacedDocuments = verification
    ? documentFields
        .filter((field) => storedDocuments[field] && verification[field]?.storageKey)
        .map((field) => verification[field])
    : [];

  return { storedDocuments, replacedDocuments };
};

const cleanupReplacedDocuments = async (documents) => {
  const results = await Promise.allSettled(
    documents.map(removeVerificationFile),
  );

  if (results.some((result) => result.status === 'rejected')) {
    console.error('A replaced verification document could not be removed.');
  }
};

const updatePartnerState = async (userId, status) => {
  await User.findOneAndUpdate(
    {
      _id: userId,
      role: 'partner',
    },
    {
      verificationStatus: status,
      isApproved: status === 'approved',
    },
  );
};

const notifyAdmins = async ({
  type,
  title,
  message,
  verificationId,
}) => {
  const admins = await User.find({
    role: 'admin',
    status: 'active',
  }).select('_id role');

  await createNotifications(
    admins.map((admin) => ({
      recipient: admin._id,
      role: 'admin',
      type,
      title,
      message,
      resourceType: 'verification',
      resourceId: verificationId.toString(),
    })),
  );
};

const submitVerification = async (req, res, next) => {
  try {
    const bodyError = validateVerificationBody(req.body, {
      requireAllFields: true,
    });

    if (bodyError) {
      return res.status(400).json({
        message: bodyError,
      });
    }

    const existingVerification =
      await PartnerVerification.findOne({
        user: req.user._id,
      });

    if (existingVerification) {
      return res.status(409).json({
        message:
          existingVerification.status === 'rejected'
            ? 'This verification was rejected. Use the resubmission endpoint to correct it.'
            : 'An active verification submission already exists.',
      });
    }

    const { storedDocuments } = await saveUploadedDocuments(
      req.files,
      { requireAllFields: true },
    );

    let verification;

    try {
      verification = await PartnerVerification.create({
        user: req.user._id,
        ...Object.fromEntries(
          editableFields.map((field) => [
            field,
            req.body[field],
          ]),
        ),
        ...storedDocuments,
        status: 'pending',
        submittedAt: new Date(),
      });
    } catch (error) {
      await Promise.allSettled(
        Object.values(storedDocuments).map(removeVerificationFile),
      );
      throw error;
    }

    await updatePartnerState(req.user._id, 'pending');

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'partner_verification_submitted',
      resourceType: 'PartnerVerification',
      resourceId: verification._id.toString(),
      result: 'success',
    });

    await createNotification({
      recipient: req.user._id,
      role: 'partner',
      type: 'verification_submitted',
      title: 'Verification submitted',
      message:
        'Your partner verification has been submitted and is awaiting admin review.',
      resourceType: 'verification',
      resourceId: verification._id.toString(),
    });

    await notifyAdmins({
      type: 'new_partner_verification',
      title: 'New partner verification',
      message:
        'A partner organization has submitted a verification request for review.',
      verificationId: verification._id,
    });

    return res.status(201).json({
      message: 'Partner verification submitted successfully.',
      verification: serializeVerification(verification),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An active verification submission already exists.',
      });
    }

    return next(error);
  }
};

const getMyVerification = async (req, res, next) => {
  try {
    const verification = await PartnerVerification.findOne({
      user: req.user._id,
    });

    if (!verification) {
      return res.status(404).json({
        message: 'Partner verification not found.',
      });
    }

    return res.json({
      verification: serializeVerification(verification),
    });
  } catch (error) {
    return next(error);
  }
};

const resubmitVerification = async (req, res, next) => {
  try {
    const bodyError = validateVerificationBody(req.body, {
      requireAllFields: false,
    });

    if (bodyError) {
      return res.status(400).json({
        message: bodyError,
      });
    }

    const verification = await PartnerVerification.findOne({
      user: req.user._id,
    });

    if (!verification) {
      return res.status(404).json({
        message: 'Partner verification not found.',
      });
    }

    if (verification.status !== 'rejected') {
      return res.status(409).json({
        message:
          'Only rejected verifications can be resubmitted.',
      });
    }

    const { storedDocuments, replacedDocuments } =
      await saveUploadedDocuments(req.files, { verification });

    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        verification[field] = req.body[field].trim();
      }
    }

    for (const field of documentFields) {
      if (storedDocuments[field]) {
        verification[field] = storedDocuments[field];
      }
    }

    verification.status = 'pending';
    verification.rejectionReason = undefined;
    verification.reviewedBy = null;
    verification.reviewedAt = null;
    verification.submittedAt = new Date();

    try {
      await verification.save();
    } catch (error) {
      await Promise.allSettled(
        Object.values(storedDocuments).map(removeVerificationFile),
      );
      throw error;
    }

    await cleanupReplacedDocuments(replacedDocuments);

    await updatePartnerState(req.user._id, 'pending');

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'partner_verification_resubmitted',
      resourceType: 'PartnerVerification',
      resourceId: verification._id.toString(),
      result: 'success',
    });

    await createNotification({
      recipient: req.user._id,
      role: 'partner',
      type: 'verification_resubmitted',
      title: 'Verification resubmitted',
      message:
        'Your corrected partner verification has been resubmitted and is awaiting admin review.',
      resourceType: 'verification',
      resourceId: verification._id.toString(),
    });

    await notifyAdmins({
      type: 'partner_verification_resubmitted',
      title: 'Partner verification resubmitted',
      message:
        'A previously rejected partner verification has been resubmitted for review.',
      verificationId: verification._id,
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
    const allowedStatuses = [
      'pending',
      'approved',
      'rejected',
    ];

    const filter = {};

    if (req.query.status !== undefined) {
      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          message: 'status filter is invalid.',
        });
      }

      filter.status = req.query.status;
    }

    const verifications = await PartnerVerification.find(filter)
      .populate('user', 'fullName email role')
      .sort({ submittedAt: -1 });

    return res.json({
      verifications: verifications.map(
        serializeVerification,
      ),
    });
  } catch (error) {
    return next(error);
  }
};

const getVerificationById = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid verification ID format.',
      });
    }

    const verification =
      await PartnerVerification.findById(
        req.params.id,
      ).populate('user', 'fullName email role');

    if (!verification) {
      return res.status(404).json({
        message: 'Partner verification not found.',
      });
    }

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'partner_verification_viewed_by_admin',
      resourceType: 'PartnerVerification',
      resourceId: verification._id.toString(),
      result: 'success',
    });

    return res.json({
      verification: serializeVerification(verification),
    });
  } catch (error) {
    return next(error);
  }
};

const getVerificationDocument = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid verification ID format.',
      });
    }

    if (!documentFields.includes(req.params.documentType)) {
      return res.status(404).json({
        message: 'Verification document not found.',
      });
    }

    const verification = await PartnerVerification.findById(req.params.id);
    const document = verification?.[req.params.documentType];

    if (
      !document ||
      document.storageStatus !== 'stored' ||
      document.storageProvider !== 'local' ||
      !document.storageKey
    ) {
      return res.status(404).json({
        message: 'Verification document not found.',
      });
    }

    const filePath = getVerificationFilePath(document.storageKey);
    await fs.access(filePath);

    res.set({
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Type': document.mimeType,
    });
    res.attachment(document.originalName);

    const stream = createReadStream(filePath);
    stream.on('error', (error) => {
      if (error.code === 'ENOENT' && !res.headersSent) {
        return res.status(404).json({
          message: 'Verification document not found.',
        });
      }

      if (!res.headersSent) return next(error);
      return res.destroy();
    });
    stream.pipe(res);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        message: 'Verification document not found.',
      });
    }

    return next(error);
  }
};

const approveVerification = async (req, res, next) => {
  try {
    if (
      req.body !== undefined &&
      (!ensureBodyObject(req.body) ||
        Object.keys(req.body).length > 0)
    ) {
      return res.status(400).json({
        message:
          'Approval action does not accept a request body.',
      });
    }

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid verification ID format.',
      });
    }

    const verification =
      await PartnerVerification.findById(
        req.params.id,
      );

    if (!verification) {
      return res.status(404).json({
        message: 'Partner verification not found.',
      });
    }

    if (verification.status !== 'pending') {
      return res.status(409).json({
        message:
          'Only pending verifications can be approved.',
      });
    }

    const partner = await User.findOne({
      _id: verification.user,
      role: 'partner',
    });

    if (!partner) {
      return res.status(409).json({
        message:
          'The verification is not associated with a valid partner account.',
      });
    }

    verification.status = 'approved';
    verification.reviewedAt = new Date();
    verification.reviewedBy = req.user._id;
    verification.rejectionReason = undefined;

    await verification.save();

    await updatePartnerState(
      verification.user,
      'approved',
    );

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'partner_verification_approved',
      resourceType: 'PartnerVerification',
      resourceId: verification._id.toString(),
      result: 'success',
    });

    await createNotification({
      recipient: partner._id,
      role: 'partner',
      type: 'verification_approved',
      title: 'Verification approved',
      message:
        'Your partner organization has been verified and approved by an administrator.',
      resourceType: 'verification',
      resourceId: verification._id.toString(),
    });

    return res.json({
      message: 'Partner verification approved.',
      verification: serializeVerification(verification),
    });
  } catch (error) {
    return next(error);
  }
};

const rejectVerification = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: 'Invalid verification ID format.',
      });
    }

    if (!ensureBodyObject(req.body)) {
      return res.status(400).json({
        message: 'A request body is required.',
      });
    }

    const allowedFields = ['rejectionReason'];

    const unknownField = Object.keys(req.body).find(
      (field) => !allowedFields.includes(field),
    );

    if (unknownField) {
      return res.status(400).json({
        message: `${unknownField} is not an accepted field.`,
      });
    }

    if (
      typeof req.body.rejectionReason !== 'string' ||
      req.body.rejectionReason.trim().length < 3 ||
      req.body.rejectionReason.trim().length > 1000
    ) {
      return res.status(400).json({
        message:
          'rejectionReason must be between 3 and 1000 characters.',
      });
    }

    const verification =
      await PartnerVerification.findById(
        req.params.id,
      );

    if (!verification) {
      return res.status(404).json({
        message: 'Partner verification not found.',
      });
    }

    if (verification.status !== 'pending') {
      return res.status(409).json({
        message:
          'Only pending verifications can be rejected.',
      });
    }

    const partner = await User.findOne({
      _id: verification.user,
      role: 'partner',
    });

    if (!partner) {
      return res.status(409).json({
        message:
          'The verification is not associated with a valid partner account.',
      });
    }

    verification.status = 'rejected';
    verification.rejectionReason =
      req.body.rejectionReason.trim();
    verification.reviewedAt = new Date();
    verification.reviewedBy = req.user._id;

    await verification.save();

    await updatePartnerState(
      verification.user,
      'rejected',
    );

    await logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'partner_verification_rejected',
      resourceType: 'PartnerVerification',
      resourceId: verification._id.toString(),
      result: 'success',
    });

    await createNotification({
      recipient: partner._id,
      role: 'partner',
      type: 'verification_rejected',
      title: 'Verification rejected',
      message: `Your partner verification was rejected. Reason: ${verification.rejectionReason}`,
      resourceType: 'verification',
      resourceId: verification._id.toString(),
    });

    return res.json({
      message: 'Partner verification rejected.',
      verification: serializeVerification(verification),
    });
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
  getVerificationDocument,
  approveVerification,
  rejectVerification,
};