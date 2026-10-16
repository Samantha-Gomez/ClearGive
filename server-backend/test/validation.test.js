const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateRegistration,
  validateLogin,
  validatePasswordReset,
  validateObjectId,
  validateAccountDeletion,
  validateAdminUserStatus,
} = require('../middleware/validation');

const validRegistration = () => ({
  fullName: 'Test Donor',
  email: 'donor@example.com',
  contactNumber: '09123456789',
  password: 'password123',
  confirmPassword: 'password123',
  role: 'donor',
  privacyConsent: true,
});

const runValidation = (body) => {
  const req = { body };
  const response = {};
  const res = {
    status(code) {
      response.status = code;
      return this;
    },
    json(payload) {
      response.payload = payload;
      return this;
    },
  };
  let nextCalled = false;

  validateRegistration(req, res, () => {
    nextCalled = true;
  });

  return { req, response, nextCalled };
};

const runMiddleware = (middleware, body, params = {}) => {
  const req = { body, params };
  const response = {};
  const res = {
    status(code) {
      response.status = code;
      return this;
    },
    json(payload) {
      response.payload = payload;
      return this;
    },
  };
  let nextCalled = false;
  middleware(req, res, () => {
    nextCalled = true;
  });
  return { response, nextCalled };
};

test('accepts a valid registration with privacy consent', () => {
  const result = runValidation(validRegistration());
  assert.equal(result.nextCalled, true);
  assert.equal(result.response.status, undefined);
  assert.equal(result.req.body.email, 'donor@example.com');
});

test('rejects registration without privacy consent', () => {
  const body = validRegistration();
  body.privacyConsent = false;
  const result = runValidation(body);

  assert.equal(result.nextCalled, false);
  assert.equal(result.response.status, 400);
  assert.match(result.response.payload.message, /Privacy Notice/);
});

test('rejects public admin registration', () => {
  const body = validRegistration();
  body.role = 'admin';
  const result = runValidation(body);

  assert.equal(result.nextCalled, false);
  assert.equal(result.response.status, 400);
});

test('validates login credentials', () => {
  const result = runMiddleware(validateLogin, {
    email: 'USER@EXAMPLE.COM',
    password: 'password123',
  });

  assert.equal(result.nextCalled, true);
});

test('rejects malformed password reset codes', () => {
  const result = runMiddleware(validatePasswordReset, {
    email: 'user@example.com',
    otp: '12345',
    password: 'password123',
    confirmPassword: 'password123',
  });

  assert.equal(result.nextCalled, false);
  assert.equal(result.response.status, 400);
});

test('validates MongoDB object IDs', () => {
  const valid = runMiddleware(
    validateObjectId,
    {},
    { id: '507f1f77bcf86cd799439011' },
  );
  const invalid = runMiddleware(
    validateObjectId,
    {},
    { id: 'not-an-object-id' },
  );

  assert.equal(valid.nextCalled, true);
  assert.equal(invalid.response.status, 400);
});

test('requires explicit confirmation to anonymize an account', () => {
  const invalid = runMiddleware(validateAccountDeletion, {
    currentPassword: 'password123',
    confirmation: 'DELETE',
  });
  const valid = runMiddleware(validateAccountDeletion, {
    currentPassword: 'password123',
    confirmation: 'DELETE MY ACCOUNT',
  });

  assert.equal(invalid.response.status, 400);
  assert.equal(valid.nextCalled, true);
});

test('only accepts active or suspended admin user statuses', () => {
  const valid = runMiddleware(validateAdminUserStatus, { status: 'suspended' });
  const invalid = runMiddleware(validateAdminUserStatus, { status: 'deleted' });

  assert.equal(valid.nextCalled, true);
  assert.equal(invalid.response.status, 400);
});
