const test = require('node:test');
const assert = require('node:assert/strict');
const { authenticate } = require('../middleware/authMiddleware');

const runAuthenticate = (headers) => {
  const result = {};
  const req = { headers };
  const res = {
    status(code) {
      result.status = code;
      return this;
    },
    json(payload) {
      result.payload = payload;
      return this;
    },
  };

  let nextCalled = false;
  authenticate(req, res, () => {
    nextCalled = true;
  });

  return { result, nextCalled };
};

test('rejects requests without a session cookie', async () => {
  const { result, nextCalled } = await runAuthenticate({});

  assert.equal(nextCalled, false);
  assert.equal(result.status, 401);
  assert.equal(result.payload.message, 'Authentication required.');
});

test('rejects an empty session cookie', async () => {
  const { result, nextCalled } = await runAuthenticate({
    cookie: 'cleargive_session=; theme=light',
  });

  assert.equal(nextCalled, false);
  assert.equal(result.status, 401);
});
