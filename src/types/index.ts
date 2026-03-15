/**
 * Shared TypeScript types used throughout the application.
 */

/** A single to-do task */
export interface Task {
  /** Unique identifier (UUID) */
  id: string;
  /** The task description entered by the user */
  text: string;
  /** Whether the task has been marked as done */
  completed: boolean;
  /** ISO timestamp of when the task was created */
  createdAt: string;
}

/** The possible loading states for the AI tip feature */
export type TipStatus = 'idle' | 'loading' | 'success' | 'error';
