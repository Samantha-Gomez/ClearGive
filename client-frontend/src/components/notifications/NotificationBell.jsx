import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { apiRequest } from '../../services/api'

function formatNotificationTime(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const now = new Date()
  const difference = now.getTime() - date.getTime()

  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (difference < minute) {
    return 'Just now'
  }

  if (difference < hour) {
    const minutes = Math.floor(difference / minute)
    return `${minutes}m ago`
  }

  if (difference < day) {
    const hours = Math.floor(difference / hour)
    return `${hours}h ago`
  }

  if (difference < 7 * day) {
    const days = Math.floor(difference / day)
    return `${days}d ago`
  }

  return date.toLocaleDateString()
}

function getNotificationPath(notification, role) {
  const resourceId = notification?.resourceId
  const resourceType = notification?.resourceType

  if (!resourceId) {
    return null
  }

  if (resourceType === 'drive') {
    if (role === 'donor') {
      return `/donor/drives/${resourceId}`
    }

    if (role === 'partner') {
      return `/partner/drives/${resourceId}`
    }

    if (role === 'admin') {
      return `/admin/drives/${resourceId}`
    }
  }

  if (resourceType === 'verification') {
    if (role === 'partner') {
      return '/partner/verification'
    }

    if (role === 'admin') {
      return '/admin/verifications'
    }
  }

  return null
}

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  const containerRef = useRef(null)

  const fetchNotifications = useCallback(
    async (showLoading = false) => {
      if (!user) return

      if (showLoading) {
        setLoading(true)
      }

      try {
        const data = await apiRequest('/notifications')

        setNotifications(data.notifications || [])
        setUnreadCount(Number(data.unreadCount || 0))
        setError('')
      } catch (requestError) {
        setError(
          requestError.message ||
            'Unable to load notifications.',
        )
      } finally {
        if (showLoading) {
          setLoading(false)
        }
      }
    },
    [user],
  )

  useEffect(() => {
    fetchNotifications(true)
  }, [fetchNotifications])

  useEffect(() => {
    if (!user) return

    const interval = window.setInterval(() => {
      fetchNotifications(false)
    }, 30000)

    return () => {
      window.clearInterval(interval)
    }
  }, [fetchNotifications, user])

  useEffect(() => {
    const handleWindowFocus = () => {
      fetchNotifications(false)
    }

    window.addEventListener(
      'focus',
      handleWindowFocus,
    )

    return () => {
      window.removeEventListener(
        'focus',
        handleWindowFocus,
      )
    }
  }, [fetchNotifications])

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      )
    }
  }, [])

  const markAsRead = async (notification) => {
    if (actionLoading) return

    try {
      setActionLoading(true)
      setError('')

      if (!notification.isRead) {
        await apiRequest(
          `/notifications/${notification._id}/read`,
          {
            method: 'PATCH',
          },
        )

        setNotifications((current) =>
          current.map((item) =>
            item._id === notification._id
              ? {
                  ...item,
                  isRead: true,
                  readAt: new Date().toISOString(),
                }
              : item,
          ),
        )

        setUnreadCount((current) =>
          Math.max(0, current - 1),
        )
      }

      const path = getNotificationPath(
        notification,
        user?.role,
      )

      setOpen(false)

      if (path) {
        navigate(path)
      }
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to update the notification.',
      )
    } finally {
      setActionLoading(false)
    }
  }

  const markAllAsRead = async () => {
    if (actionLoading || unreadCount === 0) return

    try {
      setActionLoading(true)
      setError('')

      await apiRequest('/notifications/read-all', {
        method: 'PATCH',
      })

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
          readAt:
            notification.readAt ||
            new Date().toISOString(),
        })),
      )

      setUnreadCount(0)
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to mark notifications as read.',
      )
    } finally {
      setActionLoading(false)
    }
  }

  const toggleNotifications = () => {
    setOpen((current) => !current)
  }

  return (
    <div
      className="notification-container"
      ref={containerRef}
    >
      <button
        type="button"
        className={
          open
            ? 'notification-bell-button active'
            : 'notification-bell-button'
        }
        onClick={toggleNotifications}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : 'Notifications'
        }
        aria-expanded={open}
        title="Notifications"
      >
        <Bell size={20} />

        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="notification-dropdown"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="notification-header">
            <div>
              <h2>Notifications</h2>
              <span>
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : 'All caught up'}
              </span>
            </div>

            <div className="notification-header-actions">
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notification-action-button"
                  onClick={markAllAsRead}
                  disabled={actionLoading}
                  title="Mark all as read"
                >
                  <CheckCheck size={17} />
                </button>
              )}

              <button
                type="button"
                className="notification-close-button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {error && (
            <div className="notification-error">
              {error}
            </div>
          )}

          <div className="notification-list">
            {loading ? (
              <div className="notification-empty">
                <Bell size={22} />
                <p>Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <Bell size={22} />
                <strong>No notifications yet</strong>
                <p>
                  New activity related to your account
                  will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  type="button"
                  className={
                    notification.isRead
                      ? 'notification-item read'
                      : 'notification-item unread'
                  }
                  key={notification._id}
                  onClick={() =>
                    markAsRead(notification)
                  }
                  disabled={actionLoading}
                >
                  <span className="notification-item-icon">
                    {notification.isRead ? (
                      <Check size={16} />
                    ) : (
                      <Bell size={16} />
                    )}
                  </span>

                  <span className="notification-item-content">
                    <span className="notification-item-top">
                      <strong>
                        {notification.title}
                      </strong>

                      {!notification.isRead && (
                        <span className="notification-unread-dot" />
                      )}
                    </span>

                    <span className="notification-message">
                      {notification.message}
                    </span>

                    <span className="notification-time">
                      {formatNotificationTime(
                        notification.createdAt,
                      )}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <span>
                Showing the latest{' '}
                {notifications.length} notification
                {notifications.length === 1
                  ? ''
                  : 's'}
              </span>

              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notification-mark-button"
                  onClick={markAllAsRead}
                  disabled={actionLoading}
                >
                  <Check size={15} />
                  Mark all read
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}