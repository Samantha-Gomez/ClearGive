import { useCallback, useEffect, useState } from 'react'
import {
  Activity,
  BarChart3,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Package,
  RefreshCw,
  Truck,
  Users,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import DashboardStat from '../../components/dashboard/DashboardStat'
import UnavailablePanel from '../../components/dashboard/UnavailablePanel'
import { apiRequest } from '../../services/api'

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

function formatDecimal(value) {
  return Number(value || 0).toLocaleString(
    undefined,
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    },
  )
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

function getFulfillmentPercentage(target, distributed) {
  const targetValue = Number(target || 0)
  const distributedValue = Number(distributed || 0)

  if (!targetValue) return 0

  return Math.min(
    Math.round(
      (distributedValue / targetValue) * 100,
    ),
    100,
  )
}

function formatStatus(value) {
  if (!value) return ''

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  )
}

const STATUS_COLORS = [
  '#2f8f58',
  '#e0a43a',
  '#6b7c73',
  '#b64d49',
]

const CHART_GREEN = '#2f8f58'
const CHART_DARK_GREEN = '#247044'
const CHART_GRID = '#dfe9e2'
const CHART_TEXT = '#68766e'

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

  /*
   * Prepare monthly chart data.
   */
  const monthlyChartData = monthlyActivity.map(
    (item) => ({
      month: formatMonth(item.month),
      recorded: Number(item.donated || 0),
      distributed: Number(
        item.distributed || 0,
      ),
    }),
  )

  /*
   * Prepare drive status chart data.
   */
  const statusChartData = Object.entries(
    statusBreakdown,
  ).map(([status, count]) => ({
    name: formatStatus(status),
    value: Number(count || 0),
  }))

  /*
   * Prepare category chart data.
   */
  const categoryChartData = Object.entries(
    categoryBreakdown,
  ).map(([category, count]) => ({
    name: category,
    drives: Number(count || 0),
  }))

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

      {/* SUMMARY NUMBERS */}

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
          label="Items recorded"
          value={formatNumber(
            summary.totalDonated,
          )}
          icon={Package}
        />

        <DashboardStat
          label="Items received"
          value={formatNumber(
            summary.totalReceived,
          )}
          icon={CheckCircle2}
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
          label="Avg. distribution delay"
          value={`${formatDecimal(
            summary.averageDistributionDelay,
          )} days`}
          icon={Clock3}
        />

        <DashboardStat
          label="Completed drives"
          value={formatNumber(
            summary.completedDrives,
          )}
          icon={CheckCircle2}
        />
      </div>

      {/* CHARTS */}

      <div className="analytics-grid">
        {/* MONTHLY ACTIVITY */}

        <div className="analytics-card analytics-chart-card analytics-monthly-card">
          <div className="analytics-card-heading">
            <div>
              <h2>Monthly donation activity</h2>

              <p>
                Recorded and distributed
                items over time.
              </p>
            </div>

            <BarChart3 size={20} />
          </div>

          {monthlyChartData.length === 0 ? (
            <div className="analytics-empty">
              No monthly activity
              recorded yet.
            </div>
          ) : (
            <div className="analytics-chart">
              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <LineChart
                  data={monthlyChartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -15,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid
                    stroke={CHART_GRID}
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    tick={{
                      fill: CHART_TEXT,
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: CHART_TEXT,
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatNumber(value)
                    }
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background:
                        'var(--surface)',
                      color: 'var(--ink)',
                      boxShadow:
                        'var(--shadow-sm)',
                    }}
                  />

                  <Legend />

                  <Line
                    type="monotone"
                    dataKey="recorded"
                    name="Recorded"
                    stroke={CHART_GREEN}
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: CHART_GREEN,
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="distributed"
                    name="Distributed"
                    stroke={CHART_DARK_GREEN}
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: CHART_DARK_GREEN,
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* DISTRIBUTION DELAY */}

        <div className="analytics-card">
          <div className="analytics-card-heading">
            <div>
              <h2>Distribution delay</h2>

              <p>
                Time between receiving and
                distributing donations.
              </p>
            </div>

            <Clock3 size={20} />
          </div>

          <div className="analytics-breakdown">
            <div className="analytics-breakdown-row">
              <span>
                Average delay
              </span>

              <strong>
                {formatDecimal(
                  summary.averageDistributionDelay,
                )}{' '}
                days
              </strong>
            </div>

            <div className="analytics-breakdown-row">
              <span>
                Longest delay
              </span>

              <strong>
                {formatDecimal(
                  summary.longestDistributionDelay,
                )}{' '}
                days
              </strong>
            </div>

            <div className="analytics-breakdown-row">
              <span>
                Completed donations
              </span>

              <strong>
                {formatNumber(
                  summary.completedDonations,
                )}
              </strong>
            </div>
          </div>
        </div>

        {/* DRIVE STATUS PIE CHART */}

        <div className="analytics-card analytics-chart-card">
          <div className="analytics-card-heading">
            <div>
              <h2>Drive status</h2>

              <p>
                Current status of all
                donation drives.
              </p>
            </div>
          </div>

          {statusChartData.length === 0 ? (
            <div className="analytics-empty">
              No drive status data
              recorded yet.
            </div>
          ) : (
            <div className="analytics-pie-chart">
              <ResponsiveContainer
                width="100%"
                height={280}
              >
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {statusChartData.map(
                      (entry, index) => (
                        <Cell
                          key={`status-${entry.name}`}
                          fill={
                            STATUS_COLORS[
                              index %
                                STATUS_COLORS.length
                            ]
                          }
                        />
                      ),
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatNumber(value)
                    }
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background:
                        'var(--surface)',
                      color: 'var(--ink)',
                      boxShadow:
                        'var(--shadow-sm)',
                    }}
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* DRIVE CATEGORY BAR CHART */}

        <div className="analytics-card analytics-chart-card">
          <div className="analytics-card-heading">
            <div>
              <h2>Drive categories</h2>

              <p>
                Donation drives grouped
                by category.
              </p>
            </div>
          </div>

          {categoryChartData.length === 0 ? (
            <div className="analytics-empty">
              No drive categories
              recorded yet.
            </div>
          ) : (
            <div className="analytics-chart">
              <ResponsiveContainer
                width="100%"
                height={300}
              >
                <BarChart
                  data={categoryChartData}
                  margin={{
                    top: 10,
                    right: 10,
                    left: -15,
                    bottom: 45,
                  }}
                >
                  <CartesianGrid
                    stroke={CHART_GRID}
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fill: CHART_TEXT,
                      fontSize: 11,
                    }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                    axisLine={false}
                    tickLine={false}
                  />

                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fill: CHART_TEXT,
                      fontSize: 12,
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) =>
                      formatNumber(value)
                    }
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid var(--line)',
                      background:
                        'var(--surface)',
                      color: 'var(--ink)',
                      boxShadow:
                        'var(--shadow-sm)',
                    }}
                  />

                  <Bar
                    dataKey="drives"
                    name="Drives"
                    fill={CHART_GREEN}
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* DRIVE PERFORMANCE */}

      <div className="analytics-card analytics-table-card">
        <div className="analytics-card-heading">
          <div>
            <h2>Drive performance</h2>

            <p>
              Donation, receipt, and
              distribution activity by drive.
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
                  <th>Recorded</th>
                  <th>Received</th>
                  <th>Distributed</th>
                  <th>Fulfillment</th>
                  <th>Beneficiaries</th>
                </tr>
              </thead>

              <tbody>
                {driveBreakdown.map(
                  (drive) => {
                    const fulfillment =
                      getFulfillmentPercentage(
                        drive.targetQuantity,
                        drive.distributed,
                      )

                    return (
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
                          {fulfillment}%
                        </td>

                        <td>
                          {formatNumber(
                            drive.beneficiaries,
                          )}
                        </td>
                      </tr>
                    )
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}