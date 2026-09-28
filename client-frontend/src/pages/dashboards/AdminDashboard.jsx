import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  HeartHandshake,
  LoaderCircle,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardStat from '../../components/dashboard/DashboardStat'
import { apiRequest } from '../../services/api'

export default function AdminDashboard() {
  const [drives, setDrives] = useState([])
  const [donations, setDonations] = useState([])
  const [distributions, setDistributions] =
    useState([])

  const [userStats, setUserStats] =
    useState({
      totalDonors: 0,
      totalPartners: 0,
    })

  const [loading, setLoading] =
    useState(true)

  const [refreshing, setRefreshing] =
    useState(false)

  const [error, setError] =
    useState('')

  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      try {
        const [
          driveData,
          userData,
          donationData,
          distributionData,
        ] = await Promise.all([
          apiRequest('/admin/drives'),
          apiRequest('/admin/stats'),
          apiRequest('/donations/admin'),
          apiRequest('/distributions/admin'),
        ])

        setDrives(
          driveData.drives ||
            driveData ||
            [],
        )

        setUserStats(
          userData.stats || {
            totalDonors: 0,
            totalPartners: 0,
          },
        )

        setDonations(
          donationData.donations ||
            donationData ||
            [],
        )

        setDistributions(
          distributionData.distributions ||
            distributionData ||
            [],
        )
      } catch (err) {
        setError(
          err.message ||
            'Unable to load the admin dashboard.',
        )
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [],
  )

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const activeDrives = useMemo(
    () =>
      drives.filter(
        (drive) =>
          drive.status === 'active',
      ).length,
    [drives],
  )

  const completedDrives = useMemo(
    () =>
      drives.filter(
        (drive) =>
          drive.status === 'completed',
      ).length,
    [drives],
  )

  const totalDonated = useMemo(
    () =>
      donations.reduce(
        (sum, donation) =>
          sum +
          Number(
            donation.quantity || 0,
          ),
        0,
      ),
    [donations],
  )

  const totalDistributed = useMemo(
    () =>
      distributions.reduce(
        (sum, distribution) =>
          sum +
          Number(
            distribution.quantityDistributed ||
              0,
          ),
        0,
      ),
    [distributions],
  )

  const beneficiariesAssisted =
    useMemo(
      () =>
        distributions.reduce(
          (sum, distribution) =>
            sum +
            Number(
              distribution.beneficiariesAssisted ||
                0,
            ),
          0,
        ),
      [distributions],
    )

  return (
    <section className="dashboard-page activity-dashboard">
      <div className="page-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Admin dashboard
            </p>

            <h1>
              ClearGive overview.
            </h1>

            <p className="muted">
              Monitor community donation
              activity and manage the
              ClearGive system.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              loadDashboard(true)
            }
            disabled={refreshing}
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? 'spin'
                  : ''
              }
            />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="form-message form-message-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Overview
            </p>

            <h2>
              ClearGive activity
            </h2>
          </div>

          <Link
            className="text-link"
            to="/admin/analytics"
          >
            View analytics{' '}
            <ExternalLink size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="page-state">
            <LoaderCircle
              size={22}
              className="spin"
            />

            Loading admin overview...
          </div>
        ) : (
          <div className="stats-grid">
            <DashboardStat
              label="Registered donors"
              value={
                userStats.totalDonors
              }
              icon={Users}
            />

            <DashboardStat
              label="Registered partners"
              value={
                userStats.totalPartners
              }
              icon={Building2}
            />

            <DashboardStat
              label="Active drives"
              value={activeDrives}
              icon={ShoppingBag}
            />

            <DashboardStat
              label="Completed drives"
              value={
                completedDrives
              }
              icon={CheckCircle2}
            />

            <DashboardStat
              label="Items donated"
              value={totalDonated}
              icon={
                HeartHandshake
              }
            />

            <DashboardStat
              label="Items distributed"
              value={
                totalDistributed
              }
              icon={Truck}
            />

            <DashboardStat
              label="Beneficiaries assisted"
              value={
                beneficiariesAssisted
              }
              icon={Users}
            />
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Drives
            </p>

            <h2>
              Recent donation drives
            </h2>
          </div>

          <Link
            className="text-link"
            to="/admin/drives"
          >
            View all{' '}
            <ExternalLink size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="page-state">
            <LoaderCircle
              size={22}
              className="spin"
            />

            Loading drives...
          </div>
        ) : drives.length === 0 ? (
          <div className="empty-state">
            <Package size={32} />

            <h3>
              No donation drives
            </h3>

            <p>
              Donation drives created
              by approved partners
              will appear here.
            </p>
          </div>
        ) : (
          <div className="table-card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Drive</th>
                    <th>
                      Category
                    </th>
                    <th>
                      Location
                    </th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {drives
                    .slice(0, 5)
                    .map((drive) => (
                      <tr
                        key={
                          drive._id
                        }
                      >
                        <td>
                          {drive.title}
                        </td>

                        <td>
                          {drive.category}
                        </td>

                        <td>
                          {drive.location}
                        </td>

                        <td>
                          <span
                            className={`status-badge status-${String(
                              drive.status ||
                                'unknown',
                            ).toLowerCase()}`}
                          >
                            {drive.status ||
                              'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}