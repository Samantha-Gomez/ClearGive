import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { apiRequest } from '../../services/api'
import Pagination from '../../components/Pagination'

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
  const [pagination, setPagination] = useState(null)

  const fetchActivities = useCallback(async (isRefresh = false, requestedPage = 1) => {
    if (isRefresh) {
      setRefreshing(true)
    }

    setError('')

    try {
      const data = await apiRequest(`/activity/admin?page=${requestedPage}&limit=20`)
      setActivities(data.activities || [])
      setPagination(data.pagination || null)
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

  const exportActivities = () => {
    const headers = ['Action', 'User', 'Role', 'Resource', 'Details', 'Result', 'Date']
    const rows = sortedActivities.map((activity) => [
      activity.action || '', activity.user?.fullName || activity.user?.email || 'System',
      activity.role || '', activity.resourceType || '', activity.details || '',
      activity.result || 'success', formatDate(activity.timestamp || activity.createdAt),
    ])
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `cleargive-activity-logs-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

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
        <button type="button" className="primary-button" onClick={exportActivities} disabled={!activities.length}>
          Export CSV
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
      <Pagination
        pagination={pagination}
        onPageChange={(nextPage) => fetchActivities(false, nextPage)}
      />
    </div>
  )
}
