import { Construction } from 'lucide-react'

export default function PlaceholderPage({ title, description }) {
  return (
    <section className="dashboard-page">
      <div className="page-heading"><p className="eyebrow">ClearGive</p><h1>{title}</h1><p className="muted">{description}</p></div>
      <div className="empty-state"><Construction size={28} /><strong>This area is coming next.</strong><span>The navigation is ready for this feature, but no functionality has been added yet.</span></div>
    </section>
  )
}