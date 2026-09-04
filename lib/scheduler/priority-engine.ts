/**
 * Priority Engine
 * Calculates which topics to study next based on multiple weighted factors
 */

import { getRevisionUrgency } from './revision-engine'
import { applyKnowledgeDecay } from './mastery-engine'

export interface TopicPriorityInput {
  topicId: string
  topicName: string
  subjectName: string
  mastery: number         // 0-100
  confidence: number      // 1-5
  accuracy: number        // 0-100
  importance: number      // 1-5
  gateRelevance: number   // 1-5
  careerRelevance: number // 1-5
  difficulty: number      // 1-5
  estimatedMinutes: number
  lastStudiedAt: Date | null
  nextRevisionDue: Date | null
  revisionInterval: number
  hasPrerequisitesMet: boolean
  prerequisiteImpact: number // how many topics this unlocks (0-10)
  collegeDeadlineUrgency: number // 0-10
  hasDeadlineToday: boolean
  isUnassessed?: boolean
  activityType?: string
}

export interface TopicPriorityResult {
  topicId: string
  topicName: string
  subjectName: string
  priorityScore: number
  reasons: string[]
  suggestedMinutes: number
  activityType: string
  label: string
  estimatedMinutes: number
}

/**
 * Calculate priority score for a topic
 * Higher score = should be studied sooner
 */
