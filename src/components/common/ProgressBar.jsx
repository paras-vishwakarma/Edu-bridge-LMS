export default function ProgressBar({ value, max = 100, size = 'md', showLabel = true, color }) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)

  const getColor = () => {
    if (color) return color
    if (percentage >= 80) return 'var(--color-success)'
    if (percentage >= 40) return 'var(--accent-primary)'
    return 'var(--color-warning)'
  }

  return (
    <div className={`progress-bar-wrapper progress-${size}`}>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${percentage}%`,
            background: getColor(),
          }}
        />
      </div>
      {showLabel && <span className="progress-label">{percentage}%</span>}
    </div>
  )
}
