const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const maxDocumentSize = 10 * 1024 * 1024;
const storageDirectory = path.resolve(
  __dirname,
  '..',
  '.private',
  'verification-documents',
);

const documentTypes = {
  registrationCertificate: 'Registration Certificate',
  supportingOrganizationDocument: 'Supporting Organization Document',
  representativeGovernmentId: 'Representative Government ID',
};

const allowedExtensions = {
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

const createStorageError = (message, statusCode, code) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

const assertLocalStorageEnabled = () => {
  if (
    process.env.NODE_ENV === 'production' ||
    process.env.RENDER === 'true' ||
    process.env.RENDER_SERVICE_ID
  ) {
    throw createStorageError(
      'Persistent document storage is not configured. Uploads are unavailable in production.',
      503,
      'PERSISTENT_STORAGE_UNAVAILABLE',
    );
  }
};

const getSafeOriginalName = (originalName) => {
  const baseName = path.basename(
    path.win32.basename(String(originalName || '')),
  );

  return baseName
    .replace(/[\u0000-\u001f\u007f]/g, '_')
    .trim();
};

const detectDocumentType = (buffer) => {
  if (buffer.subarray(0, 5).toString() === '%PDF-') {
    return { extension: '.pdf', mimeType: 'application/pdf' };
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return { extension: '.jpg', mimeType: 'image/jpeg' };
  }

  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return { extension: '.png', mimeType: 'image/png' };
  }

  return null;
};

const inspectVerificationFile = (file, documentType) => {
  const label = documentTypes[documentType];

  if (!label || !file || !Buffer.isBuffer(file.buffer)) {
    throw createStorageError('A verification document is required.', 400, 'DOCUMENT_REQUIRED');
  }

  const originalName = getSafeOriginalName(file.originalname);
  const extension = path.extname(originalName).toLowerCase();
  const expectedMimeType = allowedExtensions[extension];

  if (!originalName || originalName.length > 255 || !expectedMimeType) {
    throw createStorageError(
      `${label} must be a PDF, JPG/JPEG, or PNG file.`,
      400,
      'UNSUPPORTED_FILE_TYPE',
    );
  }

  if (file.buffer.length < 1 || file.buffer.length > maxDocumentSize) {
    throw createStorageError(
      `${label} must be between 1 byte and 10 MB.`,
      400,
      'FILE_SIZE_INVALID',
    );
  }

  const detectedType = detectDocumentType(file.buffer);

  if (
    !detectedType ||
    detectedType.mimeType !== expectedMimeType ||
    (file.mimetype &&
      file.mimetype !== 'application/octet-stream' &&
      file.mimetype !== detectedType.mimeType)
  ) {
    throw createStorageError(
      `${label} file contents do not match a supported file type.`,
      400,
      'UNSUPPORTED_FILE_TYPE',
    );
  }

  return {
    documentType,
    originalName,
    extension: detectedType.extension,
    mimeType: detectedType.mimeType,
    size: file.buffer.length,
    storageStatus: 'stored',
    storageProvider: 'local',
    uploadedAt: new Date(),
  };
};

const getSafeStoragePath = (storageKey) => {
  if (
    typeof storageKey !== 'string' ||
    !/^[0-9a-f-]{36}\.(pdf|jpg|jpeg|png)$/.test(storageKey)
  ) {
    throw createStorageError('Verification document not found.', 404, 'DOCUMENT_NOT_FOUND');
  }

  const filePath = path.resolve(storageDirectory, storageKey);

  if (!filePath.startsWith(`${storageDirectory}${path.sep}`)) {
    throw createStorageError('Verification document not found.', 404, 'DOCUMENT_NOT_FOUND');
  }

  return filePath;
};

const storeVerificationFile = async (file, metadata) => {
  assertLocalStorageEnabled();

  const storageKey = `${crypto.randomUUID()}${metadata.extension}`;
  const filePath = getSafeStoragePath(storageKey);

  try {
    await fs.mkdir(storageDirectory, { recursive: true, mode: 0o700 });
    await fs.writeFile(filePath, file.buffer, { flag: 'wx', mode: 0o600 });
  } catch {
    try {
      await fs.unlink(filePath);
    } catch {
      // No file was committed if the write itself failed.
    }

    throw createStorageError(
      'Unable to store the verification document. Please try again.',
      503,
      'DOCUMENT_STORAGE_FAILED',
    );
  }

  return { ...metadata, storageKey };
};

const getVerificationFilePath = (storageKey) => getSafeStoragePath(storageKey);

const removeVerificationFile = async (document) => {
  if (document?.storageProvider !== 'local' || !document.storageKey) {
    return;
  }

  try {
    await fs.unlink(getSafeStoragePath(document.storageKey));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
};

module.exports = {
  allowedExtensions,
  assertLocalStorageEnabled,
  documentTypes,
  getSafeOriginalName,
  getVerificationFilePath,
  inspectVerificationFile,
  maxDocumentSize,
  removeVerificationFile,
  storeVerificationFile,
};