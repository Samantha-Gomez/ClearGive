import {
  ArrowRight,
  Building2,
  CheckCircle2,
  HeartHandshake,
  Package,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  {
    icon: HeartHandshake,
    title: 'Support Communities',
    text: 'Help provide essential goods to people and communities that need assistance.',
  },
  {
    icon: ShieldCheck,
    title: 'Verified Organizations',
    text: 'Partner organizations go through a verification process before accessing protected partner features.',
  },
  {
    icon: Package,
    title: 'Track Donations',
    text: 'Follow donation activity from recorded contributions through receiving and distribution.',
  },
  {
    icon: Building2,
    title: 'Community Partners',
    text: 'Organizations can create assistance drives and keep records of donations and distributions.',
  },
]

const steps = [
  'Organizations create donation drives based on community needs.',
  'Donors browse active drives and record the items they want to contribute.',
  'Partners receive and distribute donations to beneficiaries.',
  'ClearGive keeps activity records to support transparency.',
]

export default function DashboardPage() {
  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-content">
          <p className="eyebrow">Community Donation & Assistance</p>

          <h1>Give with purpose. Support with transparency.</h1>

          <p className="landing-hero-text">
            ClearGive connects donors with verified community organizations
            through organized donation drives and transparent assistance
            tracking.
          </p>

          <div className="landing-actions">
            <Link to="/register" className="primary-button">
              Get Started
              <ArrowRight size={18} />
            </Link>

            <Link to="/login" className="secondary-button">
              Login
            </Link>
          </div>
        </div>

        <div className="landing-hero-card">
          <div className="dashboard-icon">
            <HeartHandshake size={30} />
          </div>

          <h2>Making giving easier.</h2>

          <p>
            Discover active donation drives, contribute essential goods, and
            help communities keep track of assistance from collection to
            distribution.
          </p>

          <div className="landing-check">
            <CheckCircle2 size={18} />
            Organized donation drives
          </div>

          <div className="landing-check">
            <CheckCircle2 size={18} />
            Verified partner organizations
          </div>

          <div className="landing-check">
            <CheckCircle2 size={18} />
            Transparent donation records
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading">
          <p className="eyebrow">What ClearGive provides</p>
          <h2>A clearer way to support communities.</h2>
          <p className="muted">
            ClearGive brings donors and community organizations together in
            one organized platform.
          </p>
        </div>

        <div className="landing-feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <article className="landing-feature-card" key={feature.title}>
                <div className="dashboard-icon">
                  <Icon size={22} />
                </div>

                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="landing-section landing-how-it-works">
        <div className="section-heading">
          <p className="eyebrow">How it works</p>
          <h2>From a community need to meaningful assistance.</h2>
        </div>

        <div className="landing-steps">
          {steps.map((step, index) => (
            <div className="landing-step" key={step}>
              <span className="landing-step-number">
                {index + 1}
              </span>

              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div>
          <p className="eyebrow">Ready to help?</p>
          <h2>Be part of a more organized way of giving.</h2>
          <p className="muted">
            Create an account to discover donation drives or manage community
            assistance as a partner organization.
          </p>
        </div>

        <Link to="/register" className="primary-button">
          Create an Account
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  )
}