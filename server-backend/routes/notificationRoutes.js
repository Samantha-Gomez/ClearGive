const express = require('express');

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require('../controllers/notificationController');

const {
  authenticate,
} = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

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