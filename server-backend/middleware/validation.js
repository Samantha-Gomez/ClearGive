const mongoose = require('mongoose');

const isValidEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const partnerOrganizationTypes = [
  'NGO/non-profit',
  'school',
  'barangay/community organization',
  'other',
];

const documentFields = [
  'registrationCertificate',
  'supportingOrganizationDocument',
  'representativeGovernmentId',
];

const editableVerificationFields = [
  'organizationName',
  'organizationType',
  'address',
  'officialEmail',
  'contactNumber',
  'authorizedRepresentativeName',
  'representativePosition',
];

const protectedVerificationFields = [
  'status',
  'reviewedBy',
  'reviewedAt',
  'rejectionReason',
];

const donationDriveCategories = [
  'School Supplies',
  'Food',
  'Hygiene',
  'Clothing',
  'Water',
  'Household Needs',
];

const donationDriveFields = [
  'title',
  'description',
  'category',
  'targetQuantity',
  'eventDate',
  'requestedItems',
  'location',
  'assistanceReference',
];

const protectedDonationDriveFields = [
  'partnerId',
  'status',
  'createdAt',
  'updatedAt',
];

/*
 * Donation creation:
 * The partner must select an existing registered donor.
 *
 * donorId = selected registered donor's User._id
 * item = donated item
 * quantity = donated quantity
 *
 * contributorName is NOT accepted from the frontend.
 * The backend gets the donor's registered fullName.
 */
const donationFields = [
  'donorId',
  'item',
  'quantity',
];

