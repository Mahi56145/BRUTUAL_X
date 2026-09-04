/**
 * Mastery Engine
 * Handles all mastery score calculations and updates
 */

export interface SessionFeedback {
  status: 'completed' | 'partial' | 'skipped'
  understanding: number // 1-5
  questionsAttempted: number
  questionsCorrect: number
  actualMinutes: number
  plannedMinutes: number
}

export interface MasteryRecord {
  mastery: number | null
  confidence: number
  accuracy: number
  questionsAttempted: number
  questionsCorrect: number
  revisionCount: number
  failureCount: number
  revisionInterval: number
  isAssessed?: boolean
}

/**
 * Calculate new mastery score based on session feedback
 */
export function calculateNewMastery(
  current: MasteryRecord,
  feedback: SessionFeedback
): Partial<MasteryRecord> {
  if (feedback.status === 'skipped') {
    return {
      failureCount: current.failureCount + 1,
    }
  }

  const sessionAccuracy =
    feedback.questionsAttempted > 0
      ? (feedback.questionsCorrect / feedback.questionsAttempted) * 100
      : feedback.understanding * 20 // fallback to understanding score

  const completionRatio =
    feedback.status === 'completed'
      ? 1.0
      : feedback.actualMinutes / Math.max(feedback.plannedMinutes, 1)

  // Weighted mastery gain
  const understandingWeight = (feedback.understanding / 5) * 0.4
  const accuracyWeight = (sessionAccuracy / 100) * 0.4
  const completionWeight = completionRatio * 0.2

  const sessionScore = (understandingWeight + accuracyWeight + completionWeight) * 100

  // If first real assessment (mastery was null), initialize directly from session score!
  let newMastery: number
  if (current.mastery === null || current.mastery === undefined) {
    newMastery = Math.min(100, Math.max(0, sessionScore))
  } else {
    // Mastery moves toward session score, dampened by existing mastery
    const masteryGap = sessionScore - current.mastery
    const learningRate = current.mastery > 70 ? 0.08 : current.mastery > 40 ? 0.12 : 0.18
    const masteryDelta = masteryGap * learningRate
    newMastery = Math.min(100, Math.max(0, current.mastery + masteryDelta))
  }

  // New total stats
  const newQuestionsAttempted = current.questionsAttempted + feedback.questionsAttempted
  const newQuestionsCorrect = current.questionsCorrect + feedback.questionsCorrect
  const newAccuracy =
    newQuestionsAttempted > 0
      ? (newQuestionsCorrect / newQuestionsAttempted) * 100
      : current.accuracy

  // Confidence: blend of understanding scores
  const newConfidence = Math.round(
    current.confidence * 0.6 + feedback.understanding * 0.4
  )

  return {
    mastery: Math.round(newMastery * 10) / 10,
    confidence: Math.min(5, Math.max(1, newConfidence)),
    accuracy: Math.round(newAccuracy * 10) / 10,
    questionsAttempted: newQuestionsAttempted,
    questionsCorrect: newQuestionsCorrect,
    revisionCount:
      feedback.status === 'completed'
        ? current.revisionCount + 1
        : current.revisionCount,
    failureCount:
      sessionScore < 40
        ? current.failureCount + 1
        : current.failureCount,
  }
}

/**
 * Calculate knowledge decay for topics not studied recently
 * Returns the estimated current mastery after decay
 */
export function applyKnowledgeDecay(mastery: number, daysSinceStudy: number): number {
  if (daysSinceStudy <= 1) return mastery
  if (daysSinceStudy <= 3) return mastery * 0.99
  if (daysSinceStudy <= 7) return mastery * 0.97
  if (daysSinceStudy <= 14) return mastery * 0.94
  if (daysSinceStudy <= 30) return mastery * 0.88
  if (daysSinceStudy <= 60) return mastery * 0.80
  return mastery * 0.70
}

/**
 * Get mastery level label
 */
export function getMasteryLabel(mastery: number): { label: string; color: string } {
  if (mastery >= 90) return { label: 'Expert', color: '#2ed573' }
  if (mastery >= 75) return { label: 'Advanced', color: '#00d4aa' }
  if (mastery >= 55) return { label: 'Intermediate', color: '#6c63ff' }
  if (mastery >= 35) return { label: 'Developing', color: '#ff8c42' }
  if (mastery >= 15) return { label: 'Beginner', color: '#ff4757' }
  return { label: 'Not started', color: '#44445a' }
}
