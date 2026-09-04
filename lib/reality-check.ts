/**
 * Reality Check Engine
 * Generates context-aware, honest accountability messages.
 * Styles: savage (Hinglish/English brutal honesty) | motivational | funny | gentle
 */

export interface RealityCheckContext {
  userName: string
  style: 'savage' | 'motivational' | 'funny' | 'gentle' | string
  currentStreak: number
  missedSessionsThisWeek: number
  hasActiveRelaxation: boolean
  relaxationType?: string
  relaxationReason?: string
  topicsAssessedCount: number
  totalTopicsCount: number
  gateReadiness: number | null
  gateTarget: number
  weakTopicsCount: number
}

export interface RealityCheckResult {
  headline: string
  message: string
  subtext: string
  tone: 'warning' | 'danger' | 'info' | 'success'
  badge: string
}

export function generateRealityCheck(ctx: RealityCheckContext): RealityCheckResult {
  const {
    userName,
    style,
    currentStreak,
    missedSessionsThisWeek,
    hasActiveRelaxation,
    relaxationReason,
    topicsAssessedCount,
    gateReadiness,
    gateTarget,
    weakTopicsCount,
  } = ctx

  // 1. If currently in an approved relaxation / exam break
  if (hasActiveRelaxation) {
    return {
      headline: '⏸ Approved Strategic Pause',
      message: `Relaxation period active: "${relaxationReason || 'Semester Exams'}". Your streak is frozen and protected from decay.`,
      subtext: 'Focus fully on your college exams. The OS will automatically generate your comeback schedule once this break ends.',
      tone: 'info',
      badge: 'Protected',
    }
  }

  // 2. Unassessed / Fresh Onboarding
  if (topicsAssessedCount === 0) {
    if (style === 'savage') {
      return {
        headline: 'Aukat Check: Zero Data',
        message: `${userName}, self-rating se IIT nahi nikalta. Abhi tak ek bhi real question attempt nahi kiya tune.`,
        subtext: 'Mastery is strictly 0% until you solve real problems. Start block 1 now.',
        tone: 'warning',
        badge: 'Zero Calibration',
      }
    }
    return {
      headline: 'Fresh Baseline Needed',
      message: `${userName}, all mastery percentages are at zero. Complete your first study block and quiz to build real data.`,
      subtext: 'Consistent diagnostic sessions will reveal your true strengths.',
      tone: 'info',
      badge: 'Unassessed',
    }
  }

  // 3. High missed sessions (Dangerous drift)
  if (missedSessionsThisWeek >= 3) {
    if (style === 'savage') {
      return {
        headline: 'Reality Check: Target Chhut Raha Hai',
        message: `Hafta khatam hone ko hai aur ${missedSessionsThisWeek} sessions skip ho chuke hain. GATE ${gateTarget}+ ka sapna aise hi drop hota hai.`,
        subtext: 'Overthinking band karo. Next available slot me 45 min lock karo.',
        tone: 'danger',
        badge: 'Red Alert',
      }
    } else if (style === 'funny') {
      return {
        headline: 'Bhai Kya Chal Raha Hai?',
        message: `${missedSessionsThisWeek} sessions missed this week. LeetCode and GATE servers are wondering if you switched to commerce.`,
        subtext: 'One 30-minute block will save your momentum today.',
        tone: 'danger',
        badge: 'Ghost Mode',
      }
    } else {
      return {
        headline: 'Momentum Slipping',
        message: `You have missed ${missedSessionsThisWeek} study sessions this week. Reclaim your focus today with a single focused block.`,
        subtext: 'Discipline is choosing between what you want now and what you want most.',
        tone: 'danger',
        badge: 'Action Required',
      }
    }
  }

  // 4. Multiple weak topics lingering
  if (weakTopicsCount >= 3) {
    if (style === 'savage') {
      return {
        headline: 'Weak Areas Pile-up',
        message: `${weakTopicsCount} topics 40% se neeche baithe hain. Inko ignore karke naye chapters padhna self-sabotage hai.`,
        subtext: 'Fix the weak foundation before rushing forward.',
        tone: 'warning',
        badge: 'Fix Foundation',
      }
    }
    return {
      headline: 'Critical Review Needed',
      message: `You have ${weakTopicsCount} topics below 40% mastery. Scheduled revisions are prioritized to address these gaps.`,
      subtext: 'Address weak fundamentals to prevent concept bottlenecks later.',
      tone: 'warning',
      badge: 'Review Gaps',
    }
  }

  // 5. Solid streak & healthy momentum
  if (currentStreak >= 5) {
    if (style === 'savage') {
      return {
        headline: 'Dhyan Mat Bhatkao',
        message: `${currentStreak}-day streak badhiya hai, par hava me mat aao. Consistency over excitement — keep grinding.`,
        subtext: 'Maintain this discipline through this week.',
        tone: 'success',
        badge: 'On Track',
      }
    }
    return {
      headline: 'Momentum Compounding',
      message: `Strong work maintaining a ${currentStreak}-day streak! Your retention curve is stabilizing.`,
      subtext: 'Keep the pace steady without burning out.',
      tone: 'success',
      badge: `${currentStreak} Days`,
    }
  }

  // 6. Default honest baseline
  return {
    headline: 'Stay Grounded',
    message: `Every 1% mastery gain here is backed by real questions and active recall. Respect the process.`,
    subtext: `Target: GATE ${gateTarget}+ & Systems Mastery.`,
    tone: 'info',
    badge: 'System Active',
  }
}
