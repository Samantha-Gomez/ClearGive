export default function DashboardStat({
  label,
  value,
  icon: Icon,
}) {
  return (
    <div className="dashboard-stat">
      <div className="dashboard-stat-icon">
        <Icon size={20} />
      </div>

      <span className="dashboard-stat-label">{label}</span>
      <strong className="dashboard-stat-value">{value}</strong>
    </div>
  )
}
