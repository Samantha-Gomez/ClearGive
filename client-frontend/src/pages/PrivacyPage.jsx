import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  return (
    <main className="auth-page">
      <section className="auth-card privacy-card">
        <p className="eyebrow">ClearGive privacy</p>
        <h1>Privacy Notice</h1>
        <p className="muted">
          ClearGive collects only the information needed to manage donation drives,
          verify partner organizations, record donations, and communicate updates.
        </p>

        <h2>Information we collect</h2>
        <p>
          This may include your name, email address, contact number, account role,
          organization details, donation records, distribution records, and activity
          needed to protect the system.
        </p>

        <h2>How we use information</h2>
        <p>
          We use this information to authenticate accounts, operate donation drives,
          notify relevant users, verify partner organizations, provide reports, and
          maintain accountability and security.
        </p>

        <h2>Access and retention</h2>
        <p>
          Access is limited by account role. Records may be retained for operational,
          audit, and reporting purposes. You may contact the system administrator to
          request access, correction, or deletion of personal information, subject to
          records that must be retained for accountability.
        </p>

        <h2>Your choice</h2>
        <p>
          Registration requires your agreement to this notice. You can stop using the
          service and request assistance with your account by contacting the system
          administrator.
        </p>

        <Link className="back-link" to="/register">Back to registration</Link>
      </section>
    </main>
  )
}
