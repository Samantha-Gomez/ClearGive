const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
const partnerVerificationRoutes = require('./routes/partnerVerificationRoutes');
const adminPartnerVerificationRoutes = require('./routes/adminPartnerVerificationRoutes');
const donationDriveRoutes = require('./routes/donationDriveRoutes');
const donationRoutes = require('./routes/donationRoutes');
const partnerDriveRoutes = require('./routes/partnerDriveRoutes');
const adminDriveRoutes = require('./routes/adminDriveRoutes');
const adminRoutes = require('./routes/adminRoutes');
const distributionRoutes = require('./routes/distributionRoutes');
const activityRoutes = require('./routes/activityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { generalLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(generalLimiter);

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
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

connectDB();

app.listen(PORT, () => {
  console.log(`ClearGive server running on http://localhost:${PORT}`);
});