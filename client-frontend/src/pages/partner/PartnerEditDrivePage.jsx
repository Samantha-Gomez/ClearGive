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
  eventDate: '',
  requestedItems: [],
  assistanceReference: '',
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
            eventDate: drive.eventDate
              ? String(drive.eventDate).slice(0, 10)
              : '',
            requestedItems: Array.isArray(drive.requestedItems)
              ? drive.requestedItems.map((item) => ({
                  name: item.name || '',
                  quantity: item.quantity ?? '',
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
      requestedItems: [...current.requestedItems, { name: '', quantity: '' }],
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

    const location =
      form.location.trim()

    const assistanceReference =
      form.assistanceReference.trim()

    const targetQuantity = Number(
      form.targetQuantity,
    )
    const eventDate = form.eventDate.trim()
    const requestedItems = form.requestedItems.map((item) => ({
      name: item.name.trim(),
      quantity: Number(item.quantity),
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
      targetQuantity < 1
    ) {
      setError(
        'Target quantity must be a positive whole number.',
      )
      return
    }

    if (!location) {
      setError(
        'Please enter the drive location.',
      )
      return
    }

    if (
      eventDate &&
      (!Number.isFinite(new Date(`${eventDate}T00:00:00.000Z`).getTime()) ||
        new Date(`${eventDate}T00:00:00.000Z`).toISOString().slice(0, 10) !== eventDate)
    ) {
      setError('Please enter a valid drive/event date.')
      return
    }

    if (
      requestedItems.some(
        (item) =>
          !item.name ||
          item.name.length > 150 ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 100000000,
      )
    ) {
      setError('Each requested item needs a name and a positive whole-number quantity.')
      return
    }

    if (
      driveStatus === 'completed' ||
      driveStatus === 'cancelled'
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
        assistanceReference: assistanceReference || undefined,
      }

      if (eventDate) updates.eventDate = eventDate
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
    driveStatus === 'cancelled'

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
          <div className="form-section">
            <h2>
              Drive Information
            </h2>

            <p className="form-section-description">
              Update the information donors
              will see about this drive.
            </p>

            <div className="form-group">
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

            <div className="form-group">
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

            <div className="form-row">
              <div className="form-group">
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

              <div className="form-group">
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

            <div className="form-group">
              <label htmlFor="eventDate">
                Drive / Event Date
              </label>
              <input
                id="eventDate"
                name="eventDate"
                type="date"
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

            <div className="form-group requested-items-form-group">
              <div>
                <label>Requested Items</label>
                <p className="field-hint">
                  Add the items and quantities donors should bring. Leave empty to preserve this older drive's existing data.
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
                  <div className="form-group">
                    <label htmlFor={`requested-quantity-${index}`}>Quantity needed</label>
                    <input
                      id={`requested-quantity-${index}`}
                      type="number"
                      value={item.quantity}
                      onChange={(event) => updateRequestedItem(index, 'quantity', event.target.value)}
                      min="1"
                      max="100000000"
                      step="1"
                      placeholder="Example: 100"
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

            <div className="form-group">
              <label htmlFor="location">
                Location
              </label>

              <input
                id="location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                required
                disabled={
                  submitting ||
                  isLocked
                }
              />
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