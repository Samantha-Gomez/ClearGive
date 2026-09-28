import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  BarChart3,
  CheckCircle2,
  HeartHandshake,
  Package,
  RefreshCw,
  Truck,
  Users,
} from 'lucide-react'
import DashboardStat from '../../components/dashboard/DashboardStat'
import UnavailablePanel from '../../components/dashboard/UnavailablePanel'
import { apiRequest } from '../../services/api'

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

function formatMonth(value) {
  if (!value) return ''

  const date = new Date(`${value}-01T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })
}

function getBarHeight(value, maximum) {
  if (!maximum || !value) return '0%'

  return `${Math.max((value / maximum) * 100, 4)}%`
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchAnalytics = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      try {
        const data = await apiRequest('/analytics/admin')
        setAnalytics(data)
      } catch (requestError) {
        setError(
          requestError.message ||
            'Unable to load analytics.',
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [],
  )

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading) {
    return (
      <div className="page-state">
        Loading analytics...
      </div>
    )
  }

  if (!analytics) {
    return (
      <section className="dashboard-page">
        <div className="page-heading">
          <div>
            <p className="eyebrow">
              Administration
            </p>

            <h1>Analytics</h1>

            <p className="muted">
              Review donation and community
              assistance activity across
              ClearGive.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing ? 'spin' : ''
              }
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>

        {error && (
          <div
            className="form-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <UnavailablePanel>
          {error ||
            'Analytics data is not available yet.'}
        </UnavailablePanel>
      </section>
    )
  }

  const summary = analytics.summary || {}
  const monthlyActivity =
    analytics.monthlyActivity || []
  const driveBreakdown =
    analytics.driveBreakdown || []
  const categoryBreakdown =
    analytics.categoryBreakdown || {}
  const statusBreakdown =
    analytics.statusBreakdown || {}

  const monthlyMaximum = Math.max(
    ...monthlyActivity.map((item) =>
      Math.max(
        Number(item.donated || 0),
        Number(item.distributed || 0),
      ),
    ),
    0,
  )

  return (
    <section className="dashboard-page analytics-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            Administration
          </p>

          <h1>Analytics</h1>

          <p className="muted">
            Review donation and community
            assistance activity across
            ClearGive.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
        >
          <RefreshCw
            size={17}
            className={
              refreshing ? 'spin' : ''
            }
          />

          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      {error && (
        <div
          className="form-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="dashboard-stats analytics-stats">
        <DashboardStat
          label="Total drives"
          value={formatNumber(
            summary.totalDrives,
          )}
          icon={HeartHandshake}
        />

        <DashboardStat
          label="Active drives"
          value={formatNumber(
            summary.activeDrives,
          )}
          icon={Activity}
        />

        <DashboardStat
          label="Items donated"
          value={formatNumber(
            summary.totalDonated,
          )}
          icon={Package}
        />

        <DashboardStat
          label="Items distributed"
          value={formatNumber(
            summary.totalDistributed,
          )}
          icon={Truck}
        />

        <DashboardStat
          label="Beneficiaries assisted"
          value={formatNumber(
            summary.beneficiariesAssisted,
          )}
          icon={Users}
        />

        <DashboardStat
          label="Completed drives"
          value={formatNumber(
            summary.completedDrives,
          )}
          icon={CheckCircle2}
        />
      </div>

      <div className="analytics-grid">
        <div className="analytics-card analytics-monthly-card">
          <div className="analytics-card-heading">
            <div>
              <h2>Monthly activity</h2>

              <p>
                Donated and distributed
                items over time.
              </p>
            </div>

            <BarChart3 size={20} />
          </div>

          {monthlyActivity.length === 0 ? (
            <div className="analytics-empty">
              No monthly activity
              recorded yet.
            </div>
          ) : (
            <div className="monthly-chart">
              {monthlyActivity.map(
                (item) => (
                  <div
                    className="monthly-chart-column"
                    key={item.month}
                  >
                    <div className="monthly-chart-bars">
                      <div
                        className="chart-bar donated"
                        style={{
                          height:
                            getBarHeight(
                              Number(
                                item.donated ||
                                  0,
                              ),
                              monthlyMaximum,
                            ),
                        }}
                        title={`Donated: ${formatNumber(
                          item.donated,
                        )}`}
                      />

                      <div
                        className="chart-bar distributed"
                        style={{
                          height:
                            getBarHeight(
                              Number(
                                item.distributed ||
                                  0,
                              ),
                              monthlyMaximum,
                            ),
                        }}
                        title={`Distributed: ${formatNumber(
                          item.distributed,
                        )}`}
                      />
                    </div>

                    <span>
                      {formatMonth(
                        item.month,
                      )}
                    </span>
                  </div>
                ),
              )}
            </div>
          )}

          {monthlyActivity.length > 0 && (
            <div className="analytics-legend">
              <span>
                <i className="legend-dot donated" />
                Donated
              </span>

              <span>
                <i className="legend-dot distributed" />
                Distributed
              </span>
            </div>
          )}
        </div>

        <div className="analytics-card">
          <div className="analytics-card-heading">
            <div>
              <h2>Drive status</h2>

              <p>
                Current status of all
                donation drives.
              </p>
            </div>
          </div>

          <div className="analytics-breakdown">
            {Object.entries(
              statusBreakdown,
            ).map(
              ([status, count]) => (
                <div
                  className="analytics-breakdown-row"
                  key={status}
                >
                  <span>
                    {status
                      .charAt(0)
                      .toUpperCase() +
                      status.slice(1)}
                  </span>

                  <strong>
                    {formatNumber(count)}
                  </strong>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-heading">
            <div>
              <h2>Drive categories</h2>

              <p>
                Donation drives grouped
                by category.
              </p>
            </div>
          </div>

          <div className="analytics-breakdown">
            {Object.entries(
              categoryBreakdown,
            ).map(
              ([category, count]) => (
                <div
                  className="analytics-breakdown-row"
                  key={category}
                >
                  <span>{category}</span>

                  <strong>
                    {formatNumber(count)}
                  </strong>
                </div>
              ),
            )}

            {Object.keys(
              categoryBreakdown,
            ).length === 0 && (
              <div className="analytics-empty">
                No drive categories
                recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="analytics-card analytics-table-card">
        <div className="analytics-card-heading">
          <div>
            <h2>Drive performance</h2>

            <p>
              Donation and distribution
              activity by drive.
            </p>
          </div>
        </div>

        {driveBreakdown.length === 0 ? (
          <div className="analytics-empty">
            No donation drives
            recorded yet.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Drive</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Target</th>
                  <th>Donated</th>
                  <th>Received</th>
                  <th>Distributed</th>
                  <th>Beneficiaries</th>
                </tr>
              </thead>

              <tbody>
                {driveBreakdown.map(
                  (drive) => (
                    <tr
                      key={drive.id}
                    >
                      <td>
                        {drive.title}
                      </td>

                      <td>
                        {drive.category}
                      </td>

                      <td>
                        {drive.status}
                      </td>

                      <td>
                        {formatNumber(
                          drive.targetQuantity,
                        )}
                      </td>

                      <td>
                        {formatNumber(
                          drive.donated,
                        )}
                      </td>

                      <td>
                        {formatNumber(
                          drive.received,
                        )}
                      </td>

                      <td>
                        {formatNumber(
                          drive.distributed,
                        )}
                      </td>

                      <td>
                        {formatNumber(
                          drive.beneficiaries,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}