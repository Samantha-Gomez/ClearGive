import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { apiRequest } from '../../services/api'

function formatDate(value) {
  if (!value) return '—'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return date.toLocaleString()
}

export default function AdminActivityPage() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')

  const fetchActivities = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true)
    }

    setError('')

    try {
      const data = await apiRequest('/activity/admin')
      setActivities(data.activities || [])
    } catch (err) {
      setError(err.message || 'Unable to load activity logs.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const sortedActivities = useMemo(() => {
    const sorted = [...activities]

    sorted.sort((a, b) => {
      const dateA = new Date(
        a.timestamp || a.createdAt || 0,
      ).getTime()

      const dateB = new Date(
        b.timestamp || b.createdAt || 0,
      ).getTime()

      return sortOrder === 'newest'
        ? dateB - dateA
        : dateA - dateB
    })

    return sorted
  }, [activities, sortOrder])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Administration</p>

          <h1>Activity Logs</h1>

          <p>
            Review recorded system activity for accountability and monitoring.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => fetchActivities(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={refreshing ? 'spin' : ''}
          />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="error-state" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="page-state">
          Loading activity logs...
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <h3>No activity logs yet</h3>

          <p>
            Recorded system activity will appear here.
          </p>
        </div>
      ) : (
        <div className="activity-log-card">
          <div className="activity-log-header">
            <div>
              <h2>System Activity</h2>

              <p>
                {activities.length} recorded activity
                {activities.length === 1 ? '' : 'ies'}
              </p>
            </div>

            <div className="activity-log-filter">
              <label htmlFor="activity-sort">
                Sort by
              </label>

              <select
                id="activity-sort"
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(event.target.value)
                }
              >
                <option value="newest">
                  Newest first
                </option>

                <option value="oldest">
                  Oldest first
                </option>
              </select>
            </div>
          </div>

          <div className="activity-log-scroll">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Resource</th>
                    <th>Details</th>
                    <th>Result</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedActivities.map((activity) => (
                    <tr key={activity._id}>
                      <td>{activity.action || '—'}</td>

                      <td>
                        {activity.user?.fullName ||
                          activity.user?.email ||
                          'System'}
                      </td>

                      <td>{activity.role || '—'}</td>

                      <td>
                        {activity.resourceType
                          ? `${activity.resourceType}${
                              activity.resourceId
                                ? ` (${activity.resourceId})`
                                : ''
                            }`
                          : '—'}
                      </td>

                      <td>
                        {activity.details || '—'}
                      </td>

                      <td>
                        {activity.result || 'success'}
                      </td>

                      <td>
                        {formatDate(
                          activity.timestamp ||
                            activity.createdAt,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}