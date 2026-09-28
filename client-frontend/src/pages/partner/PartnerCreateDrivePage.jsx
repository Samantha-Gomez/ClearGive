import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  LoaderCircle,
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
  assistanceReference: '',
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

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h2>
              Drive Information
            </h2>

            <p className="form-section-description">
              Provide the basic details of
              the donation drive.
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
                placeholder="Example: School Supplies for Grade 7 Students"
                minLength={3}
                maxLength={150}
                required
                disabled={submitting}
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
                  placeholder="Example: 100"
                  min="1"
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
                placeholder="Example: Dagupan City, Pangasinan"
                required
                disabled={submitting}
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