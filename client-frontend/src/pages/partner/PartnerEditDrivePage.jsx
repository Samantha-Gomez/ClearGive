import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  LoaderCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../../services/api'

const categories = [
  'School Supplies',
  'Food',
  'Hygiene',
  'Clothing',
  'Water',
  'Household Needs',
]
const initialForm = {
  title: '',
  description: '',
  category: '',
  targetQuantity: '',
  location: '',
  province: 'Pangasinan',
  cityMunicipality: '',
  barangay: '',
  venue: '',
  eventDate: '',
  deadline: '',
  requestedItems: [],
  assistanceReference: '',
}

function getTodayString() {
  const today = new Date()
  const offset = today.getTimezoneOffset() * 60000
  return new Date(today.getTime() - offset).toISOString().slice(0, 10)
}

function getTomorrowString() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const offset = tomorrow.getTimezoneOffset() * 60000
  return new Date(tomorrow.getTime() - offset).toISOString().slice(0, 10)
}

export default function PartnerEditDrivePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [form, setForm] =
    useState(initialForm)

  const [driveStatus, setDriveStatus] =
    useState('')

  const [loading, setLoading] =
    useState(true)

  const [submitting, setSubmitting] =
    useState(false)

  const [error, setError] =
    useState('')

  const [success, setSuccess] =
    useState('')

  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [barangays, setBarangays] = useState([])
  const [locationLoading, setLocationLoading] = useState({ provinces: false, cities: false, barangays: false })
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLocationLoading((current) => ({ ...current, provinces: true }))
    apiRequest('/locations/provinces')
      .then((data) => { if (!cancelled) setProvinces(Array.isArray(data.provinces) ? data.provinces : []) })
      .catch((err) => { if (!cancelled) setLocationError(err.message || 'Unable to load provinces.') })
      .finally(() => { if (!cancelled) setLocationLoading((current) => ({ ...current, provinces: false })) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!form.province) {
      setCities([])
      return undefined
    }
    let cancelled = false
    setLocationLoading((current) => ({ ...current, cities: true }))
    apiRequest(`/locations/cities?province=${encodeURIComponent(form.province)}`)
      .then((data) => { if (!cancelled) setCities(Array.isArray(data.cities) ? data.cities : []) })
      .catch((err) => { if (!cancelled) setLocationError(err.message || 'Unable to load cities and municipalities.') })
      .finally(() => { if (!cancelled) setLocationLoading((current) => ({ ...current, cities: false })) })
    return () => { cancelled = true }
  }, [form.province])

  useEffect(() => {
    if (!form.province || !form.cityMunicipality) {
      setBarangays([])
      return undefined
    }
    let cancelled = false
    setLocationLoading((current) => ({ ...current, barangays: true }))
    apiRequest(`/locations/barangays?province=${encodeURIComponent(form.province)}&city=${encodeURIComponent(form.cityMunicipality)}`)
      .then((data) => { if (!cancelled) setBarangays(Array.isArray(data.barangays) ? data.barangays : []) })
      .catch((err) => { if (!cancelled) setLocationError(err.message || 'Unable to load barangays.') })
      .finally(() => { if (!cancelled) setLocationLoading((current) => ({ ...current, barangays: false })) })
    return () => { cancelled = true }
  }, [form.province, form.cityMunicipality])

  useEffect(() => {
    let cancelled = false

    const fetchDrive = async () => {
      try {
        const data = await apiRequest(
          `/partner/drives/${id}`,
        )

        const drive =
          data.drive || data

        if (!cancelled) {
          const [legacyBarangay = '', legacyCity = '', legacyProvince = 'Pangasinan'] = (drive.location || '').split(',').map((part) => part.trim())
          setForm({
            title: drive.title || '',
            description:
              drive.description || '',
            category:
              drive.category || '',
            targetQuantity:
              drive.targetQuantity ?? '',
            location:
              drive.location || '',
            province: drive.province || legacyProvince,
            cityMunicipality: drive.cityMunicipality || legacyCity,
            barangay: drive.barangay || legacyBarangay,
            venue: drive.venue || '',
            eventDate: drive.eventDate
              ? String(drive.eventDate).slice(0, 10)
              : '',
            deadline: drive.deadline
              ? String(drive.deadline).slice(0, 10)
              : '',
            requestedItems: Array.isArray(drive.requestedItems)
              ? drive.requestedItems.map((item) => ({
                  name: item.name || '',
                }))
              : [],
            assistanceReference:
              drive.assistanceReference ||
              '',
          })

          setDriveStatus(
            drive.status || '',
          )

          setError('')
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              'Unable to load this donation drive.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchDrive()

    return () => {
      cancelled = true
    }
  }, [id])

  const handleChange = (event) => {
    const { name, value } =
      event.target

    setForm((current) => ({
      ...current,
      [name]: value,
    }))

    if (error) {
      setError('')
    }

    if (success) {
      setSuccess('')
    }
  }

  const updateRequestedItem = (index, field, value) => {
    setForm((current) => ({
      ...current,
      requestedItems: current.requestedItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }))
    setError('')
  }

  const addRequestedItem = () => {
    setForm((current) => ({
      ...current,
      requestedItems: [...current.requestedItems, { name: '' }],
    }))
  }

  const removeRequestedItem = (index) => {
    setForm((current) => ({
      ...current,
      requestedItems: current.requestedItems.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const title = form.title.trim()
    const description =
      form.description.trim()

    const location = [form.barangay, form.cityMunicipality, form.province].filter(Boolean).join(', ')

    const assistanceReference =
      form.assistanceReference.trim()
    const venue = form.venue.trim()

    const targetQuantity = Number(
      form.targetQuantity,
    )
    const deadline = form.deadline.trim()
    const eventDate = form.eventDate.trim()
    const requestedItems = form.requestedItems.map((item) => ({
      name: item.name.trim(),
    }))

    if (
      title.length < 3 ||
      title.length > 150
    ) {
      setError(
        'Drive title must be between 3 and 150 characters.',
      )
      return
    }

    if (
      description.length < 10 ||
      description.length > 2000
    ) {
      setError(
        'Description must be between 10 and 2000 characters.',
      )
      return
    }

    if (!categories.includes(form.category)) {
      setError(
        'Please select a valid drive category.',
      )
      return
    }

    if (
      !Number.isInteger(
        targetQuantity,
      ) ||
      targetQuantity < 1 ||
      targetQuantity > 1000
    ) {
      setError(
        'Target quantity must be a whole number between 1 and 1,000.',
      )
      return
    }

    if (!form.province || !form.cityMunicipality || !form.barangay) {
      setError(
        'Please select a province, city/municipality, and barangay.',
      )
      return
    }

    if (venue.length > 300) {
      setError('Specific venue / landmark must be 300 characters or fewer.')
      return
    }

    const today = getTodayString()

    if (
      eventDate &&
      (!Number.isFinite(new Date(`${eventDate}T00:00:00.000Z`).getTime()) ||
        new Date(`${eventDate}T00:00:00.000Z`).toISOString().slice(0, 10) !== eventDate)
    ) {
      setError('Please enter a valid drive/event date.')
      return
    }

    if (eventDate && eventDate < today) {
      setError('The drive/event date must be today or a future date.')
      return
    }

    if (deadline && deadline <= today) {
      setError('The donation deadline must be a future date.')
      return
    }

    if (
      requestedItems.some(
        (item) =>
          !item.name ||
          item.name.length > 150,
      )
    ) {
      setError('Each requested item must have a name between 1 and 150 characters.')
      return
    }

    if (
      driveStatus === 'completed' ||
      driveStatus === 'cancelled' ||
      driveStatus === 'expired'
    ) {
      setError(
        `This drive can no longer be edited because it is ${driveStatus}.`,
      )
      return
    }

    setSubmitting(true)

    try {
      const updates = {
        title,
        description,
        category: form.category,
        targetQuantity,
        location,
        province: form.province,
        cityMunicipality: form.cityMunicipality,
        barangay: form.barangay,
        ...(venue ? { venue } : {}),
        assistanceReference: assistanceReference || undefined,
      }

      if (eventDate) updates.eventDate = eventDate
      if (deadline) updates.deadline = deadline
      if (requestedItems.length) updates.requestedItems = requestedItems

      await apiRequest(
        `/partner/drives/${id}`,
        {
          method: 'PATCH',
          body: updates,
        },
      )

      setSuccess(
        'Donation drive updated successfully.',
      )

      window.setTimeout(() => {
        navigate(
          `/partner/drives/${id}`,
        )
      }, 800)
    } catch (err) {
      setError(
        err.message ||
          'Unable to update the donation drive.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page-state">
        <LoaderCircle
          size={22}
          className="spin"
        />
        Loading donation drive...
      </div>
    )
  }

  if (error && !form.title) {
    return (
      <div className="page-shell">
        <Link
          to={`/partner/drives/${id}`}
          className="back-link"
        >
          <ArrowLeft size={17} />
          Back to Drive
        </Link>

        <div
          className="page-state page-state-error"
          role="alert"
        >
          {error}
        </div>
      </div>
    )
  }

  const isLocked =
    driveStatus === 'completed' ||
    driveStatus === 'cancelled' ||
    driveStatus === 'expired'

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <Link
            to={`/partner/drives/${id}`}
            className="back-link"
          >
            <ArrowLeft size={17} />
            Back to Drive
          </Link>

          <h1>
            Edit Donation Drive
          </h1>

          <p>
            Update the information for this
            donation drive.
          </p>
        </div>
      </div>

      <div className="form-card">
        {error && (
          <div
            className="form-message form-message-error"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="form-message form-message-success"
            role="status"
          >
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {isLocked && (
          <div
            className="form-message form-message-error"
            role="alert"
          >
            This drive can no longer be edited
            because it is {driveStatus}.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-section drive-information-section">
            <h2>
              Drive Information
            </h2>

            <p className="form-section-description">
              Update the information donors
              will see about this drive.
            </p>

            <div className="form-group drive-title-field">
              <label htmlFor="title">
                Drive Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                minLength={3}
                maxLength={150}
                required
                disabled={
                  submitting ||
                  isLocked
                }
              />
            </div>

            <div className="form-group drive-deadline-field">
              <label htmlFor="deadline">Donation Deadline</label>
              <input id="deadline" name="deadline" type="date" min={getTomorrowString()} value={form.deadline} onChange={handleChange} disabled={submitting || isLocked} />
              <span className="field-hint">Optional for older drives; donors can contribute until this date.</span>
            </div>

            <div className="form-group drive-description-field">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={
                  form.description
                }
                onChange={handleChange}
                minLength={10}
                maxLength={2000}
                rows={5}
                required
                disabled={
                  submitting ||
                  isLocked
                }
              />

              <span className="field-hint">
                {form.description.length}
                /2000 characters
              </span>
            </div>

            <div className="form-row drive-category-target-row">
              <div className="form-group drive-category-field">
                <label htmlFor="category">
                  Category
                </label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  disabled={
                    submitting ||
                    isLocked
                  }
                >
                  <option value="">
                    Select a category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div className="form-group drive-target-field">
                <label htmlFor="targetQuantity">
                  Target Quantity
                </label>

                <input
                  id="targetQuantity"
                  name="targetQuantity"
                  type="number"
                  value={
                    form.targetQuantity
                  }
                  onChange={handleChange}
                  min="1"
                  max="1000"
                  step="1"
                  required
                  disabled={
                    submitting ||
                    isLocked
                  }
                />

                <span className="field-hint">
                  Enter the total number of
                  items needed.
                </span>
              </div>
            </div>

            <div className="form-group drive-event-field">
              <label htmlFor="eventDate">
                Drive / Event Date
              </label>
              <input
                id="eventDate"
                name="eventDate"
                type="date"
                min={getTodayString()}
                value={form.eventDate}
                onChange={handleChange}
                disabled={submitting || isLocked}
              />
              {!form.eventDate && (
                <span className="field-hint">
                  No event date is stored for this drive yet.
                </span>
              )}
            </div>

            <div className="form-group requested-items-form-group drive-requested-items-field">
              <div>
                <label>Requested Items</label>
                <p className="field-hint">
                  Add the items donors should bring. Leave empty to preserve this older drive's existing data.
                </p>
              </div>
              {form.requestedItems.map((item, index) => (
                <div className="form-row requested-item-row" key={index}>
                  <div className="form-group">
                    <label htmlFor={`requested-item-${index}`}>Item name</label>
                    <input
                      id={`requested-item-${index}`}
                      type="text"
                      value={item.name}
                      onChange={(event) => updateRequestedItem(index, 'name', event.target.value)}
                      maxLength={150}
                      placeholder="Example: Notebooks"
                      required
                      disabled={submitting || isLocked}
                    />
                  </div>
                  {form.requestedItems.length > 1 && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => removeRequestedItem(index)}
                      aria-label={`Remove requested item ${index + 1}`}
                      disabled={submitting || isLocked}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                className="secondary-button"
                type="button"
                onClick={addRequestedItem}
                disabled={submitting || isLocked || form.requestedItems.length >= 50}
              >
                <Plus size={17} />
                Add requested item
              </button>
            </div>

            <div className="form-group drive-location-field">
              {locationError && <span className="field-hint" role="alert">{locationError}</span>}
              <label htmlFor="edit-province">Province <span className="required-label">*</span></label>
              <select className="location-select" id="edit-province" value={form.province} onChange={(event) => setForm((current) => ({ ...current, province: event.target.value, cityMunicipality: '', barangay: '' }))} required disabled={submitting || isLocked || locationLoading.provinces}>
                <option value="">Select province</option>
                {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
              </select>
              {locationLoading.provinces && <span className="field-hint">Loading provinces...</span>}
              <label htmlFor="edit-city">City / Municipality <span className="required-label">*</span></label>
              <select className="location-select" id="edit-city" value={form.cityMunicipality} onChange={(event) => setForm((current) => ({ ...current, cityMunicipality: event.target.value, barangay: '' }))} required disabled={submitting || isLocked || !form.province || locationLoading.cities}>
                <option value="">Select city / municipality</option>
                {cities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
              {locationLoading.cities && <span className="field-hint">Loading cities and municipalities...</span>}
              <label htmlFor="edit-barangay">Barangay <span className="required-label">*</span></label>
              <select className="location-select" id="edit-barangay" value={form.barangay} onChange={(event) => setForm((current) => ({ ...current, barangay: event.target.value }))} required disabled={submitting || isLocked || !form.cityMunicipality || locationLoading.barangays}>
                <option value="">Select barangay</option>
                {barangays.map((barangay) => <option key={barangay.psgcCode} value={barangay.name}>{barangay.name}</option>)}
              </select>
              {locationLoading.barangays && <span className="field-hint">Loading barangays...</span>}
              {!locationLoading.barangays && form.cityMunicipality && !barangays.length && !locationError && <span className="field-hint">No barangays found for this city or municipality.</span>}
            </div>

            <div className="form-group">
              <label htmlFor="edit-venue">Specific Venue / Landmark <span className="required-label">*</span></label>
              <input id="edit-venue" name="venue" type="text" value={form.venue} onChange={handleChange} maxLength={300} placeholder="Example: Barangay Hall, near the public market" disabled={submitting || isLocked} />
              <span className="field-hint">Specify the exact location where donations will be received.</span>
            </div>

            <div className="form-group drive-assistance-field">
              <label htmlFor="assistanceReference">
                Assistance Reference{' '}
                <span>(Optional)</span>
              </label>

              <input
                id="assistanceReference"
                name="assistanceReference"
                type="text"
                value={
                  form.assistanceReference
                }
                onChange={handleChange}
                disabled={
                  submitting ||
                  isLocked
                }
              />

              <span className="field-hint">
                You may provide a reference
                number or related assistance
                request.
              </span>
            </div>
          </div>

          <div className="form-actions">
            <Link
              to={`/partner/drives/${id}`}
              className="secondary-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="primary-button"
              disabled={
                submitting ||
                isLocked
              }
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="spin"
                  />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
