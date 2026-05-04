export default function StatsCard({ icon, value, label, trend, trendValue, color }) {
  return (
    <div className="stats-card">
      <div className="stats-card-icon" style={color ? { background: color } : {}}>
        {icon}
      </div>
      <div className="stats-card-info">
        <span className="stats-card-value">{value}</span>
        <span className="stats-card-label">{label}</span>
      </div>
      {trend && (
        <div className={`stats-card-trend ${trend}`}>
          {trend === 'up' ? '↑' : '↓'} {trendValue}
        </div>
      )}
    </div>
  )
}
