const requireApprovedPartner = (req, res, next) => {
  if (!req.user || req.user.role !== 'partner') {
    return res.status(403).json({ message: 'Only partners can access this resource.' });
  }

  if (req.user.verificationStatus !== 'approved') {
    return res.status(403).json({ message: 'Partner verification approval is required.' });
  }

  next();
};

module.exports = {
  requireApprovedPartner,
};