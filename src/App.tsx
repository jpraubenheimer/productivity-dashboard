/**
 * App (root component)
 *
 * Owns the canonical task list state and persists it to localStorage so
 * tasks survive page refreshes.  Delegates rendering to smaller components.
 *
 * State shape:  Task[]  (see src/types/index.ts)
 *
 * Key responsibilities:
 *   - Load tasks from localStorage on mount
 *   - Persist tasks to localStorage on every change
 *   - Provide add / toggle / delete / clearCompleted handlers to children
 */

import { useState, useEffect, useCallback } from 'react'
import type { Task } from './types'
import Header from './components/Header'
import AddTaskForm from './components/AddTaskForm'
import TaskList from './components/TaskList'
import './App.css'

// localStorage key — change this if you need multiple dashboard instances
const STORAGE_KEY = 'productivity_dashboard_tasks'

/** Generate a simple unique ID (crypto.randomUUID where available, fallback otherwise) */
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/** Read persisted tasks from localStorage (returns [] on any failure) */
function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Task[]
  } catch {
    return []
  }
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(loadTasks)

  // Persist every time tasks change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  }, [tasks])

  /** Add a new task to the top of the list */
  const addTask = useCallback((text: string) => {
    const newTask: Task = {
      id: generateId(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [newTask, ...prev])
  }, [])

  /** Toggle the completed flag for a task */
  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }, [])

  /** Permanently remove a task */
  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  /** Remove all completed tasks at once */
  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.completed))
  }, [])

  return (
    <div className="app">
      {/* Decorative background blobs */}
      <div className="bg-blob bg-blob-1" aria-hidden="true" />
      <div className="bg-blob bg-blob-2" aria-hidden="true" />

      <div className="container">
        <Header tasks={tasks} />

        <main className="main-card">
          <AddTaskForm onAdd={addTask} />
          <TaskList
            tasks={tasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onClearCompleted={clearCompleted}
          />
        </main>

        <footer className="app-footer">
          <p>
            Tasks saved locally • AI tips powered by{' '}
            <a
              href="https://www.anthropic.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Claude (Anthropic)
            </a>
          </p>
        </footer>
      </div>
    </div>
  )
}