const protectedDonationFields = [
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

const distributionFields = [
  'donationId',
  'quantityDistributed',
  'beneficiariesAssisted',
  'notes',
  'proofMetadata',
];

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

const sendValidationError = (res, message) => {
  return res.status(400).json({ message });
};

const validateRegistration = (req, res, next) => {
  const {
    fullName,
    email,
    contactNumber,
    password,
    confirmPassword,
    role,
  } = req.body;

  if (
    !fullName ||
    typeof fullName !== 'string' ||
    fullName.trim().length < 2 ||
    fullName.trim().length > 100
  ) {
    return sendValidationError(
      res,
      'Full name is required and must be between 2 and 100 characters long.',
    );
  }

  if (
    !email ||
    typeof email !== 'string' ||
    !isValidEmail(email.trim())
  ) {
    return sendValidationError(
      res,
      'Please provide a valid email address.',
    );
  }

  if (
    !contactNumber ||
    typeof contactNumber !== 'string' ||
    !/^[+()\d\s-]{7,30}$/.test(contactNumber.trim())
  ) {
    return sendValidationError(
      res,
      'Please provide a valid contact number.',
    );
  }

  if (
    !password ||
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 128
  ) {
    return sendValidationError(
      res,
      'Password must be between 8 and 128 characters long.',
    );
  }

  if (password !== confirmPassword) {
    return sendValidationError(
      res,
      'Password and confirm password do not match.',
    );
  }

  const allowedRoles = ['donor', 'partner'];

  if (!role || !allowedRoles.includes(role)) {
    return sendValidationError(
      res,
      'Role must be donor or partner. Admin registration is not allowed here.',
    );
  }

  if (role === 'partner') {
    if (
      typeof req.body.organizationName !== 'string' ||
      req.body.organizationName.trim().length < 2 ||
      req.body.organizationName.trim().length > 150
    ) {
      return sendValidationError(
        res,
        'Organization name is required and must be between 2 and 150 characters.',
      );
    }
  }

  req.body.email = email.trim().toLowerCase();
  req.body.fullName = fullName.trim();
  req.body.contactNumber = contactNumber.trim();

  if (role === 'partner') {
    req.body.organizationName =
      req.body.organizationName.trim();

    if (typeof req.body.organizationType === 'string') {
      req.body.organizationType =
        req.body.organizationType.trim();
    }
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (
    !email ||
    typeof email !== 'string' ||
    !isValidEmail(email.trim())
  ) {
    return sendValidationError(
      res,
      'Please provide a valid email address.',
    );
  }

  if (
    !password ||
    typeof password !== 'string' ||
    password.length < 8
  ) {
    return sendValidationError(
      res,
      'Password is required and must be at least 8 characters long.',
    );
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body || {};

  if (
    typeof email !== 'string' ||
    !isValidEmail(email.trim())
  ) {
    return sendValidationError(
      res,
      'Please provide a valid email address.',
    );
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

const validatePasswordReset = (req, res, next) => {
  const {
    email,
    otp,
    password,
    confirmPassword,
  } = req.body || {};

  if (
    typeof email !== 'string' ||
    !isValidEmail(email.trim())
  ) {
    return sendValidationError(
      res,
      'Please provide a valid email address.',
    );
  }

  if (
    typeof otp !== 'string' ||
    !/^\d{6}$/.test(otp)
  ) {
    return sendValidationError(
      res,
      'Password reset code must contain exactly 6 digits.',
    );
  }

  if (
    typeof password !== 'string' ||
    password.length < 8 ||
    password.length > 128
  ) {
    return sendValidationError(
      res,
      'Password must be between 8 and 128 characters long.',
    );
  }

  if (password !== confirmPassword) {
    return sendValidationError(
      res,
      'Password and confirm password do not match.',
    );
  }

  req.body.email = email.trim().toLowerCase();

  next();
};

const validateEmailVerification = (req, res, next) => {
  const { email, otp } = req.body || {};

  if (
    typeof email !== 'string' ||
    !isValidEmail(email.trim())
  ) {
    return sendValidationError(
      res,
      'Please provide a valid email address.',
    );
  }

  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    return sendValidationError(
      res,
      'Verification code must contain exactly 6 digits.',
    );
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

const validateEmailVerificationResend = (req, res, next) => {
  const { email } = req.body || {};

  if (
    typeof email !== 'string' ||
    !isValidEmail(email.trim())
  ) {
    return sendValidationError(
      res,
      'Please provide a valid email address.',
    );
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

const validateObjectId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      message: 'Invalid resource ID format.',
    });
  }

  next();
};

const validateBodyFields = (
  body,
  allowedFields,
  protectedFields,
) => {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
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

const validatePositiveInteger = (value, fieldName) => {
  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > 100000000
  ) {
    return `${fieldName} must be a positive integer.`;
  }

  return null;
};

const validateTextField = (
  value,
  fieldName,
  minimum,
  maximum,
  required,
) => {
  if (value === undefined && !required) {
    return null;
  }

  if (typeof value !== 'string') {
    return `${fieldName} must be a string.`;
  }

  const trimmedValue = value.trim();

  if (
    required &&
    trimmedValue.length < minimum
  ) {
    return `${fieldName} is required and must be between ${minimum} and ${maximum} characters.`;
  }

  if (trimmedValue.length > maximum) {
    return `${fieldName} must be between ${minimum} and ${maximum} characters.`;
  }

  if (
    !required &&
    trimmedValue.length > 0 &&
    trimmedValue.length < minimum
  ) {
    return `${fieldName} must be between ${minimum} and ${maximum} characters.`;
  }

  return null;
};

const validateDonationDriveFields = (
  body,
  { requireAll },
) => {
  const bodyError = validateBodyFields(
    body,
    donationDriveFields,
    protectedDonationDriveFields,
  );

  if (bodyError) {
    return bodyError;
  }

  const textFields = [
    ['title', 3, 150, true],
    ['description', 10, 2000, true],
    ['location', 2, 300, true],
  ];

  for (const [
    field,
    minimum,
    maximum,
  ] of textFields) {
    if (!requireAll && body[field] === undefined) {
      continue;
    }

    const error = validateTextField(
      body[field],
      field,
      minimum,
      maximum,
      true,
    );

    if (error) {
      return error;
    }
  }

  if (requireAll || body.category !== undefined) {
    if (!donationDriveCategories.includes(body.category)) {
      return 'category is invalid.';
    }
  }

  if (requireAll || body.targetQuantity !== undefined) {
    const error = validatePositiveInteger(
      body.targetQuantity,
      'targetQuantity',
    );

    if (error) {
      return error;
    }
  }

  if (requireAll || body.eventDate !== undefined) {
    const value = body.eventDate;
    const date =
      typeof value === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00.000Z`)
        : null;

    if (
      !date ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      return 'eventDate must be a valid date in YYYY-MM-DD format.';
    }

    body.eventDate = date;
  }

  if (requireAll || body.requestedItems !== undefined) {
    if (
      !Array.isArray(body.requestedItems) ||
      body.requestedItems.length < 1 ||
      body.requestedItems.length > 50
    ) {
      return 'requestedItems must contain between 1 and 50 items.';
    }

    for (const [index, item] of body.requestedItems.entries()) {
      if (
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item)
      ) {
        return `requestedItems[${index}] must be an item object.`;
      }

      const unknownItemField = Object.keys(item).find(
        (field) => !['name', 'quantity'].includes(field),
      );

      if (unknownItemField) {
        return `requestedItems[${index}].${unknownItemField} is not accepted.`;
      }

      if (
        typeof item.name !== 'string' ||
        item.name.trim().length < 1 ||
        item.name.trim().length > 150
      ) {
        return `requestedItems[${index}].name must be between 1 and 150 characters.`;
      }

      const quantityError = validatePositiveInteger(
        item.quantity,
        `requestedItems[${index}].quantity`,
      );

      if (quantityError) {
        return quantityError;
      }
    }

    body.requestedItems = body.requestedItems.map((item) => ({
      name: item.name.trim(),
      quantity: item.quantity,
    }));
  }

  if (body.assistanceReference !== undefined) {
    const error = validateTextField(
      body.assistanceReference,
      'assistanceReference',
      1,
      300,
      false,
    );

    if (error) {
      return error;
    }
  }

  if (
    !requireAll &&
    !Object.keys(body).some((field) =>
      donationDriveFields.includes(field),
    )
  ) {
    return 'At least one drive field must be provided.';
  }

  return null;
};

const normalizeDonationDriveFields = (body) => {
  for (const field of [
    'title',
    'description',
    'location',
    'assistanceReference',
  ]) {
    if (typeof body[field] === 'string') {
      body[field] = body[field].trim();
    }
  }
};

const validateDonationDriveCreation = (
  req,
  res,
  next,
) => {
  const error = validateDonationDriveFields(
    req.body,
    { requireAll: true },
  );

  if (error) {
    return sendValidationError(res, error);
  }

  normalizeDonationDriveFields(req.body);

  next();
};

const validateDonationDriveUpdate = (
  req,
  res,
  next,
) => {
  const error = validateDonationDriveFields(
    req.body,
    { requireAll: false },
  );

  if (error) {
    return sendValidationError(res, error);
  }

  normalizeDonationDriveFields(req.body);

  next();
};

/*
 * Donation creation validation
 *
 * Required:
 * - donorId
 * - item
 * - quantity
 *
 * contributorName is intentionally NOT accepted.
 * The server gets the donor's registered name from User.fullName.
 */
const validateDonationCreation = (
  req,
  res,
  next,
) => {
  const bodyError = validateBodyFields(
    req.body,
    donationFields,
    protectedDonationFields,
  );

  if (bodyError) {
    return sendValidationError(res, bodyError);
  }

  if (
    !req.body.donorId ||
    typeof req.body.donorId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(
      req.body.donorId,
    )
  ) {
    return sendValidationError(
      res,
      'Please select a valid registered donor.',
    );
  }

  const itemError = validateTextField(
    req.body.item,
    'item',
    2,
    150,
    true,
  );

  if (itemError) {
    return sendValidationError(res, itemError);
  }

  const quantityError = validatePositiveInteger(
    req.body.quantity,
    'quantity',
  );

  if (quantityError) {
    return sendValidationError(res, quantityError);
  }

  req.body.donorId = req.body.donorId.trim();
  req.body.item = req.body.item.trim();

  next();
};

const validateDonationReceiveAction = (
  req,
  res,
  next,
) => {
  const body = req.body || {};

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).length > 0
  ) {
    return sendValidationError(
      res,
      'Donation receive action does not accept a request body.',
    );
  }

  next();
};

const validateProofMetadata = (proofMetadata) => {
  if (
    !proofMetadata ||
    typeof proofMetadata !== 'object' ||
    Array.isArray(proofMetadata)
  ) {
    return 'proofMetadata must be an object.';
  }

  const allowedFields = [
    'originalName',
    'mimeType',
    'extension',
    'size',
    'storageStatus',
  ];

  const unknownField = Object.keys(proofMetadata).find(
    (field) => !allowedFields.includes(field),
  );

  if (unknownField) {
    return `proofMetadata.${unknownField} is not an accepted field.`;
  }

  if (
    proofMetadata.originalName !== undefined &&
    (typeof proofMetadata.originalName !== 'string' ||
      proofMetadata.originalName.trim().length < 1 ||
      proofMetadata.originalName.trim().length > 255)
  ) {
    return 'proofMetadata.originalName must be between 1 and 255 characters.';
  }

  if (
    proofMetadata.mimeType !== undefined &&
    !['application/pdf', 'image/jpeg', 'image/png'].includes(
      proofMetadata.mimeType,
    )
  ) {
    return 'proofMetadata.mimeType is not supported.';
  }

  if (
    proofMetadata.extension !== undefined &&
    !['.pdf', '.jpg', '.jpeg', '.png'].includes(
      proofMetadata.extension,
    )
  ) {
    return 'proofMetadata.extension is not supported.';
  }

  if (
    proofMetadata.size !== undefined &&
    (!Number.isInteger(proofMetadata.size) ||
      proofMetadata.size < 1 ||
      proofMetadata.size > 10 * 1024 * 1024)
  ) {
    return 'proofMetadata.size must be a positive integer no larger than 10MB.';
  }

  if (
    proofMetadata.storageStatus !== undefined &&
    proofMetadata.storageStatus !== 'not_uploaded'
  ) {
    return 'proofMetadata.storageStatus must be not_uploaded.';
  }

  return null;
};

const validateDistributionCreation = (
  req,
  res,
  next,
) => {
  const bodyError = validateBodyFields(
    req.body,
    distributionFields,
    protectedDistributionFields,
  );

  if (bodyError) {
    return sendValidationError(res, bodyError);
  }

  if (
    !req.body.donationId ||
    typeof req.body.donationId !== 'string' ||
    !mongoose.Types.ObjectId.isValid(
      req.body.donationId,
    )
  ) {
    return sendValidationError(
      res,
      'donationId must be a valid MongoDB ObjectId.',
    );
  }

  const quantityError = validatePositiveInteger(
    req.body.quantityDistributed,
    'quantityDistributed',
  );

  if (quantityError) {
    return sendValidationError(res, quantityError);
  }

  const beneficiaryError = validatePositiveInteger(
    req.body.beneficiariesAssisted,
    'beneficiariesAssisted',
  );

  if (beneficiaryError) {
    return sendValidationError(res, beneficiaryError);
  }

  if (req.body.notes !== undefined) {
    const notesError = validateTextField(
      req.body.notes,
      'notes',
      1,
      1000,
      false,
    );

    if (notesError) {
      return sendValidationError(res, notesError);
    }

    req.body.notes = req.body.notes.trim();
  }

  if (req.body.proofMetadata !== undefined) {
    const proofError = validateProofMetadata(
      req.body.proofMetadata,
    );

    if (proofError) {
      return sendValidationError(res, proofError);
    }
  }

  next();
};

const validatePublicDriveQuery = (
  req,
  res,
  next,
) => {
  const {
    category,
    q,
    location,
  } = req.query || {};

  if (
    category !== undefined &&
    (
      typeof category !== 'string' ||
      !donationDriveCategories.includes(category)
    )
  ) {
    return sendValidationError(
      res,
      'category is invalid.',
    );
  }

  if (
    q !== undefined &&
    (
      typeof q !== 'string' ||
      q.trim().length > 100
    )
  ) {
    return sendValidationError(
      res,
      'q must be 100 characters or fewer.',
    );
  }

  if (
    location !== undefined &&
    (
      typeof location !== 'string' ||
      location.trim().length > 300
    )
  ) {
    return sendValidationError(
      res,
      'location must be 300 characters or fewer.',
    );
  }

  if (typeof q === 'string') {
    req.query.q = q.trim();
  }

  if (typeof location === 'string') {
    req.query.location = location.trim();
  }

  next();
};

const validatePartnerVerificationFields = (
  body,
  { requireAll },
) => {
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    return 'A verification object is required.';
  }

  const unknownField = Object.keys(body).find(
    (field) =>
      !editableVerificationFields.includes(field) &&
      !protectedVerificationFields.includes(field),
  );

  if (unknownField) {
    return `${unknownField} is not an accepted verification field.`;
  }

  const protectedField = protectedVerificationFields.find(
    (field) =>
      Object.prototype.hasOwnProperty.call(body, field),
  );

  if (protectedField) {
    return `${protectedField} is controlled by the server.`;
  }

  const stringFields = [
    ['organizationName', 2, 150],
    ['address', 5, 300],
    ['authorizedRepresentativeName', 2, 150],
    ['representativePosition', 2, 100],
  ];

  for (const [
    field,
    minimum,
    maximum,
  ] of stringFields) {
    if (!requireAll && body[field] === undefined) {
      continue;
    }

    if (
      typeof body[field] !== 'string' ||
      body[field].trim().length < minimum ||
      body[field].trim().length > maximum
    ) {
      return `${field} must be between ${minimum} and ${maximum} characters.`;
    }
  }

  if (
    requireAll ||
    body.organizationType !== undefined
  ) {
    if (
      typeof body.organizationType !== 'string' ||
      !partnerOrganizationTypes.includes(
        body.organizationType.trim(),
      )
    ) {
      return 'organizationType is invalid.';
    }
  }

  if (
    requireAll ||
    body.officialEmail !== undefined
  ) {
    if (
      typeof body.officialEmail !== 'string' ||
      !isValidEmail(body.officialEmail.trim())
    ) {
      return 'Please provide a valid official email address.';
    }
  }

  if (
    requireAll ||
    body.contactNumber !== undefined
  ) {
    if (
      typeof body.contactNumber !== 'string' ||
      !/^[+()\d\s-]{7,30}$/.test(
        body.contactNumber.trim(),
      )
    ) {
      return 'Please provide a valid contact number.';
    }
  }

  if (
    !requireAll &&
    !Object.keys(body).some((key) =>
      editableVerificationFields.includes(key),
    )
  ) {
    return 'At least one verification field must be provided.';
  }

  return null;
};

const validatePartnerVerificationSubmission = (
  req,
  res,
  next,
) => {
  const error = validatePartnerVerificationFields(
    req.body,
    { requireAll: true },
  );

  if (error) {
    return sendValidationError(res, error);
  }

  const missingDocument = documentFields.find(
    (field) => !req.files?.[field]?.[0],
  );

  if (missingDocument) {
    const documentLabels = {
      registrationCertificate: 'Registration Certificate',
      supportingOrganizationDocument: 'Supporting Organization Document',
      representativeGovernmentId: 'Representative Government ID',
    };

    return sendValidationError(
      res,
      `${documentLabels[missingDocument]} is required.`,
    );
  }

  req.body.organizationName =
    req.body.organizationName.trim();

  req.body.organizationType =
    req.body.organizationType.trim();

  req.body.address =
    req.body.address.trim();

  req.body.officialEmail =
    req.body.officialEmail.trim().toLowerCase();

  req.body.contactNumber =
    req.body.contactNumber.trim();

  req.body.authorizedRepresentativeName =
    req.body.authorizedRepresentativeName.trim();

  req.body.representativePosition =
    req.body.representativePosition.trim();

  next();
};

const validatePartnerVerificationResubmission = (
  req,
  res,
  next,
) => {
  const error = validatePartnerVerificationFields(
    req.body,
    { requireAll: false },
  );

  if (error) {
    return sendValidationError(res, error);
  }

  if (
    typeof req.body.organizationName === 'string'
  ) {
    req.body.organizationName =
      req.body.organizationName.trim();
  }

  if (
    typeof req.body.organizationType === 'string'
  ) {
    req.body.organizationType =
      req.body.organizationType.trim();
  }

  if (typeof req.body.address === 'string') {
    req.body.address = req.body.address.trim();
  }

  if (
    typeof req.body.officialEmail === 'string'
  ) {
    req.body.officialEmail =
      req.body.officialEmail.trim().toLowerCase();
  }

  if (
    typeof req.body.contactNumber === 'string'
  ) {
    req.body.contactNumber =
      req.body.contactNumber.trim();
  }

  if (
    typeof req.body.authorizedRepresentativeName ===
    'string'
  ) {
    req.body.authorizedRepresentativeName =
      req.body.authorizedRepresentativeName.trim();
  }

  if (
    typeof req.body.representativePosition ===
    'string'
  ) {
    req.body.representativePosition =
      req.body.representativePosition.trim();
  }

  next();
};

const validateRejectionRequest = (
  req,
  res,
  next,
) => {
  const body = req.body || {};

  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  ) {
    return sendValidationError(
      res,
      'A rejection reason is required.',
    );
  }

  const unknownField = Object.keys(body).find(
    (field) => field !== 'rejectionReason',
  );

  if (unknownField) {
    return sendValidationError(
      res,
      `${unknownField} is not an accepted field.`,
    );
  }

  const { rejectionReason } = body;

  if (
    typeof rejectionReason !== 'string' ||
    rejectionReason.trim().length < 5 ||
    rejectionReason.trim().length > 500
  ) {
    return sendValidationError(
      res,
      'rejectionReason must be between 5 and 500 characters.',
    );
  }

  req.body.rejectionReason =
    rejectionReason.trim();

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validatePasswordReset,
  validateEmailVerification,
  validateEmailVerificationResend,
  validateObjectId,
  validatePartnerVerificationSubmission,
  validatePartnerVerificationResubmission,
  validateRejectionRequest,
  validateDonationDriveCreation,
  validateDonationDriveUpdate,
  validateDonationCreation,
  validateDonationReceiveAction,
  validateDistributionCreation,
  validatePublicDriveQuery,
};