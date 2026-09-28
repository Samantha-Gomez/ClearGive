import { useEffect, useState } from 'react'
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  FilePlus2,
  History,
  LoaderCircle,
  LogOut,
  Package,
  RefreshCw,
  Settings,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardStat from '../../components/dashboard/DashboardStat'
import UnavailablePanel from '../../components/dashboard/UnavailablePanel'
import { useAuth } from '../../context/useAuth'
import { ApiError, apiRequest } from '../../services/api'

function formatDate(value) {
  return value
    ? new Date(value).toLocaleDateString()
    : 'Date unavailable'
}

function buildActivity(
  drives,
  donations,
  distributions,
) {
  const driveTitles = new Map(
    drives.map((drive) => [
      String(drive.id || drive._id),
      drive.title,
    ]),
  )

  const donationItems = new Map(
    donations.map((donation) => [
      String(donation.id || donation._id),
      donation.item,
    ]),
  )

  const activity = [
    ...drives.map((drive) => ({
      date: drive.createdAt,
      title: 'Donation drive created',
      detail: drive.title,
    })),

    ...donations
      .filter((donation) => donation.receivedAt)
      .map((donation) => ({
        date: donation.receivedAt,
        title: 'Donation received',
        detail: `${
          donation.item
        } · ${
          driveTitles.get(
            String(
              donation.driveId?._id ||
                donation.driveId,
            ),
          ) || 'Donation drive'
        }`,
      })),

    ...distributions.map((distribution) => ({
      date: distribution.createdAt,
      title: 'Distribution recorded',
      detail: `${
        distribution.quantityDistributed
      } items · ${
        donationItems.get(
          String(
            distribution.donationId?._id ||
              distribution.donationId,
          ),
        ) || 'Donation'
      }`,
    })),
  ]

  return activity
    .filter((item) => item.date)
    .sort(
      (left, right) =>
        new Date(right.date) -
        new Date(left.date),
    )
    .slice(0, 8)
}

