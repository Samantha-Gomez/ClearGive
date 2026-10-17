const nodemailer = require('nodemailer');

const OTP_EXPIRATION_MINUTES = 10;

const getSmtpConfiguration = () => {
  const host = process.env.EMAIL_HOST?.trim();
  const port = Number(process.env.EMAIL_PORT);
  const user = process.env.EMAIL_USER?.trim();
  const password = process.env.EMAIL_PASSWORD;
  const from = process.env.EMAIL_FROM?.trim();

  if (
    !host ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535 ||
    !user ||
    !password ||
    !from
  ) {
    return null;
  }

  return { host, port, user, password, from };
};

const isDevelopmentEmailLoggingEnabled = () =>
  process.env.NODE_ENV !== 'production' &&
  process.env.EMAIL_DEV_LOG === 'true';

const sendEmailWithResendApi = async ({ apiKey, to, subject, text, html }) => {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM?.trim(),
      to,
      subject,
      text,
      html,
    }),
    signal: AbortSignal.timeout(15000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message || `Resend API request failed with status ${response.status}.`,
    );
    error.code = 'RESEND_API_ERROR';
    error.responseCode = response.status;
    throw error;
  }

  return data;
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || !subject || (!text && !html)) {
    throw new Error('Email recipient, subject, and message content are required.');
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  if (resendApiKey) {
    try {
      return await sendEmailWithResendApi({
        apiKey: resendApiKey,
        to,
        subject,
        text,
        html,
      });
    } catch (error) {
      console.error('Resend API delivery failed.', {
        message: error.message,
        code: error.code,
        responseCode: error.responseCode,
      });
      throw new Error('Email delivery failed. Check Resend configuration.');
    }
  }

  const smtpConfiguration = getSmtpConfiguration();

  if (!smtpConfiguration) {
    if (isDevelopmentEmailLoggingEnabled()) {
      console.info(
        '[DEVELOPMENT ONLY] Email was not sent. Message preview follows:\n' +
          `To: ${to}\nSubject: ${subject}\n\n${text || html}`,
      );
      return { previewOnly: true };
    }

    throw new Error(
      'Email delivery is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM.',
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfiguration.host,
      port: smtpConfiguration.port,
      secure: smtpConfiguration.port === 465,
      requireTLS: smtpConfiguration.port !== 465,
      auth: {
        user: smtpConfiguration.user,
        pass: smtpConfiguration.password,
      },
    });

    return await transporter.sendMail({
      from: smtpConfiguration.from,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error('SMTP delivery failed.', {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
      response: error.response,
      command: error.command,
    });
    throw new Error('Email delivery failed. Check SMTP availability and configuration.');
  }
};

const sendEmailVerificationOtp = ({ to, otp }) => {
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    throw new Error('Email verification code must contain exactly 6 digits.');
  }

  const subject = 'Verify your email - ClearGive';
  const text = [
    'ClearGive',
    '',
    'Verify your email',
    '',
    `Your 6-digit verification code is: ${otp}`,
    '',
    `This code expires in ${OTP_EXPIRATION_MINUTES} minutes.`,
    'Do not share this code with anyone. ClearGive will never ask you to share it.',
  ].join('\n');
  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#202827">',
    '<p><strong>ClearGive</strong></p>',
    '<h1 style="font-size:22px">Verify your email</h1>',
    `<p>Your 6-digit verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p>`,
    `<p>This code expires in ${OTP_EXPIRATION_MINUTES} minutes.</p>`,
    '<p>Do not share this code with anyone. ClearGive will never ask you to share it.</p>',
    '</div>',
  ].join('');

  return sendEmail({ to, subject, text, html });
};

const sendPasswordResetOtp = ({ to, otp }) => {
  if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
    throw new Error('Password reset code must contain exactly 6 digits.')
  }

  const subject = 'Reset your password - ClearGive'

  const text = [
    'ClearGive',
    '',
    'Password reset request',
    '',
    `Your 6-digit password reset code is: ${otp}`,
    '',
    `This code expires in ${OTP_EXPIRATION_MINUTES} minutes.`,
    'If you did not request a password reset, you can ignore this email.',
    'Do not share this code with anyone.',
  ].join('\n')

  const html = [
    '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#202827">',
    '<p><strong>ClearGive</strong></p>',
    '<h1 style="font-size:22px">Reset your password</h1>',
    '<p>Your 6-digit password reset code is:</p>',
    `<p style="font-size:28px;font-weight:700;letter-spacing:4px">${otp}</p>`,
    `<p>This code expires in ${OTP_EXPIRATION_MINUTES} minutes.</p>`,
    '<p>If you did not request a password reset, you can ignore this email.</p>',
    '<p>Do not share this code with anyone.</p>',
    '</div>',
  ].join('')

  return sendEmail({
    to,
    subject,
    text,
    html,
  })
}

module.exports = {
  sendEmail,
  sendEmailVerificationOtp,
  sendPasswordResetOtp,
};
