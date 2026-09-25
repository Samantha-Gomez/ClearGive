export default function DashboardStat({ label, value, icon: Icon, unavailable = false }) {
  return (
    <div className={unavailable ? 'dashboard-stat stat-unavailable' : 'dashboard-stat'}>
      <span className="stat-icon"><Icon size={18} /></span>
      <div><span className="stat-label">{label}</span><strong>{value}</strong></div>
    </div>
  )
}