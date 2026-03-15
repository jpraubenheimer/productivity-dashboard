/**
 * TaskItem component
 *
 * Renders a single task with:
 *   - A checkbox to toggle completion
 *   - The task text (struck-through when done)
 *   - An "AI Tip ✨" button that fetches a motivational tip from Claude
 *   - A delete button
 *
 * The AI tip is fetched via the /api/generate-tip serverless function,
 * keeping the Anthropic API key safely on the server side.
 */

import { useState } from 'react'
import type { Task, TipStatus } from '../types'

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  // Current AI-tip state for this task
  const [tip, setTip] = useState<string | null>(null)
  const [tipStatus, setTipStatus] = useState<TipStatus>('idle')

  /**
   * Calls the /api/generate-tip serverless function and updates local state.
   * Subsequent clicks re-fetch a fresh tip (so users can try for a new one).
   */
  async function fetchTip() {
    setTipStatus('loading')
    setTip(null)

    try {
      const response = await fetch('/api/generate-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: task.text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? 'Unknown error')
      }

      setTip(data.tip)
      setTipStatus('success')
    } catch (err) {
      console.error('Failed to fetch tip:', err)
      setTip(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setTipStatus('error')
    }
  }

  return (
    <li className={`task-item ${task.completed ? 'task-completed' : ''}`}>
      {/* ── Row: checkbox + text + action buttons ── */}
      <div className="task-row">
        {/* Completion checkbox */}
        <button
          className={`task-checkbox ${task.completed ? 'checked' : ''}`}
          onClick={() => onToggle(task.id)}
          aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
          aria-pressed={task.completed}
        >
          {task.completed && <CheckIcon />}
        </button>

        {/* Task text */}
        <span className="task-text">{task.text}</span>

        {/* Action buttons */}
        <div className="task-actions">
          {/* AI Tip button */}
          <button
            className={`tip-btn ${tipStatus === 'loading' ? 'loading' : ''}`}
            onClick={fetchTip}
            disabled={tipStatus === 'loading'}
            aria-label={`Get AI tip for: ${task.text}`}
            title="Get a motivational tip from Claude AI"
          >
            {tipStatus === 'loading' ? (
              <span className="spinner" aria-hidden="true" />
            ) : (
              <>✨ AI Tip</>
            )}
          </button>

          {/* Delete button */}
          <button
            className="delete-btn"
            onClick={() => onDelete(task.id)}
            aria-label={`Delete task: ${task.text}`}
            title="Delete task"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* ── AI Tip callout (shown after fetch) ── */}
      {tip && (
        <div
          className={`tip-box ${tipStatus === 'error' ? 'tip-error' : 'tip-success'}`}
          role="status"
          aria-live="polite"
        >
          {tipStatus === 'success' && <span className="tip-icon" aria-hidden="true">💡</span>}
          {tipStatus === 'error' && <span className="tip-icon" aria-hidden="true">⚠️</span>}
          <p className="tip-text">{tip}</p>
        </div>
      )}
    </li>
  )
}

/** Simple SVG checkmark */
function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" fill="none" aria-hidden="true">
      <polyline points="1.5,6 4.5,9.5 10.5,2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Simple SVG trash icon */
function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}
