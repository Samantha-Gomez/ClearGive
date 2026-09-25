const mongoose = require('mongoose');

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const sendValidationError = (res, message) => {
  return res.status(400).json({ message });
};

const validateRegistration = (req, res, next) => {
  const { fullName, email, contactNumber, password, confirmPassword, role } = req.body;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
    return sendValidationError(res, 'Full name is required and must be at least 2 characters long.');
  }

  if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
    return sendValidationError(res, 'Please provide a valid email address.');
  }

  if (!contactNumber || typeof contactNumber !== 'string' || contactNumber.trim().length < 7) {
    return sendValidationError(res, 'Please provide a valid contact number.');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return sendValidationError(res, 'Password must be at least 8 characters long.');
  }

  if (password !== confirmPassword) {
    return sendValidationError(res, 'Password and confirm password do not match.');
  }

  const allowedRoles = ['donor', 'partner'];
  if (!role || !allowedRoles.includes(role)) {
    return sendValidationError(res, 'Role must be donor or partner. Admin registration is not allowed here.');
  }

  if (role === 'partner' && (!req.body.organizationName || req.body.organizationName.trim().length < 2)) {
    return sendValidationError(res, 'Organization name is required for partner registration.');
  }

  req.body.email = email.trim().toLowerCase();
  req.body.fullName = fullName.trim();
  req.body.contactNumber = contactNumber.trim();
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
    return sendValidationError(res, 'Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return sendValidationError(res, 'Password is required and must be at least 8 characters long.');
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

const validateObjectId = (req, res, next) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid resource ID format.' });
  }

  next();
};

module.exports = {
  validateRegistration,
  validateLogin,
  validateObjectId,
};
