const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateDonationDriveCreation,
  validateDonationCreation,
  validateDistributionCreation,
  validateAdminUserStatus,
} = require('../middleware/validation');

const runMiddleware = (middleware, body) => {
  const response = {};
  const req = { body: { ...body } };
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

  return { req, response, nextCalled };
};

const validDrive = {
  title: 'Community Food Drive',
  description: 'Food support for local families.',
  category: 'Food',
  targetQuantity: 100,
  eventDate: '2030-12-30',
  deadline: '2030-12-31',
  location: 'Dagupan City',
  province: 'Pangasinan',
  cityMunicipality: 'Dagupan City',
  barangay: 'Poblacion',
  venue: 'Community Hall',
  requestedItems: [{ name: 'Rice' }],
};

test('accepts a valid donation drive', () => {
  const result = runMiddleware(validateDonationDriveCreation, validDrive);
  assert.equal(result.nextCalled, true);
  assert.equal(result.response.status, undefined);
});

test('rejects a donation drive with an invalid target', () => {
  const result = runMiddleware(validateDonationDriveCreation, {
    ...validDrive,
    targetQuantity: 0,
  });
  assert.equal(result.nextCalled, false);
  assert.equal(result.response.status, 400);
});

test('accepts a valid donation record', () => {
  const result = runMiddleware(validateDonationCreation, {
    donorId: '507f1f77bcf86cd799439011',
    item: 'Rice',
    quantity: 10,
  });
  assert.equal(result.nextCalled, true);
});

test('rejects protected donation fields', () => {
  const result = runMiddleware(validateDonationCreation, {
    donorId: '507f1f77bcf86cd799439011',
    item: 'Rice',
    quantity: 10,
    status: 'Distributed',
  });
  assert.equal(result.nextCalled, false);
  assert.equal(result.response.status, 400);
});

test('accepts a valid distribution record', () => {
  const result = runMiddleware(validateDistributionCreation, {
    donationId: '507f1f77bcf86cd799439011',
    quantityDistributed: 5,
    beneficiariesAssisted: 2,
  });
  assert.equal(result.nextCalled, true);
});

test('rejects a distribution with invalid quantities', () => {
  const result = runMiddleware(validateDistributionCreation, {
    donationId: '507f1f77bcf86cd799439011',
    quantityDistributed: 0,
    beneficiariesAssisted: 2,
  });
  assert.equal(result.nextCalled, false);
  assert.equal(result.response.status, 400);
});

test('admin status validation accepts suspend and restore states', () => {
  assert.equal(runMiddleware(validateAdminUserStatus, { status: 'suspended' }).nextCalled, true);
  assert.equal(runMiddleware(validateAdminUserStatus, { status: 'active' }).nextCalled, true);
});

test('admin status validation rejects unknown states', () => {
  const result = runMiddleware(validateAdminUserStatus, { status: 'deleted' });
  assert.equal(result.nextCalled, false);
  assert.equal(result.response.status, 400);
});
