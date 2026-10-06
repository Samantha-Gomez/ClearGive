const express = require('express');

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/notificationController');

const {
  authenticate,
  authorizeConfiguredAdmin,
} = require('../middleware/authMiddleware');

const router = express.Router();

const authorizeNotificationAccess = (req, res, next) => {
  if (req.user.role === 'admin') {
    return authorizeConfiguredAdmin(req, res, next);
  }

  next();
};

router.use(authenticate, authorizeNotificationAccess);

router.get(
  '/',
  getMyNotifications,
);

router.patch(
  '/read-all',
  markAllNotificationsAsRead,
);

router.patch(
  '/:id/read',
  markNotificationAsRead,
);

module.exports = router;