const Notification = require('../models/Notification');

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

  const validNotifications = notifications.filter(
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