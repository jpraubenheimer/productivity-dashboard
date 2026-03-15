/**
 * Header component
 *
 * Displays the app title, subtitle, and a summary of task progress
 * (e.g. "3 of 5 tasks completed").
 */

import type { Task } from '../types'

interface HeaderProps {
  tasks: Task[]
}

export default function Header({ tasks }: HeaderProps) {
  const total = tasks.length
  const completed = tasks.filter((t) => t.completed).length

  return (
    <header className="header">
      {/* App icon + branding */}
      <div className="header-brand">
        <span className="header-icon" aria-hidden="true">⚡</span>
        <div>
          <h1 className="header-title">My Productivity Dashboard</h1>
          <p className="header-subtitle">Stay focused. Get things done.</p>
        </div>
      </div>

      {/* Progress summary — only shown when there are tasks */}
      {total > 0 && (
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">{completed}</span>
            <span className="stat-label">Done</span>
          </div>
          <div className="stat-divider" aria-hidden="true" />
          <div className="stat">
            <span className="stat-number">{total - completed}</span>
            <span className="stat-label">Left</span>
          </div>
          {/* Animated circular progress indicator */}
          <ProgressRing completed={completed} total={total} />
        </div>
      )}
    </header>
  )
}

/** Small SVG ring that fills as tasks are completed */
function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  const radius = 18
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="progress-ring" title={`${pct}% complete`}>
      <svg width="48" height="48" viewBox="0 0 48 48" aria-hidden="true">
        {/* Background track */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="4"
        />
        {/* Filled arc */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="4"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.4s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }}
        />
      </svg>
      <span className="progress-pct">{pct}%</span>
    </div>
  )
}