export function calculatePriority(
  topic: TopicPriorityInput,
  userContext: {
    energyLevel: 'low' | 'normal' | 'high'
    availableMinutes: number
    gateTargetScore: number
    careerPaths: string[]
    recentBurnoutRisk: number // 0-10
    consecutiveStudyDays: number
  }
): TopicPriorityResult {
  const reasons: string[] = []
  let score = 0

  // ── 0. UNASSESSED BASELINE CHECK ──
  if (topic.isUnassessed) {
    reasons.push(`📋 Not yet assessed — first study session will calibrate your ${topic.topicName} baseline`)
    score += 15
  }

  // ── 1. WEAKNESS WEIGHT (0-40) ──
  const daysSinceStudy = topic.lastStudiedAt
    ? Math.floor((Date.now() - topic.lastStudiedAt.getTime()) / 86400000)
    : 999
  const effectiveMastery = applyKnowledgeDecay(topic.mastery, daysSinceStudy)
  const weaknessScore = (1 - effectiveMastery / 100) * 40

  if (!topic.isUnassessed && effectiveMastery < 20) {
    reasons.push(`🔴 Critical weakness — mastery only ${Math.round(effectiveMastery)}%, immediate attention needed`)
    score += weaknessScore * 1.2
  } else if (!topic.isUnassessed && effectiveMastery < 40) {
    reasons.push(`🟠 Low mastery (${Math.round(effectiveMastery)}%) — this topic is dragging down your average`)
    score += weaknessScore * 1.2
  } else if (!topic.isUnassessed && effectiveMastery < 60) {
    reasons.push(`🟡 Developing mastery (${Math.round(effectiveMastery)}%) — consistent practice will solidify this`)
    score += weaknessScore
  } else {
    score += weaknessScore
  }

  // ── 2. IMPORTANCE (0-20) ──
  const importanceScore = (topic.importance / 5) * 20
  score += importanceScore
  if (topic.importance === 5) {
    reasons.push(`⭐ Core topic (importance 5/5) — mastering this has the highest payoff in ${topic.subjectName}`)
  } else if (topic.importance === 4) {
    reasons.push(`📌 High-importance topic (4/5) — frequently tested in ${topic.subjectName}`)
  }

  // ── 3. GATE RELEVANCE (0-20) ──
  const gateScore = (topic.gateRelevance / 5) * 20
  if (userContext.gateTargetScore >= 700) {
    score += gateScore * 1.4
    if (topic.gateRelevance === 5) reasons.push(`🎯 GATE must-know (relevance 5/5) — high scorers consistently ace this (target: ${userContext.gateTargetScore})`)
    else if (topic.gateRelevance >= 4) reasons.push(`🎯 High GATE relevance (${topic.gateRelevance}/5) — commonly appears in GATE CS papers`)
  } else if (userContext.gateTargetScore >= 600) {
    score += gateScore * 1.3
    if (topic.gateRelevance === 5) reasons.push(`🎯 Critical for GATE (relevance 5/5) — essential for a ${userContext.gateTargetScore}+ score`)
    else if (topic.gateRelevance >= 4) reasons.push(`🎯 GATE-relevant topic (${topic.gateRelevance}/5)`)
  } else {
    score += gateScore
  }

  // ── 4. REVISION URGENCY (0-15) ──
  const revisionUrgency = getRevisionUrgency(topic.nextRevisionDue, topic.revisionInterval)
  const revisionScore = (revisionUrgency / 10) * 15
  score += revisionScore
  if (daysSinceStudy === 999) {
    reasons.push('🆕 Never studied — no spaced repetition cycle started yet')
  } else if (revisionUrgency >= 9) {
    reasons.push(`⏰ Severely overdue — ${daysSinceStudy} days since last study, knowledge decay risk is HIGH`)
  } else if (revisionUrgency >= 7) {
    reasons.push(`⏰ Overdue for revision by ${daysSinceStudy - topic.revisionInterval} days — spaced repetition broken`)
  } else if (revisionUrgency >= 5) {
    reasons.push(`🔁 Revision window open — ${daysSinceStudy} days since last study (interval: ${topic.revisionInterval}d)`)
  }

  // ── 5. PREREQUISITE IMPACT (0-10) ──
  if (!topic.hasPrerequisitesMet) {
    // Penalty for prerequisites not met
    score *= 0.3
    reasons.push('🔒 Prerequisites not met — study foundational topics first to unlock this')
  } else {
    const prereqScore = (topic.prerequisiteImpact / 10) * 10
    score += prereqScore
    if (topic.prerequisiteImpact >= 7) {
      reasons.push(`🔓 Mastering this unlocks ${topic.prerequisiteImpact} dependent topics — high leverage`)
    } else if (topic.prerequisiteImpact >= 4) {
      reasons.push(`🔓 Gateway topic — completing this opens ${topic.prerequisiteImpact} more topics`)
    } else if (topic.prerequisiteImpact >= 2) {
      reasons.push(`🔓 Unlocks ${topic.prerequisiteImpact} dependent topics`)
    }
  }

  // ── 6. DEADLINE URGENCY (0-20) ──
  if (topic.hasDeadlineToday) {
    score += 20
    reasons.push(`🚨 College deadline TODAY — ${topic.topicName} must be done before midnight`)
  } else if (topic.collegeDeadlineUrgency >= 8) {
    score += (topic.collegeDeadlineUrgency / 10) * 10
    reasons.push(`📅 College deadline in 1-2 days — do not skip this`)
  } else if (topic.collegeDeadlineUrgency >= 5) {
    score += (topic.collegeDeadlineUrgency / 10) * 10
    reasons.push(`📅 Upcoming college deadline — urgency ${topic.collegeDeadlineUrgency}/10`)
  } else {
    score += (topic.collegeDeadlineUrgency / 10) * 10
  }

  // ── 7. CAREER RELEVANCE (0-10) ──
  const careerScore = (topic.careerRelevance / 5) * 10
  score += careerScore
  if (topic.careerRelevance === 5 && userContext.careerPaths.length > 0) {
    reasons.push(`💼 Directly relevant to your target tracks: ${userContext.careerPaths.slice(0, 2).join(', ')}`)
  } else if (topic.careerRelevance >= 4 && userContext.careerPaths.length > 0) {
    reasons.push(`💼 High career relevance (${topic.careerRelevance}/5) for your selected tracks`)
  }

  // ── 8. ACCURACY PENALTY ──
  if (topic.accuracy > 0 && topic.accuracy < 40) {
    score *= 1.2
    reasons.push(`❌ Very low accuracy (${Math.round(topic.accuracy)}%) — you need active practice, not just reading`)
  } else if (topic.accuracy > 0 && topic.accuracy < 60) {
    score *= 1.15
    reasons.push(`📉 Below-average accuracy (${Math.round(topic.accuracy)}%) — targeted practice will fix this fast`)
  } else if (topic.accuracy >= 80 && effectiveMastery >= 70) {
    reasons.push(`✅ Strong accuracy (${Math.round(topic.accuracy)}%) — light revision to maintain`)
  }

  // ── 9. DIFFICULTY ADJUSTMENT ──
  if (userContext.energyLevel === 'low' && topic.difficulty >= 4) {
    score *= 0.7
    reasons.push(`😴 Difficulty ${topic.difficulty}/5 — skipped for low-energy slot, try tomorrow with full energy`)
  } else if (userContext.energyLevel === 'high' && topic.difficulty >= 4) {
    score *= 1.1
    reasons.push(`⚡ High energy now — tackling difficulty ${topic.difficulty}/5 while you're in the zone`)
  } else if (userContext.energyLevel === 'low' && topic.difficulty <= 2) {
    reasons.push(`🌙 Easy topic — perfect for a low-energy study session`)
  }

  // ── 10. BURNOUT RISK PENALTY ──
  if (userContext.recentBurnoutRisk >= 8) {
    score *= 0.75
    reasons.push('🔥 High burnout risk detected — only essentials scheduled, recovery is also progress')
  } else if (userContext.recentBurnoutRisk >= 6) {
    score *= 0.85
    reasons.push('⚠️ Elevated burnout risk — lighter load applied to protect consistency')
  }

  // ── 11. EFFORT NORMALIZATION ──
  const effortFactor = Math.max(1, topic.estimatedMinutes / 60)
  score = score / effortFactor

  // Determine activity type based on mastery and context
  const activityType = determineActivityType(topic, userContext.energyLevel)
  const label = getActivityLabel(activityType, topic)

  // Suggested minutes based on mastery and available time
  const suggestedMinutes = calculateSuggestedMinutes(topic, userContext.availableMinutes, activityType)

  return {
    topicId: topic.topicId,
    topicName: topic.topicName,
    subjectName: topic.subjectName,
    priorityScore: Math.round(score * 10) / 10,
    reasons,
    suggestedMinutes,
    activityType,
    label,
    estimatedMinutes: topic.estimatedMinutes,
  }
}

