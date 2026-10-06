const Notification = require('../models/Notification');
const User = require('../models/User');

const findConfiguredAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();

  if (!email) return null;

  const admins = await User.find({
    role: 'admin',
    status: 'active',
  }).select('_id email');

  return admins.find(
    (admin) =>
      typeof admin.email === 'string' &&
      admin.email.trim().toLowerCase() === email,
  ) || null;
};

const createNotification = async ({
  recipient,
  role,
  type,
  title,
  message,
  resourceType = '',
  resourceId = '',
}) => {
  try {
    if (!recipient || !role || !type || !title || !message) {
      return null;
    }

    if (role === 'admin') {
      const configuredAdmin = await findConfiguredAdmin();

      if (
        !configuredAdmin ||
        String(recipient) !== String(configuredAdmin._id)
      ) {
        return null;
      }
    }

    const notification = await Notification.create({
      recipient,
      role,
      type,
      title,
      message,
      resourceType,
      resourceId,
    });

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

const createNotifications = async (notifications = []) => {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  let validNotifications = notifications.filter(
    (notification) =>
      notification?.recipient &&
      notification?.role &&
      notification?.type &&
      notification?.title &&
      notification?.message,
  );

  if (validNotifications.length === 0) {
    return [];
  }

  try {
    if (
      validNotifications.some(
        (notification) => notification.role === 'admin',
      )
    ) {
      const configuredAdmin = await findConfiguredAdmin();
      const configuredAdminId = configuredAdmin
        ? String(configuredAdmin._id)
        : null;

      validNotifications = validNotifications.filter(
        (notification) =>
          notification.role !== 'admin' ||
          (configuredAdminId &&
            String(notification.recipient) === configuredAdminId),
      );
    }

    if (validNotifications.length === 0) {
      return [];
    }

    return await Notification.insertMany(validNotifications);
  } catch (error) {
    console.error('Create notifications error:', error);
    return [];
  }
};

module.exports = {
  createNotification,
  createNotifications,
};