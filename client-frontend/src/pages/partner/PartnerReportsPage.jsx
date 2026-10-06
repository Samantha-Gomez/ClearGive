import { useEffect, useState } from 'react'
import { Download, FileSpreadsheet, RefreshCw } from 'lucide-react'
import { apiDownloadRequest, apiRequest } from '../../services/api'

const reportEndpoints = {
  drives: '/partner/reports/drives/export',
  donations: '/partner/reports/donations/export',
  distributions: '/partner/reports/distributions/export',
}

const fallbackFilenames = {
  drives: 'cleargive-drives.csv',
  donations: 'cleargive-donations.csv',
  distributions: 'cleargive-distributions.csv',
}

export default function PartnerReportsPage() {
  const [reportType, setReportType] = useState('drives')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [driveId, setDriveId] = useState('')
  const [drives, setDrives] = useState([])
  const [drivesLoading, setDrivesLoading] = useState(true)
  const [drivesError, setDrivesError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    async function loadDrives() {
      setDrivesLoading(true)
      setDrivesError('')

      try {
        const data = await apiRequest('/partner/drives')
        if (active) setDrives(data.drives || [])
      } catch (requestError) {
        if (active) {
          setDrivesError(requestError.message || 'Unable to load your drives.')
        }
      } finally {
        if (active) setDrivesLoading(false)
      }
    }

    loadDrives()
    return () => {
      active = false
    }
  }, [])

  const dateRangeError =
    fromDate && toDate && fromDate > toDate
      ? 'From date must be on or before the To date.'
      : ''

  async function handleExport(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (dateRangeError) return

    const endpoint = reportEndpoints[reportType]
    if (!endpoint) {
      setError('Select a valid report type.')
      return
    }

    const query = new URLSearchParams()
    if (fromDate) query.set('from', fromDate)
    if (toDate) query.set('to', toDate)
    if (driveId) query.set('driveId', driveId)
    const queryString = query.toString()
    const requestPath = queryString ? `${endpoint}?${queryString}` : endpoint

    setExporting(true)
    try {
      const { blob, filename } = await apiDownloadRequest(requestPath)
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = filename || fallbackFilenames[reportType]
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
      setNotice('Your CSV report has been downloaded.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to export this report.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <p className="eyebrow">Partner</p>
        <h1>Reports</h1>
        <p className="muted">
          Export your drives, donations, and distributions as CSV files.
        </p>
      </div>

      <section className="content-card data-card report-export-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CSV export</p>
            <h2>Choose report details</h2>
          </div>
          <span className="dashboard-icon" aria-hidden="true">
            <FileSpreadsheet size={22} />
          </span>
        </div>

        <form onSubmit={handleExport}>
          <div className="form-grid report-filter-grid">
            <div>
              <label htmlFor="report-type">Report type</label>
              <select
                id="report-type"
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
              >
                <option value="drives">Drives</option>
                <option value="donations">Donations</option>
                <option value="distributions">Distributions</option>
              </select>
            </div>

            <div>
              <label htmlFor="report-from">From date</label>
              <input
                id="report-from"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="report-to">To date</label>
              <input
                id="report-to"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="report-drive">Drive</label>
              <select
                id="report-drive"
                value={driveId}
                onChange={(event) => setDriveId(event.target.value)}
                disabled={drivesLoading}
              >
                <option value="">All drives</option>
                {drives.map((drive) => {
                  const id = drive.id || drive._id
                  return id ? (
                    <option key={id} value={id}>{drive.title}</option>
                  ) : null
                })}
              </select>
              {!drivesLoading && !drivesError && drives.length === 0 && (
                <p className="data-note">No drives yet. All Drives remains available.</p>
              )}
              {drivesError && (
                <p className="data-note" role="status">
                  {drivesError}
                </p>
              )}
              {drivesLoading && <p className="data-note">Loading your drives...</p>}
            </div>
          </div>

          {dateRangeError && (
            <p className="form-error" role="alert">{dateRangeError}</p>
          )}
          {error && !dateRangeError && (
            <p className="form-error" role="alert">{error}</p>
          )}
          {notice && <p className="data-note" role="status">{notice}</p>}

          <button
            className="primary-button"
            type="submit"
            disabled={exporting || Boolean(dateRangeError)}
          >
            {exporting ? <RefreshCw size={18} /> : <Download size={18} />}
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </form>
      </section>
    </section>
  )
}