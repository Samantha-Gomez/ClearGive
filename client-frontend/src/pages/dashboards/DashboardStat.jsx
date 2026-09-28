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

      <div className="dashboard-stat-content">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}