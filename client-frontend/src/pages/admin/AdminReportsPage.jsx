import { useState } from 'react'
import { Download, FileSpreadsheet, RefreshCw } from 'lucide-react'
import { apiDownloadRequest } from '../../services/api'

const reportEndpoints = {
  drives: '/admin/reports/drives/export',
  donations: '/admin/reports/donations/export',
  distributions: '/admin/reports/distributions/export',
}

const fallbackFilenames = {
  drives: 'cleargive-drives.csv',
  donations: 'cleargive-donations.csv',
  distributions: 'cleargive-distributions.csv',
}

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState('drives')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const dateRangeError = fromDate && toDate && fromDate > toDate
    ? 'From date must be on or before the To date.'
    : ''

  async function handleExport(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (dateRangeError) return

    const query = new URLSearchParams()
    if (fromDate) query.set('from', fromDate)
    if (toDate) query.set('to', toDate)
    const queryString = query.toString()
    const endpoint = reportEndpoints[reportType]
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
      setNotice('The CSV report has been downloaded.')
    } catch (requestError) {
      setError(requestError.message || 'Unable to export this report.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="dashboard-page">
      <div className="page-heading">
        <p className="eyebrow">Administration</p>
        <h1>Reports</h1>
        <p className="muted">
          Export donation drives, donations, and distributions for analysis.
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
              <label htmlFor="admin-report-type">Report type</label>
              <select
                id="admin-report-type"
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
              >
                <option value="drives">Donation drives</option>
                <option value="donations">Donations</option>
                <option value="distributions">Distributions</option>
              </select>
            </div>
            <div>
              <label htmlFor="admin-report-from">From date</label>
              <input id="admin-report-from" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </div>
            <div>
              <label htmlFor="admin-report-to">To date</label>
              <input id="admin-report-to" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
          </div>

          {dateRangeError && <p className="form-error" role="alert">{dateRangeError}</p>}
          {error && !dateRangeError && <p className="form-error" role="alert">{error}</p>}
          {notice && <p className="data-note" role="status">{notice}</p>}

          <button className="primary-button" type="submit" disabled={exporting || Boolean(dateRangeError)}>
            {exporting ? <RefreshCw size={18} /> : <Download size={18} />}
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </form>
      </section>
    </section>
  )
}
