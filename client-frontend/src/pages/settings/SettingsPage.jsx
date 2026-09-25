import { useEffect, useState } from 'react'
import { Building2, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react'
import UnavailablePanel from '../../components/dashboard/UnavailablePanel'
import { useAuth } from '../../context/useAuth'
import { ApiError, apiRequest } from '../../services/api'
import { roleLabels } from '../../routes/routeUtils'

function SettingRow({ label, value, icon: Icon, unavailable = false }) {
  return <div className={unavailable ? 'setting-row setting-unavailable' : 'setting-row'}><Icon size={17} /><div><span>{label}</span><strong>{value}</strong></div></div>
}

export default function SettingsPage({ role }) {
  const { user } = useAuth()
  const [verification, setVerification] = useState(null)
  const [loadingVerification, setLoadingVerification] = useState(role === 'partner')
  const [error, setError] = useState('')

  useEffect(() => {
    if (role !== 'partner') return
    let active = true
    async function loadVerification() {
      try {
        const data = await apiRequest('/partner-verification/me')
        if (active) setVerification(data.verification)
      } catch (requestError) {
        if (active && !(requestError instanceof ApiError && requestError.status === 404)) setError(requestError.message)
      } finally {
        if (active) setLoadingVerification(false)
      }
    }
    loadVerification()
    return () => { active = false }
  }, [role])

  const isPartner = role === 'partner'
  const displayContact = verification?.contactNumber || user.contactNumber
  const displayEmail = verification?.officialEmail || user.email

  return (
    <section className="dashboard-page settings-page">
      <div className="page-heading"><p className="eyebrow">Account area</p><h1>Settings</h1><p className="muted">Review the account information currently available to ClearGive.</p></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      <div className="settings-card">
        <div className="settings-card-heading"><span className="dashboard-icon"><UserRound size={22} /></span><div><h2>{isPartner ? 'Partner account' : `${roleLabels[role]} account`}</h2><p className="muted">Account details are read-only for now.</p></div></div>
        <div className="settings-grid">
          <SettingRow label="Full name" value={user.fullName || 'Not available'} icon={UserRound} />
          <SettingRow label="Email" value={displayEmail || 'Not available'} icon={Mail} />
          <SettingRow label="Contact number" value={displayContact || 'Not available from the current account response'} icon={Phone} unavailable={!displayContact} />
          <SettingRow label="Role" value={roleLabels[role]} icon={ShieldCheck} />
          {isPartner && <>
            <SettingRow label="Organization" value={verification?.organizationName || 'Not submitted'} icon={Building2} unavailable={!verification?.organizationName} />
            <SettingRow label="Verification status" value={loadingVerification ? 'Loading...' : verification?.status || 'Not submitted'} icon={ShieldCheck} />
          </>}
        </div>
      </div>
      {!isPartner && <UnavailablePanel>Profile editing is not available because the backend currently provides no safe account update endpoint.</UnavailablePanel>}
      {isPartner && !verification && !loadingVerification && <UnavailablePanel>Organization and official contact details will appear here after a verification submission is available.</UnavailablePanel>}
    </section>
  )
}