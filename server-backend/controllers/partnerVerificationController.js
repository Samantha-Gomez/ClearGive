const mongoose = require('mongoose');
const PartnerVerification = require('../models/PartnerVerification');
const User = require('../models/User');
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
  'registrationCertificate',
  'supportingOrganizationDocument',
  'representativeGovernmentId',
];

const documentFields = [
  'registrationCertificate',
  'supportingOrganizationDocument',
  'representativeGovernmentId',
];

const allowedDocumentMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

const allowedDocumentExtensions = [
  'pdf',
  'jpg',
  'jpeg',
  'png',
];

const maxDocumentSize = 10 * 1024 * 1024;

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);

const ensureBodyObject = (body) =>
  body && typeof body === 'object' && !Array.isArray(body);

const validateDocumentMetadata = (document, fieldName) => {
  if (document === undefined) {
    return null;
  }

  if (
    !document ||
    typeof document !== 'object' ||
    Array.isArray(document)
  ) {
    return `${fieldName} must be an object.`;
  }

  const allowedFields = [
    'originalName',
    'mimeType',
    'extension',
    'size',
    'storageStatus',
  ];

  const unknownField = Object.keys(document).find(
    (field) => !allowedFields.includes(field),
  );

  if (unknownField) {
    return `${fieldName}.${unknownField} is not an accepted field.`;
  }

  if (
    typeof document.originalName !== 'string' ||
    document.originalName.trim().length < 1 ||
    document.originalName.trim().length > 255
  ) {
    return `${fieldName}.originalName must be between 1 and 255 characters.`;
  }

  const safeFileNamePattern = /^[a-zA-Z0-9._() -]+$/;

  if (!safeFileNamePattern.test(document.originalName.trim())) {
    return `${fieldName}.originalName contains invalid characters.`;
  }

  if (
    typeof document.mimeType !== 'string' ||
    !allowedDocumentMimeTypes.includes(
      document.mimeType.toLowerCase(),
    )
  ) {
    return `${fieldName}.mimeType is not supported.`;
  }

  if (
    typeof document.extension !== 'string' ||
    !allowedDocumentExtensions.includes(
      document.extension.toLowerCase().replace('.', ''),
    )
  ) {
    return `${fieldName}.extension is not supported.`;
  }

  if (
    !Number.isInteger(document.size) ||
    document.size < 1 ||
    document.size > maxDocumentSize
  ) {
    return `${fieldName}.size must be between 1 byte and 10MB.`;
  }

  if (
    document.storageStatus !== undefined &&
    document.storageStatus !== 'not_uploaded'
  ) {
    return `${fieldName}.storageStatus must be not_uploaded.`;
  }

  const extension = document.extension
    .toLowerCase()
    .replace('.', '');

  const mimeExtensionMatch = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
  };

  if (
    !mimeExtensionMatch[document.mimeType.toLowerCase()]?.includes(
      extension,
    )
  ) {
    return `${fieldName}.mimeType and extension do not match.`;
  }

  return null;
};

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

  for (const field of documentFields) {
    const documentError = validateDocumentMetadata(
      body[field],
      field,
    );

    if (documentError) {
      return documentError;
    }
  }

  if (requireAllFields) {
    const missingDocument = documentFields.find(
      (field) => body[field] === undefined,
    );

    if (missingDocument) {
      return `${missingDocument} is required.`;
    }
  }

  return null;
};

const serializeDocument = (document) => {
  if (!document) {
    return null;
  }

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

    const verification = await PartnerVerification.create({
      user: req.user._id,
      ...Object.fromEntries(
        editableFields.map((field) => [
          field,
          req.body[field],
        ]),
      ),
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

    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        verification[field] =
          typeof req.body[field] === 'string'
            ? req.body[field].trim()
            : req.body[field];
      }
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
  approveVerification,
  rejectVerification,
};