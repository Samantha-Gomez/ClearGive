const requireApprovedPartner = (req, res, next) => {
  if (!req.user || req.user.role !== 'partner') {
    return res.status(403).json({ message: 'Only partners can access this resource.' });
  }

  if (req.user.verificationStatus !== 'approved') {
    return res.status(403).json({ message: 'Partner verification approval is required.' });
  }

  next();
};

const requireConfiguredAdmin = (req, res, next) => {
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

  if (!req.user || req.user.role !== 'admin' || !configuredAdminEmail || req.user.email !== configuredAdminEmail) {
    return res.status(403).json({ message: 'You do not have permission to review partner verifications.' });
  }

  next();
};

module.exports = {
  requireApprovedPartner,
  requireConfiguredAdmin,
};