export default function PartnerDashboard() {
  const { logout } = useAuth()

  const [dashboard, setDashboard] = useState({
    verification: null,
    drives: [],
    donations: [],
    distributions: [],
  })

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const loadDashboard = async (
    isRefresh = false,
  ) => {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const [
        verificationResult,
        drivesResult,
      ] = await Promise.allSettled([
        apiRequest('/partner-verification/me'),
        apiRequest('/partner/drives'),
      ])

      const verification =
        verificationResult.status === 'fulfilled'
          ? verificationResult.value.verification
          : null

      const drives =
        drivesResult.status === 'fulfilled'
          ? drivesResult.value.drives || []
          : []

      const failedVerification =
        verificationResult.status === 'rejected'
          ? verificationResult.reason
          : null

      const failedDrives =
        drivesResult.status === 'rejected'
          ? drivesResult.reason
          : null

      if (
        failedVerification &&
        !(
          failedVerification instanceof ApiError &&
          failedVerification.status === 403
        )
      ) {
        throw failedVerification
      }

      if (
        failedDrives &&
        !(
          failedDrives instanceof ApiError &&
          failedDrives.status === 403
        )
      ) {
        throw failedDrives
      }

      const detailResults = await Promise.all(
        drives.map(async (drive) => {
          const driveId =
            drive.id || drive._id

          const [
            donationsResult,
            distributionsResult,
          ] = await Promise.allSettled([
            apiRequest(
              `/partner/drives/${driveId}/donations`,
            ),
            apiRequest(
              `/partner/drives/${driveId}/distributions`,
            ),
          ])

          return {
            donations:
              donationsResult.status ===
              'fulfilled'
                ? donationsResult.value
                    .donations || []
                : [],

            distributions:
              distributionsResult.status ===
              'fulfilled'
                ? distributionsResult.value
                    .distributions || []
                : [],
          }
        }),
      )

      setDashboard({
        verification,
        drives,
        donations: detailResults.flatMap(
          (detail) => detail.donations,
        ),
        distributions: detailResults.flatMap(
          (detail) =>
            detail.distributions,
        ),
      })
    } catch (requestError) {
      setError(
        requestError.message ||
          'Unable to load the partner dashboard.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    let active = true

    const loadInitialDashboard =
      async () => {
        if (!active) return

        await loadDashboard()
      }

    loadInitialDashboard()

    return () => {
      active = false
    }
  }, [])

  const {
    verification,
    drives,
    donations,
    distributions,
  } = dashboard

  const receivedDonations =
    donations.filter(
      (donation) =>
        donation.status === 'Received' ||
        donation.status === 'Distributed',
    ).length

  const itemsDistributed =
    distributions.reduce(
      (total, distribution) =>
        total +
        Number(
          distribution.quantityDistributed ||
            0,
        ),
      0,
    )

  const beneficiariesAssisted =
    distributions.reduce(
      (total, distribution) =>
        total +
        Number(
          distribution.beneficiariesAssisted ||
            0,
        ),
      0,
    )

  const activeDrives = drives.filter(
    (drive) =>
      drive.status === 'active',
  ).length

  const completedDrives = drives.filter(
    (drive) =>
      drive.status === 'completed',
  ).length

  const activity = buildActivity(
    drives,
    donations,
    distributions,
  )

  return (
    <section className="dashboard-page activity-dashboard">
      <div className="page-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Partner dashboard
            </p>

            <h1>
              Make support move forward.
            </h1>

            <p className="muted">
              See your organization&apos;s active
              work, incoming support, and reach.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => loadDashboard(true)}
            disabled={
              loading || refreshing
            }
          >
            <RefreshCw size={17} />

            {refreshing
              ? 'Refreshing...'
              : 'Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div
          className="form-error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              Partner activity
            </p>

            <h2>Activity overview</h2>
          </div>
        </div>

        {loading ? (
          <div className="page-state">
            <LoaderCircle
              size={22}
              className="spin"
            />

            Loading partner overview...
          </div>
        ) : (
          <>
            <div className="stats-grid partner-stats">
              <DashboardStat
                label="Verification status"
                value={
                  verification?.status ||
                  'Not submitted'
                }
                icon={ShieldCheck}
              />

              <DashboardStat
                label="Active drives"
                value={activeDrives}
                icon={Store}
              />

              <DashboardStat
                label="Completed drives"
                value={completedDrives}
                icon={CheckCircle2}
              />

              <DashboardStat
                label="Donations received"
                value={receivedDonations}
                icon={Package}
              />

              <DashboardStat
                label="Items distributed"
                value={itemsDistributed}
                icon={Activity}
              />

              <DashboardStat
                label="Beneficiaries assisted"
                value={
                  beneficiariesAssisted
                }
                icon={Users}
              />
            </div>

            {!error && (
              <p className="data-note">
                Counts are calculated from your
                partner drives and their available
                donation and distribution records.
              </p>
            )}
          </>
        )}
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              History
            </p>

            <h2>Recent activity</h2>
          </div>

          <Link
            className="text-link"
            to="/partner/drives"
          >
            View drives{' '}
            <ExternalLink size={15} />
          </Link>
        </div>

        {loading && (
          <div className="empty-state">
            <LoaderCircle
              size={25}
              className="spin"
            />

            <strong>
              Loading recent activity...
            </strong>
          </div>
        )}

        {!loading &&
          activity.length === 0 && (
            <UnavailablePanel>
              No donation, distribution, or drive
              activity is available yet.
            </UnavailablePanel>
          )}

        {!loading &&
          activity.length > 0 && (
            <div className="activity-list">
              {activity.map(
                (item, index) => (
                  <div
                    className="activity-row"
                    key={`${item.title}-${item.date}-${index}`}
                  >
                    <span className="activity-dot">
                      <History size={15} />
                    </span>

                    <div>
                      <strong>
                        {item.title}
                      </strong>

                      <span>
                        {item.detail}
                      </span>
                    </div>

                    <time>
                      {formatDate(item.date)}
                    </time>
                  </div>
                ),
              )}
            </div>
          )}
      </section>
    </section>
  )
}