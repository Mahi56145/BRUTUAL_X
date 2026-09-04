/**
 * Spaced Repetition / Revision Engine
 * SM-2 inspired algorithm with adaptive intervals
 */

export interface RevisionRecord {
  interval: number    // days until next review
  ease: number        // ease factor (default 2.5)
  repetitions: number // number of successful reviews
  dueDate: Date
}

/**
 * Calculate next revision schedule based on performance
 * Quality: 0-5 (0=blackout, 5=perfect)
 */
export function calculateNextRevision(
  current: RevisionRecord,
  quality: number // 0-5 from understanding score
): RevisionRecord {
  let { interval, ease, repetitions } = current

  if (quality < 3) {
    // Failed or poor recall — restart with shorter interval
    repetitions = 0
    interval = quality === 0 ? 1 : 2
    ease = Math.max(1.3, ease - 0.2)
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 3
    } else {
      interval = Math.round(interval * ease)
    }
    repetitions += 1
    ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))
  }

  // Cap maximum interval at 60 days
  interval = Math.min(60, Math.max(1, interval))

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + interval)

  return { interval, ease, repetitions, dueDate }
}

/**
 * Get topics due for revision today
 */
export function getRevisionUrgency(dueDate: Date | null, interval: number): number {
  if (!dueDate) return 0
  const now = new Date()
  const due = new Date(dueDate)
  const daysOverdue = Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24))

  if (daysOverdue > 7) return 10  // Very overdue
  if (daysOverdue > 3) return 8
  if (daysOverdue > 0) return 6
  if (daysOverdue === 0) return 5  // Due today
  if (daysOverdue > -2) return 3   // Due soon
  return 0
}

/**
 * Standard spaced repetition intervals for new topics
 */
export const INITIAL_INTERVALS = [1, 3, 7, 14, 30, 60]

export function getNextInterval(repetitions: number): number {
  return INITIAL_INTERVALS[Math.min(repetitions, INITIAL_INTERVALS.length - 1)]
}
