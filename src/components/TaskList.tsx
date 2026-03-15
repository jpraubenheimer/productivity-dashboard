/**
 * TaskList component
 *
 * Renders the full list of tasks (or an empty-state message when there
 * are none), and optionally shows a "Clear completed" button when at
 * least one task is done.
 */

import type { Task } from '../types'
import TaskItem from './TaskItem'

interface TaskListProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onClearCompleted: () => void
}

export default function TaskList({ tasks, onToggle, onDelete, onClearCompleted }: TaskListProps) {
  const hasCompleted = tasks.some((t) => t.completed)

  if (tasks.length === 0) {
    return (
      <div className="empty-state" role="status">
        <span className="empty-icon" aria-hidden="true">📋</span>
        <p>No tasks yet — add one above and start crushing your goals!</p>
      </div>
    )
  }

  return (
    <section className="task-list-section" aria-label="Task list">
      <ul className="task-list" role="list">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </ul>

      {/* Footer action row */}
      {hasCompleted && (
        <div className="list-footer">
          <button
            className="clear-btn"
            onClick={onClearCompleted}
            aria-label="Remove all completed tasks"
          >
            🗑 Clear completed
          </button>
        </div>
      )}
    </section>
  )
}
