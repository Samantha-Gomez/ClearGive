const rateLimit = require('express-rate-limit');

const localTestingOverrideEnabled = process.env.ALLOW_LOCAL_RATE_LIMIT_TESTING === 'true';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: false,
  skip: (req) => {
    // This override is intentionally opt-in and limited to localhost development testing.
    // Production keeps the protection enabled by default.
    if (!localTestingOverrideEnabled) {
      return false;
    }

    const localAddresses = ['::1', '127.0.0.1', '::ffff:127.0.0.1'];
    return localAddresses.includes(req.ip);
  },
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many requests from this IP. Please try again later.',
  },
});

module.exports = {
  authLimiter,
  generalLimiter,
};
