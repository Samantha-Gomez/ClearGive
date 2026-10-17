const test = require('node:test');
const assert = require('node:assert/strict');

const { sendEmail } = require('../services/emailService');

test('sends transactional email through the Brevo HTTPS API', async (t) => {
  const originalFetch = global.fetch;
  const originalEnvironment = {
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    BREVO_FROM_EMAIL: process.env.BREVO_FROM_EMAIL,
    BREVO_FROM_NAME: process.env.BREVO_FROM_NAME,
  };
  let request;

  t.after(() => {
    global.fetch = originalFetch;

    for (const [name, value] of Object.entries(originalEnvironment)) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  process.env.EMAIL_PROVIDER = 'brevo';
  process.env.BREVO_API_KEY = 'test-api-key';
  process.env.BREVO_FROM_EMAIL = 'verified-sender@example.com';
  process.env.BREVO_FROM_NAME = 'ClearGive';

  global.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      status: 201,
      json: async () => ({ messageId: 'test-message-id' }),
    };
  };

  const result = await sendEmail({
    to: 'recipient@example.com',
    subject: 'ClearGive verification code',
    text: 'Your code is 123456.',
    html: '<p>Your code is <strong>123456</strong>.</p>',
  });

  assert.equal(request.url, 'https://api.brevo.com/v3/smtp/email');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['api-key'], 'test-api-key');

  const payload = JSON.parse(request.options.body);
  assert.deepEqual(payload.sender, {
    name: 'ClearGive',
    email: 'verified-sender@example.com',
  });
  assert.deepEqual(payload.to, [{ email: 'recipient@example.com' }]);
  assert.equal(payload.subject, 'ClearGive verification code');
  assert.equal(payload.textContent, 'Your code is 123456.');
  assert.equal(
    payload.htmlContent,
    '<p>Your code is <strong>123456</strong>.</p>',
  );
  assert.deepEqual(result, { messageId: 'test-message-id' });
});
