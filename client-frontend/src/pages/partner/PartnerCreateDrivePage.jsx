import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  LoaderCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
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
  requestedItems: [{ name: '' }],
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

export default function PartnerCreateDrivePage() {
  const navigate = useNavigate()

  const [form, setForm] =
    useState(initialForm)

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
      .then((data) => {
        if (!cancelled) setProvinces(Array.isArray(data.provinces) ? data.provinces : [])
      })
      .catch((err) => {
        if (!cancelled) setLocationError(err.message || 'Unable to load provinces.')
      })
      .finally(() => {
        if (!cancelled) setLocationLoading((current) => ({ ...current, provinces: false }))
      })
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
    return () => {
      // Prevent delayed navigation from running
      // after this page has been unmounted.
    }
  }, [])

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

  const handleLocationChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'province' ? { cityMunicipality: '', barangay: '' } : {}),
      ...(name === 'cityMunicipality' ? { barangay: '' } : {}),
    }))
    setError('')
    setSuccess('')
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

    const location = [
      form.barangay,
      form.cityMunicipality,
      form.province,
    ].filter(Boolean).join(', ')

    const assistanceReference =
      form.assistanceReference.trim()
    const venue = form.venue.trim()

    const targetQuantity = Number(
      form.targetQuantity,
    )
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

    if (venue.length < 1 || venue.length > 300) {
      setError('Specific venue / landmark is required and must be 300 characters or fewer.')
      return
    }

    if (!form.eventDate) {
      setError('Drive/event date is required.')
      return
    }

    if (!form.deadline) {
      setError('Donation deadline is required.')
      return
    }
    const today = getTodayString()
    if (form.deadline <= today) {
      setError('The donation deadline must be a future date.')
      return
    }
    if (
      !Number.isFinite(new Date(`${form.eventDate}T00:00:00.000Z`).getTime()) ||
      new Date(`${form.eventDate}T00:00:00.000Z`).toISOString().slice(0, 10) !== form.eventDate
    ) {
      setError('Please enter a valid drive/event date.')
      return
    }
    if (form.eventDate < today) {
      setError('The drive/event date must be today or a future date.')
      return
    }

    if (
      requestedItems.length < 1 ||
      requestedItems.some(
        (item) =>
          !item.name ||
          item.name.length > 150,
      )
    ) {
      setError('Each requested item must have a name between 1 and 150 characters.')
      return
    }

    setSubmitting(true)

    try {
      await apiRequest(
        '/partner/drives',
        {
          method: 'POST',
          body: {
            title,
            description,
            category:
              form.category,
            targetQuantity,
            location,
            province: form.province,
            cityMunicipality: form.cityMunicipality,
            barangay: form.barangay,
            venue,
            eventDate: form.eventDate,
            deadline: form.deadline,
            requestedItems,
            assistanceReference:
              assistanceReference ||
              undefined,
          },
        },
      )

      setSuccess(
        'Donation drive created successfully.',
      )

      window.setTimeout(() => {
        navigate('/partner/drives')
      }, 800)
    } catch (err) {
      setError(
        err.message ||
          'Unable to create the donation drive.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <Link
            to="/partner/drives"
            className="back-link"
          >
            <ArrowLeft size={17} />
            Back to My Drives
          </Link>

          <h1>
            Create Donation Drive
          </h1>

          <p>
            Create a drive to let donors
            know what your organization
            currently needs.
          </p>
        </div>
      </div>

      <div className="form-card">
        {error && (
          <div
            className="validation-popup validation-popup-error"
            role="alert"
          >
            <span>{error}</span>
            <button
              type="button"
              className="validation-popup-close"
              onClick={() => setError('')}
              aria-label="Dismiss error"
            >
              ×
            </button>
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

        <form onSubmit={handleSubmit}>
          <div className="form-section drive-information-section">
            <h2>
              Drive Information
            </h2>

            <p className="form-section-description">
              Provide the basic details of
              the donation drive.
            </p>

            <div className="form-group drive-title-field">
              <label htmlFor="title">Drive Title <span className="required-label">*</span></label>

              <input
                id="title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Example: School Supplies for Grade 7 Students"
                minLength={3}
                maxLength={150}
                required
                disabled={submitting}
              />
            </div>

            <div className="form-group drive-deadline-field">
              <label htmlFor="deadline">Donation Deadline <span className="required-label">*</span></label>
              <input id="deadline" name="deadline" type="date" min={getTomorrowString()} value={form.deadline} onChange={handleChange} required disabled={submitting} />
              <span className="field-hint">Donors can contribute until this date.</span>
            </div>

            <div className="form-group drive-description-field">
              <label htmlFor="description">Description <span className="required-label">*</span></label>

              <textarea
                id="description"
                name="description"
                value={
                  form.description
                }
                onChange={handleChange}
                placeholder="Describe what the drive is for and who will benefit from it."
                minLength={10}
                maxLength={2000}
                rows={5}
                required
                disabled={submitting}
              />

              <span className="field-hint">
                {form.description.length}
                /2000 characters
              </span>
            </div>

            <div className="form-row drive-category-target-row">
              <div className="form-group drive-category-field">
                  <label htmlFor="category">Category <span className="required-label">*</span></label>

                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  disabled={submitting}
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
                  <label htmlFor="targetQuantity">Target Quantity <span className="required-label">*</span></label>

                <input
                  id="targetQuantity"
                  name="targetQuantity"
                  type="number"
                  value={
                    form.targetQuantity
                  }
                  onChange={handleChange}
                  placeholder="Example: 100"
                  min="1"
                  max="1000"
                  step="1"
                  required
                  disabled={submitting}
                />

                <span className="field-hint">
                  Enter the total number of
                  items needed.
                </span>
              </div>
            </div>

            <div className="form-group drive-location-field">
              {locationError && <span className="field-hint" role="alert">{locationError}</span>}
              <label htmlFor="province">Province <span className="required-label">*</span></label>
              <select className="location-select" id="province" name="province" value={form.province} onChange={handleLocationChange} required disabled={submitting}>
                <option value="">Select province</option>
                {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
              </select>
              {locationLoading.provinces && <span className="field-hint">Loading provinces...</span>}

              <label htmlFor="cityMunicipality">City / Municipality <span className="required-label">*</span></label>
              <select className="location-select" id="cityMunicipality" name="cityMunicipality" value={form.cityMunicipality} onChange={handleLocationChange} required disabled={submitting || !form.province || locationLoading.cities}>
                <option value="">Select city / municipality</option>
                {cities.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
              {locationLoading.cities && <span className="field-hint">Loading cities and municipalities...</span>}

              <label htmlFor="barangay">Barangay <span className="required-label">*</span></label>
              <select className="location-select" id="barangay" name="barangay" value={form.barangay} onChange={handleLocationChange} required disabled={submitting || !form.cityMunicipality || locationLoading.barangays}>
                <option value="">Select barangay</option>
                {barangays.map((barangay) => <option key={barangay.psgcCode} value={barangay.name}>{barangay.name}</option>)}
              </select>
              {locationLoading.barangays && <span className="field-hint">Loading barangays...</span>}
              {!locationLoading.barangays && form.cityMunicipality && !barangays.length && !locationError && <span className="field-hint">No barangays found for this city or municipality.</span>}

              {/* <span className="field-hint location-prototype-note">Illustrative prototype only. The barangay lists are incomplete and should be replaced with verified official location data before implementation.</span> */}
            </div>

            <div className="form-group">
              <label htmlFor="venue">Specific Venue / Landmark <span className="required-label">*</span></label>
              <input id="venue" name="venue" type="text" value={form.venue} onChange={handleChange} maxLength={300} placeholder="Example: Barangay Hall, near the public market" required disabled={submitting} />
              <span className="field-hint">Specify the exact location where donations will be received.</span>
            </div>

            <div className="form-group drive-event-field">
              <label htmlFor="eventDate">Drive / Event Date <span className="required-label">*</span></label>
              <input
                id="eventDate"
                name="eventDate"
                type="date"
                min={getTodayString()}
                value={form.eventDate}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>

          </div>

          <div className="form-section form-section-card">
            <h2>Requested Items</h2>
            <div className="form-group requested-items-form-group">
              <div>
                <label>Requested Items <span className="required-label">*</span></label>
                <p className="field-hint">
                  List each item donors should bring.
                </p>
              </div>

              {form.requestedItems.map((item, index) => (
                <div className="form-row requested-item-row" key={index}>
                  <div className="form-group">
                    <label htmlFor={`requested-item-${index}`}>Item name <span className="required-label">*</span></label>
                    <input
                      id={`requested-item-${index}`}
                      type="text"
                      value={item.name}
                      onChange={(event) => updateRequestedItem(index, 'name', event.target.value)}
                      maxLength={150}
                      placeholder="Example: Notebooks"
                      required
                      disabled={submitting}
                    />
                  </div>
                  {form.requestedItems.length > 1 && (
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => removeRequestedItem(index)}
                      aria-label={`Remove requested item ${index + 1}`}
                      disabled={submitting}
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  )}
                  {index === form.requestedItems.length - 1 && (
                    <button
                      className="secondary-button add-item-inline-button"
                      type="button"
                      onClick={addRequestedItem}
                      disabled={submitting || form.requestedItems.length >= 50}
                    >
                      <Plus size={17} />
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="form-group">
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
                placeholder="Example: Community Assistance Request #001"
                disabled={submitting}
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
              to="/partner/drives"
              className="secondary-button"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="spin"
                  />
                  Creating...
                </>
              ) : (
                'Create Donation Drive'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
