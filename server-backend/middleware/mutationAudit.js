const { logActivity } = require('../utils/activityLogger');

const mutationMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const sensitiveFields = new Set([
  'password',
  'confirmPassword',
  'otp',
  'passwordResetOtpHash',
  'passwordResetOtpExpiresAt',
]);

const safeChangedFields = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return [];
  return Object.keys(body).filter((field) => !sensitiveFields.has(field));
};

const mutationAudit = (req, res, next) => {
  if (!mutationMethods.has(req.method)) return next();

  res.on('finish', () => {
    // Authentication middleware runs inside individual routes, so req.user is
    // available by the time the response finishes.
    if (!req.user || res.statusCode >= 400) return;

    const resourceId =
      req.params?.id ||
      req.params?.driveId ||
      req.params?.donationId ||
      req.params?.requestId ||
      '';
    const fields = safeChangedFields(req.body);
    const details = [
      `${req.method} ${req.originalUrl}`,
      fields.length ? `Changed fields: ${fields.join(', ')}` : 'No request fields.',
    ].join('. ');

    void logActivity({
      user: req.user._id,
      role: req.user.role,
      action: 'system_mutation',
      resourceType: req.baseUrl || 'API',
      resourceId: String(resourceId),
      details,
      result: 'success',
    });
  });

  next();
};

module.exports = { mutationAudit };
