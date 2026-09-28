import { ArrowLeft, Home } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getDashboardPath } from '../routes/routeUtils'

export default function NotFoundPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const dashboardPath = user
    ? getDashboardPath(user.role)
    : '/'

  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-code">404</span>

        <p className="eyebrow">Page not found</p>

        <h1>We couldn't find that page.</h1>

        <p className="muted">
          The page you're looking for may have been moved,
          removed, or the address may be incorrect.
        </p>

        <div className="not-found-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={17} />
            Go Back
          </button>

          <Link
            className="primary-button"
            to={dashboardPath}
          >
            <Home size={17} />
            {user ? 'Dashboard' : 'Home'}
          </Link>
        </div>
      </div>
    </main>
  )
}
