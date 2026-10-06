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
  'Register for a ClearGive account as a donor.',
  'Sign in to find an available donation drive.',
  'Review the requested items and the drive location.',
  'Bring your donation directly to the stated location.',
  'The partner records the donation when it is received.',
  'Partners record distribution, and donors can follow updates.',
]

export default function DashboardPage() {
  return (
    <main className="landing-page">
      <header className="landing-nav">
        <Link className="brand" to="/" aria-label="ClearGive home">
          <span className="brand-mark">
            <HeartHandshake size={21} />
          </span>
          <span>ClearGive</span>
        </Link>

        <nav className="landing-nav-links" aria-label="Landing page navigation">
          <a href="#what-is-cleargive">What is ClearGive?</a>
          <a href="#how-it-works">How it works</a>
          <a href="#contact">Contact</a>
          <Link className="secondary-button" to="/login">Login</Link>
          <Link className="primary-button" to="/register">Register</Link>
        </nav>
      </header>

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
            After registering, donors can browse available drives and bring
            requested goods directly to the stated location. Partners record
            donations and distributions.
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

      <section className="landing-section" id="what-is-cleargive">
        <div className="section-heading">
          <p className="eyebrow">About ClearGive</p>
          <h2>What is ClearGive?</h2>
          <p className="muted">
            ClearGive is a web-based donation and community assistance
            management system that connects donors with verified partner
            organizations and the drives they organize.
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

      <section className="landing-section landing-how-it-works" id="how-it-works">
        <div className="section-heading">
          <p className="eyebrow">Your donation journey</p>
          <h2>How it works</h2>
          <p className="muted">
            From a community need to meaningful assistance.
          </p>
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

      <section className="landing-section" id="contact">
        <div className="section-heading">
          <p className="eyebrow">Contact</p>
          <h2>Questions about ClearGive?</h2>
          <p className="muted">
            Please contact the project team through the official contact
            details provided by your institution.
          </p>
        </div>
      </section>

      <section className="landing-cta">
        <div>
          <p className="eyebrow">Ready to help?</p>
          <h2>Be part of a more organized way of giving.</h2>
          <p className="muted">
            Create an account to browse drives as a donor or manage community
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