const rateLimit = require('express-rate-limit');

const localTestingOverrideEnabled =
  process.env.NODE_ENV !== 'production' &&
  process.env.ALLOW_LOCAL_RATE_LIMIT_TESTING === 'true';

const isLocalAddress = (req) => {
  const localAddresses = [
    '::1',
    '127.0.0.1',
    '::ffff:127.0.0.1',
  ];

  return localAddresses.includes(req.ip);
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message:
      'Too many authentication attempts. Please try again after 15 minutes.',
  },

  skipSuccessfulRequests: false,

  skip: (req) => {
    // Only allow the testing bypass during non-production
    // local development.
    return localTestingOverrideEnabled && isLocalAddress(req);
  },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,

  message: {
    message:
      'Too many requests from this IP. Please try again later.',
  },

  skip: (req) => {
    // Allow unlimited requests from localhost only when
    // the explicit local testing override is enabled.
    return localTestingOverrideEnabled && isLocalAddress(req);
  },
});

module.exports = {
  authLimiter,
  generalLimiter,
};