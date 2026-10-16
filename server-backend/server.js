const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dns = require('dns');
require('dotenv').config();

// Use a reliable public resolver for MongoDB Atlas SRV records. Override this
// per machine with MONGO_DNS_SERVER when the network requires another resolver.
dns.setServers([process.env.MONGO_DNS_SERVER || '1.1.1.1']);

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const partnerVerificationRoutes = require('./routes/partnerVerificationRoutes');
const adminPartnerVerificationRoutes = require('./routes/adminPartnerVerificationRoutes');
const donationDriveRoutes = require('./routes/donationDriveRoutes');
const donationRoutes = require('./routes/donationRoutes');
const partnerDriveRoutes = require('./routes/partnerDriveRoutes');
const partnerReportRoutes = require('./routes/partnerReportRoutes');
const adminReportRoutes = require('./routes/adminReportRoutes');
const adminDriveRoutes = require('./routes/adminDriveRoutes');
const adminRoutes = require('./routes/adminRoutes');
const distributionRoutes = require('./routes/distributionRoutes');
const activityRoutes = require('./routes/activityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const locationRoutes = require('./routes/locationRoutes');
const { generalLimiter } = require('./middleware/rateLimiter');
const { mutationAudit } = require('./middleware/mutationAudit');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { expirePastDonationDrives } = require('./utils/expireDonationDrives');

const app = express();
const PORT = process.env.PORT || 5000;
const productionFrontendOrigin = 'https://clear-give-seven.vercel.app';
const allowedOrigins = new Set([
  productionFrontendOrigin,
  ...(process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:5173', 'http://127.0.0.1:5173']),
]);

app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      const error = new Error('Origin is not allowed by CORS.');
      error.statusCode = 403;
      return callback(error);
    },
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);
app.use(mutationAudit);

app.get('/', (req, res) => {
  res.json({
    message: 'ClearGive API is running.',
    version: 'backend-foundation',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend health check passed.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/partner-verification', partnerVerificationRoutes);
app.use('/api/admin/partner-verifications', adminPartnerVerificationRoutes);
app.use('/api/drives', donationDriveRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/drives', adminDriveRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/distributions', distributionRoutes);
app.use('/api/partner/drives', partnerDriveRoutes);
app.use('/api/partner/reports', partnerReportRoutes);
app.use('/api/admin/reports', adminReportRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/locations', locationRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();

    const expireInterval = setInterval(() => {
      expirePastDonationDrives().catch((error) => {
        console.error('Drive expiry check failed:', error.message);
      });
    }, 60 * 1000);
    expireInterval.unref();
    await expirePastDonationDrives();

    app.listen(PORT, () => {
      console.log(`ClearGive server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
