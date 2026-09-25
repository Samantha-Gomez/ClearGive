const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const protectedRoutes = require('./routes/protectedRoutes');
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

app.use(notFoundHandler);
app.use(errorHandler);

connectDB();

app.listen(PORT, () => {
  console.log(`ClearGive server running on http://localhost:${PORT}`);
});