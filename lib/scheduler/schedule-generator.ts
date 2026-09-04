/**
 * Schedule Generator
 * Builds a concrete daily schedule from ranked topics
 */

import type { TopicPriorityResult } from './priority-engine'

export interface ScheduleWindow {
  startTime: string // "19:00"
  endTime: string   // "23:00"
}

export interface GeneratedBlock {
  order: number
  startTime: string
  endTime: string
  durationMinutes: number
  blockType: 'study' | 'break' | 'revision'
  label: string
  title: string
  description?: string
  topicId?: string
  activityType?: string
  priorityScore: number
  reasonJson: string
}

interface BreakConfig {
  after: number   // minutes of study before break
  duration: number // break duration in minutes
}

const BREAK_RULES: BreakConfig[] = [
  { after: 60, duration: 15 },
  { after: 90, duration: 20 },
  { after: 120, duration: 25 },
]

function getBreakDuration(studyMinutes: number): number {
  for (const rule of BREAK_RULES.reverse()) {
    if (studyMinutes >= rule.after) return rule.duration
  }
  return 10
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const totalMinutes = minutes % (24 * 60)
  const h = Math.floor(totalMinutes / 60) % 24
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Generate a daily schedule from ranked topics and available time windows
 */
export function generateDailySchedule(
  rankedTopics: TopicPriorityResult[],
  windows: ScheduleWindow[],
  availableMinutes: number,
  energyLevel: 'low' | 'normal' | 'high'
): GeneratedBlock[] {
  const blocks: GeneratedBlock[] = []
  let order = 0
  let totalStudyMinutes = 0
  let studySinceLastBreak = 0
  let topicIndex = 0

  // Adjust available time for energy level
  const effectiveMinutes =
    energyLevel === 'low' ? Math.min(availableMinutes, 120) :
    energyLevel === 'high' ? availableMinutes :
    availableMinutes

  for (const window of windows) {
    let currentMinutes = timeToMinutes(window.startTime)
    const windowEnd = timeToMinutes(window.endTime)
    // Handle windows that cross midnight
    const windowDuration = windowEnd > currentMinutes
      ? windowEnd - currentMinutes
      : (24 * 60 - currentMinutes) + windowEnd

    let windowUsed = 0

    while (
      windowUsed < windowDuration &&
      totalStudyMinutes < effectiveMinutes &&
      topicIndex < rankedTopics.length
    ) {
      const topic = rankedTopics[topicIndex]
      const remainingWindow = windowDuration - windowUsed
      const remainingTotal = effectiveMinutes - totalStudyMinutes

      // Determine session duration
      let sessionMinutes = Math.min(
        topic.suggestedMinutes,
        remainingWindow - 15, // leave room for break
        remainingTotal
      )

      if (sessionMinutes < 20) break // Not enough time for a meaningful session

      // Add study block
      blocks.push({
        order: order++,
        startTime: minutesToTime(currentMinutes),
        endTime: minutesToTime(currentMinutes + sessionMinutes),
        durationMinutes: sessionMinutes,
        blockType: 'study',
        label: topic.label,
        title: topic.topicName,
        description: `${topic.subjectName} — ${topic.activityType}`,
        topicId: topic.topicId,
        activityType: topic.activityType,
        priorityScore: topic.priorityScore,
        reasonJson: JSON.stringify(topic.reasons),
      })

      currentMinutes += sessionMinutes
      windowUsed += sessionMinutes
      totalStudyMinutes += sessionMinutes
      studySinceLastBreak += sessionMinutes
      topicIndex++

      // Add break if needed
      const shouldBreak =
        studySinceLastBreak >= 55 &&
        windowUsed < windowDuration - 10 &&
        totalStudyMinutes < effectiveMinutes

      if (shouldBreak) {
        const breakDuration = getBreakDuration(studySinceLastBreak)
        const actualBreak = Math.min(breakDuration, windowDuration - windowUsed)

        if (actualBreak >= 5) {
          const breakEmoji = studySinceLastBreak >= 90 ? '🍿' : '☕'
          blocks.push({
            order: order++,
            startTime: minutesToTime(currentMinutes),
            endTime: minutesToTime(currentMinutes + actualBreak),
            durationMinutes: actualBreak,
            blockType: 'break',
            label: `${breakEmoji} BREAK`,
            title: studySinceLastBreak >= 90 ? 'Long Break' : 'Short Break',
            description: 'Rest, hydrate, stretch',
            priorityScore: 0,
            reasonJson: '[]',
          })

          currentMinutes += actualBreak
          windowUsed += actualBreak
          studySinceLastBreak = 0
        }
      }
    }

    // Add final revision block if there's time and topics were covered
    if (blocks.filter(b => b.blockType === 'study').length > 0 && windowDuration - windowUsed >= 15) {
      const coveredTopicIds = blocks
        .filter(b => b.topicId)
        .map(b => b.topicId!)

      const revMinutes = Math.min(20, windowDuration - windowUsed)
      blocks.push({
        order: order++,
        startTime: minutesToTime(currentMinutes),
        endTime: minutesToTime(currentMinutes + revMinutes),
        durationMinutes: revMinutes,
        blockType: 'revision',
        label: '⚡ Quick Revision',
        title: 'Final Revision',
        description: 'Review key concepts from today',
        priorityScore: 5,
        reasonJson: JSON.stringify(['Consolidate today\'s learning']),
      })
    }
  }

  return blocks
}

/**
 * Get activity variety for a sequence of blocks
 * Ensures no more than 2 consecutive passive learning blocks
 */
export function ensureVariety(blocks: GeneratedBlock[]): GeneratedBlock[] {
  const studyBlocks = blocks.filter(b => b.blockType === 'study')
  const activityTypes = studyBlocks.map(b => b.activityType)

  // Check for consecutive passive learning
  let consecutiveLearning = 0
  for (let i = 0; i < activityTypes.length; i++) {
    if (activityTypes[i] === 'learn') {
      consecutiveLearning++
      if (consecutiveLearning >= 2 && i + 1 < studyBlocks.length) {
        // Force next to be practice
        studyBlocks[i + 1].activityType = 'practice'
        studyBlocks[i + 1].label = '⚔️ Problem Battle'
        consecutiveLearning = 0
      }
    } else {
      consecutiveLearning = 0
    }
  }

  return blocks
}

/**
 * Calculate burnout risk score (0-10)
 */
export function calculateBurnoutRisk(
  consecutiveDays: number,
  weeklyHours: number,
  recentOvertimeCount: number,
  avgSessionLength: number
): number {
  let risk = 0

  if (consecutiveDays >= 14) risk += 4
  else if (consecutiveDays >= 7) risk += 2

  if (weeklyHours >= 40) risk += 3
  else if (weeklyHours >= 30) risk += 2
  else if (weeklyHours >= 20) risk += 1

  if (recentOvertimeCount >= 4) risk += 2
  else if (recentOvertimeCount >= 2) risk += 1

  if (avgSessionLength >= 120) risk += 1

  return Math.min(10, risk)
}

/**
 * Get a reality check message based on missed sessions
 */
export function getRealityCheck(
  missedCount: number,
  style: string,
  userName: string
): string | null {
  if (missedCount === 0) return null
  if (missedCount < 2 && style !== 'savage') return null

  const savageMessages = [
    `Ek din chhoot gaya.\nKoi problem nahi.\nBas isse habit mat bana dena.`,
    `Kal ka kaam aaj bhi pending hai.\nSapna wahi hai, bas execution missing hai.`,
    `Plan banane mein 10 minute.\nFollow karne mein problem?\nEngineer banna hai ya timetable collect karna hai?`,
    `Motivation ka wait karega toh calendar retire ho jayega.\nKaam kar.`,
    `Ek din chhod diya toh kuch nahi hua.\nHar din chhod diya toh kuch nahi hoga.`,
    `Future wala tu,\naaj wale tere decisions ka bill bharega.`,
    `Kal bhi reschedule.\nAaj bhi reschedule.\nBhai schedule banana hai ya follow bhi karna hai?`,
  ]

  const gentleMessages = [
    `You missed a session. No worries — let's get back on track today.`,
    `Small setback. The goal is still there. Start with just one task today.`,
    `Consistency beats perfection. Even 30 minutes today counts.`,
  ]

  const motivationalMessages = [
    `Every expert was once a beginner who refused to give up. Resume today.`,
    `Missing one session doesn't define you. Getting back does.`,
    `The best time to restart was yesterday. Second best time is now.`,
  ]

  const messages =
    style === 'savage' ? savageMessages :
    style === 'motivational' ? motivationalMessages :
    gentleMessages

  return messages[missedCount % messages.length]
}
