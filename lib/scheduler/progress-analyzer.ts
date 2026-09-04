/**
 * Progress Analyzer
 * Analyzes user progress trends and generates insights
 */

export interface SubjectProgress {
  subjectId: string
  subjectName: string
  averageMastery: number
  topicsTotal: number
  topicsStudied: number
  topicsWeak: number // mastery < 40
  weeklyGain: number
  trend: 'improving' | 'stable' | 'declining'
}

export interface WeeklyInsights {
  totalStudyMinutes: number
  avgDailyMinutes: number
  daysStudied: number
  consistencyScore: number // 0-100
  accuracyTrend: number   // delta
  masteryGained: number
  strongestSubject: string
  weakestSubject: string
  biggestImprovement: { subject: string; gain: number }
  backlogCount: number
  burnoutRisk: number
}

/**
 * Calculate consistency score based on days studied vs planned days
 */
export function calculateConsistencyScore(
  daysStudied: number,
  plannedDays: number,
  streakDays: number
): number {
  if (plannedDays === 0) return 0
  const completionRate = (daysStudied / plannedDays) * 70
  const streakBonus = Math.min(30, streakDays * 2)
  return Math.min(100, Math.round(completionRate + streakBonus))
}

/**
 * Determine trend for a subject based on mastery history
 */
export function determineTrend(masteryHistory: number[]): 'improving' | 'stable' | 'declining' {
  if (masteryHistory.length < 2) return 'stable'

  const recent = masteryHistory.slice(-3)
  const older = masteryHistory.slice(-6, -3)

  if (older.length === 0) return 'stable'

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length

  const delta = recentAvg - olderAvg
  if (delta > 2) return 'improving'
  if (delta < -2) return 'declining'
  return 'stable'
}

/**
 * Calculate GATE readiness percentage
 */
export function calculateGateReadiness(
  subjectProgress: SubjectProgress[],
  gateWeights: Record<string, number>
): number {
  let weightedSum = 0
  let totalWeight = 0

  for (const subject of subjectProgress) {
    const weight = gateWeights[subject.subjectName] || 0.05
    weightedSum += subject.averageMastery * weight
    totalWeight += weight
  }

  if (totalWeight === 0) return 0
  return Math.round(weightedSum / totalWeight)
}

/**
 * GATE subject weights (approximate based on official GATE CS syllabus)
 */
export const GATE_WEIGHTS: Record<string, number> = {
  'Data Structures & Algorithms': 0.15,
  'Operating Systems': 0.12,
  'Computer Networks': 0.10,
  'DBMS': 0.12,
  'Computer Organization & Architecture': 0.10,
  'Theory of Computation': 0.10,
  'Compiler Design': 0.08,
  'Programming': 0.08,
  'Software Engineering': 0.05,
  'System Design': 0.05,
  'ML & AI': 0.05,
}

/**
 * Generate comeback schedule metrics after relaxation period
 */
export function planRelaxationRecovery(
  daysMissed: number,
  previousWeakTopics: string[],
  availableMinutes: number
): {
  knowledgeDecayEstimate: number
  priorityTopics: string[]
  recommendedLoad: number // percentage of normal load
  gradualRampupDays: number
} {
  const decayPerDay = 0.3 // percent mastery decay per day
  const knowledgeDecayEstimate = Math.min(15, daysMissed * decayPerDay)

  // First day: 50% load, ramp up over 3-5 days
  const recommendedLoad =
    daysMissed <= 3 ? 75 :
    daysMissed <= 7 ? 60 :
    50

  const gradualRampupDays =
    daysMissed <= 3 ? 2 :
    daysMissed <= 7 ? 3 : 5

  return {
    knowledgeDecayEstimate,
    priorityTopics: previousWeakTopics.slice(0, 3),
    recommendedLoad,
    gradualRampupDays,
  }
}
