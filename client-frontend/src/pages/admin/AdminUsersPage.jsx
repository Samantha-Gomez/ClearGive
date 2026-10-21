import { useCallback, useEffect, useState } from 'react'
import {
  LoaderCircle,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react'
import { apiRequest } from '../../services/api'
import Pagination from '../../components/Pagination'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [updatingId, setUpdatingId] = useState('')

  const loadUsers = useCallback(async (requestedPage = 1, isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setError('')

    const params = new URLSearchParams({
      page: String(requestedPage),
      limit: '20',
    })
    if (search.trim()) params.set('q', search.trim())
    if (role !== 'all') params.set('role', role)
    if (status !== 'all') params.set('status', status)

    try {
      const data = await apiRequest(`/admin/users?${params.toString()}`)
      setUsers(data.users || [])
      setPagination(data.pagination || null)
      setPage(requestedPage)
    } catch (requestError) {
      setError(requestError.message || 'Unable to load users.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [role, search, status])

  useEffect(() => {
    loadUsers(1)
  }, [loadUsers])

  const changeStatus = async (user) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active'
    setUpdatingId(user._id)
    setActionError('')

    try {
      await apiRequest(`/admin/users/${user._id}/status`, {
        method: 'PATCH',
        body: { status: nextStatus },
      })
      await loadUsers(page, true)
    } catch (requestError) {
      setActionError(requestError.message || 'Unable to update user status.')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <p className="eyebrow">Admin management</p>
          <h1>Users</h1>
          <p>Search accounts, review statuses, and manage access.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={() => loadUsers(page, true)}
          disabled={refreshing}
        >
          <RefreshCw size={17} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <section className="filter-card">
        <div className="filter-search">
          <Search size={18} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or organization..."
            aria-label="Search users"
          />
        </div>
        <div className="filter-row">
          <div className="form-group">
            <label htmlFor="user-role">Role</label>
            <select id="user-role" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="all">All roles</option>
              <option value="donor">Donors</option>
              <option value="partner">Partners</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="user-status">Status</label>
            <select id="user-status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </section>

      {(error || actionError) && (
        <div className="form-message form-message-error" role="alert">
          {error || actionError}
        </div>
      )}

      {loading ? (
        <div className="page-state"><LoaderCircle size={22} className="spin" /> Loading users...</div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <UserRound size={36} />
          <h2>No users found</h2>
          <p>There are no accounts matching the current filters.</p>
        </div>
      ) : (
        <section className="detail-card">
          <div className="section-heading">
            <div>
              <h2>User accounts</h2>
              <p>{pagination?.total || users.length} account{pagination?.total === 1 ? '' : 's'} found</p>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Verification</th>
                  <th>Created</th>
                  <th>Last login</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const anonymized = Boolean(user.anonymizedAt)
                  return (
                    <tr key={user._id}>
                      <td>
                        <strong>{user.fullName}</strong>
                        {user.organizationName && <small>{user.organizationName}</small>}
                      </td>
                      <td>{user.role}</td>
                      <td>
                        <span className={`status-badge status-${user.status}`}>
                          {anonymized ? 'anonymized' : user.status}
                        </span>
                      </td>
                      <td>{user.verificationStatus || (user.emailVerified ? 'verified' : 'unverified')}</td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td>{formatDate(user.lastLoginAt)}</td>
                      <td>
                        {anonymized ? (
                          <span className="muted">Not restorable</span>
                        ) : (
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => changeStatus(user)}
                            disabled={updatingId === user._id}
                          >
                            {updatingId === user._id
                              ? 'Updating...'
                              : user.status === 'active' ? 'Suspend' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <Pagination pagination={pagination} onPageChange={(nextPage) => loadUsers(nextPage)} />
    </div>
  )
}
