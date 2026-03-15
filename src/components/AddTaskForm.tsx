/**
 * AddTaskForm component
 *
 * Provides a controlled input field and submit button so the user
 * can add new tasks to the list.  Trims whitespace and prevents
 * empty submissions.
 */

import { useState, type FormEvent, type KeyboardEvent } from 'react'

interface AddTaskFormProps {
  onAdd: (text: string) => void
}

export default function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [value, setValue] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onAdd(trimmed)
    setValue('')
  }

  // Allow Shift+Enter to submit from textarea-like feeling (UX nicety)
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e as unknown as FormEvent)
    }
  }

  return (
    <form className="add-task-form" onSubmit={handleSubmit} aria-label="Add a new task">
      <input
        className="add-task-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a new task…"
        maxLength={200}
        aria-label="Task description"
        autoComplete="off"
      />
      <button
        className="add-task-btn"
        type="submit"
        disabled={!value.trim()}
        aria-label="Add task"
      >
        <span aria-hidden="true">+</span> Add Task
      </button>
    </form>
  )
}
