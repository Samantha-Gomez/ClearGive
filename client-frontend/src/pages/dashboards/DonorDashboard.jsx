import { useEffect, useMemo, useState } from 'react'
import {
  ExternalLink,
  LoaderCircle,
  Package,
  RefreshCw,
  ShoppingBag,
  Truck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardStat from '../../components/dashboard/DashboardStat'
import { apiRequest } from '../../services/api'

export default function DonorDashboard() {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDonations = async () => {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest('/donations/my')

      setDonations(data.donations || [])
    } catch (err) {
      setError(
        err.message ||
          'Unable to load your donation information.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const fetchDonations = async () => {
      try {
        const data = await apiRequest('/donations/my')

        if (!cancelled) {
          setDonations(data.donations || [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              'Unable to load your donation information.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchDonations()

    return () => {
      cancelled = true
    }
  }, [])

  const totalItems = useMemo(
    () =>
      donations.reduce(
        (total, donation) =>
          total +
          Number(donation.quantity || 0),
        0,
      ),
    [donations],
  )

  const receivedItems = useMemo(
    () =>
      donations
        .filter((donation) =>
          ['Received', 'Distributed'].includes(
            donation.status,
          ),
        )
        .reduce(
          (total, donation) =>
            total +
            Number(donation.quantity || 0),
          0,
        ),
    [donations],
  )

  const distributedItems = useMemo(
    () =>
      donations
        .filter(
          (donation) =>
            donation.status === 'Distributed',
        )
        .reduce(
          (total, donation) =>
            total +
            Number(donation.quantity || 0),
          0,
        ),
    [donations],
  )

  const recentDonations = donations.slice(0, 5)

  return (
    <section className="dashboard-page activity-dashboard">
      <div className="page-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Donor dashboard
            </p>

            <h1>Support that stays visible.</h1>

            <p className="muted">
              Track your contributions and find the next
              community need to support.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={loadDonations}
            disabled={loading}
          >
            <RefreshCw size={17} />

            {loading
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>
      </div>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Overview
            </p>

            <h2>Donation overview</h2>
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

        {loading ? (
          <div className="page-state">
            <LoaderCircle
              size={22}
              className="spin"
            />

            Loading donation overview...
          </div>
        ) : (
          <div className="stats-grid">
            <DashboardStat
              label="Total donations"
              value={donations.length}
              icon={ShoppingBag}
            />

            <DashboardStat
              label="Total items donated"
              value={totalItems}
              icon={Package}
            />

            <DashboardStat
              label="Items received"
              value={receivedItems}
              icon={Truck}
            />

            <DashboardStat
              label="Items distributed"
              value={distributedItems}
              icon={Truck}
            />
          </div>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              History
            </p>

            <h2>Recent donations</h2>
          </div>

          <Link
            className="text-link"
            to="/donor/history"
          >
            View history <ExternalLink size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="page-state">
            <LoaderCircle
              size={22}
              className="spin"
            />

            Loading recent donations...
          </div>
        ) : recentDonations.length === 0 ? (
          <div className="empty-state">
            <Package size={32} />

            <h3>No donations yet</h3>

            <p>
              Your recent donations will appear here
              after you record your first donation.
            </p>

            <Link
              className="primary-button"
              to="/donor/drives"
            >
              Browse Donation Drives
            </Link>
          </div>
        ) : (
          <div className="table-card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Drive</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {recentDonations.map(
                    (donation) => (
                      <tr key={donation._id}>
                        <td>
                          {donation.driveId?._id ? (
                            <Link
                              className="table-link"
                              to={`/donor/drives/${donation.driveId._id}`}
                            >
                              {donation.driveId.title ||
                                'Donation Drive'}
                            </Link>
                          ) : (
                            'Donation Drive'
                          )}
                        </td>

                        <td>
                          {donation.item}
                        </td>

                        <td>
                          {donation.quantity}
                        </td>

                        <td>
                          <span
                            className={`status-badge status-${String(
                              donation.status ||
                                'recorded',
                            ).toLowerCase()}`}
                          >
                            {donation.status ||
                              'Recorded'}
                          </span>
                        </td>

                        <td>
                          {donation.createdAt
                            ? new Date(
                                donation.createdAt,
                              ).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </section>
  )
}