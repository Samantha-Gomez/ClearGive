import { useEffect, useState } from 'react'
import {
  Building2,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import UnavailablePanel from '../../components/dashboard/UnavailablePanel'
import { useAuth } from '../../context/useAuth'
import { ApiError, apiRequest } from '../../services/api'
import { roleLabels } from '../../routes/routeUtils'

function SettingRow({
  label,
  value,
  icon: Icon,
  unavailable = false,
}) {
  return (
    <div
      className={
        unavailable
          ? 'setting-row setting-unavailable'
          : 'setting-row'
      }
    >
      <Icon size={17} />

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}

export default function SettingsPage({ role }) {
  const { user, logout } = useAuth()

  const [verification, setVerification] = useState(null)
  const [loadingVerification, setLoadingVerification] =
    useState(role === 'partner')
  const [error, setError] = useState('')
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [deleteForm, setDeleteForm] = useState({ currentPassword: '', confirmation: '' })
  const [deleteError, setDeleteError] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)

  useEffect(() => {
    if (role !== 'partner') return

    let active = true

    async function loadVerification() {
      try {
        const data = await apiRequest(
          '/partner-verification/me',
        )

        if (active) {
          setVerification(data.verification)
        }
      } catch (requestError) {
        if (
          active &&
          !(
            requestError instanceof ApiError &&
            requestError.status === 404
          )
        ) {
          setError(requestError.message)
        }
      } finally {
        if (active) {
          setLoadingVerification(false)
        }
      }
    }

    loadVerification()

    return () => {
      active = false
    }
  }, [role])

  const isPartner = role === 'partner'

  const changePassword = async (event) => {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    setChangingPassword(true)
    try {
      const data = await apiRequest('/auth/change-password', { method: 'PATCH', body: passwordForm })
      setPasswordMessage(data.message)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (requestError) { setPasswordError(requestError.message) }
    finally { setChangingPassword(false) }
  }

  const displayContact =
    user.contactNumber || verification?.contactNumber

  const displayEmail =
    verification?.officialEmail ||
    user.email

  const anonymizeAccount = async (event) => {
    event.preventDefault()
    setDeleteError('')
    setDeletingAccount(true)

    try {
      await apiRequest('/auth/me', {
        method: 'DELETE',
        body: deleteForm,
      })
      logout()
    } catch (requestError) {
      setDeleteError(requestError.message)
    } finally {
      setDeletingAccount(false)
    }
  }

  return (
    <section className="dashboard-page settings-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Account area</p>

          <h1>Settings</h1>

          <p className="muted">
            Review your account information registered
            to ClearGive.
          </p>
        </div>
      </div>

      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}

      <div className="settings-card">
        <div className="settings-card-heading">
          <span className="dashboard-icon">
            <UserRound size={22} />
          </span>

          <div>
            <h2>
              {isPartner
                ? 'Partner account'
                : `${roleLabels[role]} account`}
            </h2>

            <p className="muted">
              Account details are read-only for now.
            </p>
          </div>
        </div>

        <div className="settings-grid">
          <SettingRow
            label="Full name"
            value={user.fullName || 'Not available'}
            icon={UserRound}
          />

          <SettingRow
            label="Email"
            value={displayEmail || 'Not available'}
            icon={Mail}
          />

          <SettingRow
            label="Contact number"
            value={
              displayContact ||
              'Not available from the current account response'
            }
            icon={Phone}
            unavailable={!displayContact}
          />

          <SettingRow
            label="Role"
            value={roleLabels[role]}
            icon={ShieldCheck}
          />

          {isPartner && (
            <>
              <SettingRow
                label="Organization"
                value={
                  verification?.organizationName ||
                  'Not submitted'
                }
                icon={Building2}
                unavailable={
                  !verification?.organizationName
                }
              />

              <SettingRow
                label="Verification status"
                value={
                  loadingVerification
                    ? 'Loading...'
                    : verification?.status ||
                      'Not submitted'
                }
                icon={ShieldCheck}
              />
            </>
          )}
        </div>
      </div>

      <div className="settings-card password-settings-card">
        <div className="settings-card-heading">
          <span className="dashboard-icon"><ShieldCheck size={22} /></span>
          <div><h2>Change password</h2><p className="muted">Update your password securely from Settings.</p></div>
        </div>
        <form className="settings-password-form" onSubmit={changePassword}>
          <input aria-label="Current password" type="password" placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
          <input aria-label="New password" type="password" placeholder="New password (8+ characters)" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} minLength={8} required />
          <input aria-label="Confirm new password" type="password" placeholder="Confirm new password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} minLength={8} required />
          <button className="primary-button" type="submit" disabled={changingPassword}>{changingPassword ? 'Updating...' : 'Update password'}</button>
        </form>
        {passwordError && <div className="form-error" role="alert">{passwordError}</div>}
        {passwordMessage && <div className="form-success" role="status">{passwordMessage}</div>}
      </div>

      <div className="settings-card account-danger-card">
        <div className="settings-card-heading">
          <span className="dashboard-icon"><ShieldCheck size={22} /></span>
          <div>
            <h2>Close account</h2>
            <p className="muted">
              Your personal information will be anonymized. Donation and audit records will be retained without your identity.
            </p>
          </div>
        </div>
        <form className="settings-password-form" onSubmit={anonymizeAccount}>
          <input
            aria-label="Current password for account closure"
            type="password"
            placeholder="Current password"
            value={deleteForm.currentPassword}
            onChange={(event) => setDeleteForm({ ...deleteForm, currentPassword: event.target.value })}
            required
          />
          <input
            aria-label="Account closure confirmation"
            type="text"
            placeholder="Type DELETE MY ACCOUNT"
            value={deleteForm.confirmation}
            onChange={(event) => setDeleteForm({ ...deleteForm, confirmation: event.target.value })}
            required
          />
          <button className="danger-button" type="submit" disabled={deletingAccount}>
            {deletingAccount ? 'Closing account...' : 'Anonymize and close account'}
          </button>
        </form>
        {deleteError && <div className="form-error" role="alert">{deleteError}</div>}
      </div>

      

      {isPartner &&
        !verification &&
        !loadingVerification && (
          <UnavailablePanel>
            Organization and official contact details will
            appear here after a verification submission is
            available.
          </UnavailablePanel>
        )}
    </section>
  )
}