function determineActivityType(
  topic: TopicPriorityInput,
  energyLevel: 'low' | 'normal' | 'high'
): string {
  if (topic.mastery < 20) return 'learn'
  if (topic.mastery < 50) return energyLevel === 'low' ? 'revision' : 'practice'
  if (topic.mastery >= 50 && topic.gateRelevance >= 4) return 'pyq'
  if (topic.mastery >= 70) return 'revision'
  return 'practice'
}

function getActivityLabel(activityType: string, topic: TopicPriorityInput): string {
  const labels: Record<string, string[]> = {
    learn: ['🧠 Deep Dive', '🔥 Boss Fight', '🏹 Weakness Hunt'],
    practice: ['⚔️ Problem Battle', '🧩 Puzzle Mode', '🔍 Debug Mission'],
    pyq: ['🎯 GATE Attack', '🧪 Test Lab', '🏹 Weakness Hunt'],
    revision: ['⚡ Quick Revision', '🧹 Backlog Cleanup', '🔁 Memory Refresh'],
    build: ['🚀 Build Mode', '🛠️ Engineering Mode', '🤖 ML Lab'],
    college: ['📚 College Mission', '⏰ Deadline Sprint', '📝 Study Session'],
  }

  const options = labels[activityType] || labels.learn
  // Pick based on mastery for variety
  const idx = Math.floor(topic.mastery / 35) % options.length
  return options[idx]
}

function calculateSuggestedMinutes(
  topic: TopicPriorityInput,
  availableMinutes: number,
  activityType: string
): number {
  const baseMinutes: Record<string, number> = {
    learn: 60,
    practice: 75,
    pyq: 45,
    revision: 30,
    build: 90,
    college: 60,
  }

  const base = baseMinutes[activityType] || 60

  // Scale based on available time
  if (availableMinutes < 90) return Math.min(base, 45)
  if (availableMinutes < 150) return Math.min(base, 60)
  return base
}

/**
 * Sort topics by priority and return ranked list
 */
export function rankTopics(
  topics: TopicPriorityInput[],
  userContext: Parameters<typeof calculatePriority>[1]
): TopicPriorityResult[] {
  return topics
    .map(t => calculatePriority(t, userContext))
    .sort((a, b) => b.priorityScore - a.priorityScore)
}
