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

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || !subject || (!text && !html)) {
    throw new Error('Email recipient, subject, and message content are required.');
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
  } catch {
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

module.exports = {
  sendEmail,
  sendEmailVerificationOtp,
  sendPasswordResetOtp,
};