const path = require('node:path');
const multer = require('multer');
const {
  allowedExtensions,
  assertLocalStorageEnabled,
  maxDocumentSize,
} = require('../utils/verificationDocumentStorage');

const documentFields = [
  'registrationCertificate',
  'supportingOrganizationDocument',
  'representativeGovernmentId',
];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxDocumentSize,
    files: documentFields.length,
    fields: 7,
    parts: 10,
    fieldSize: 1024,
  },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    const expectedMimeType = allowedExtensions[extension];
    const mimeType = file.mimetype || '';

    if (
      !expectedMimeType ||
      (mimeType &&
        mimeType !== 'application/octet-stream' &&
        mimeType !== expectedMimeType)
    ) {
      const error = new Error('Only PDF, JPG/JPEG, and PNG documents are allowed.');
      error.code = 'UNSUPPORTED_FILE_TYPE';
      return callback(error);
    }

    return callback(null, true);
  },
}).fields(documentFields.map((name) => ({ name, maxCount: 1 })));

const uploadVerificationDocuments = (req, res, next) => {
  try {
    assertLocalStorageEnabled();
  } catch (error) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  upload(req, res, (error) => {
    if (!error) return next();

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'Each verification document must be 10 MB or smaller.',
      });
    }

    if (error.code === 'UNSUPPORTED_FILE_TYPE') {
      return res.status(400).json({ message: error.message });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Use only the three supported verification document fields, with one file per field.',
      });
    }

    return res.status(400).json({
      message: 'Malformed multipart verification request.',
    });
  });
};

module.exports = uploadVerificationDocuments;