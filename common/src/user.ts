import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logIndent, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/user.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/user.ts'

import { DAY_MS } from './util/time'
export type User = {
  id: string
  createdTime: number

  name: string
  username: string
  avatarUrl: string

  // For their user page
  bio?: string
  website?: string
  twitterHandle?: string
  discordHandle?: string

  balance: number
  totalDeposits: number // Total deposits = all mana that enters your account that isnt from profit/losses (seems to be decremented by manalinks, charity donations, creating markets, etc.)

  profitCached: {
    daily: number
    weekly: number
    monthly: number
    allTime: number
  }

  creatorTraders: {
    daily: number
    weekly: number
    monthly: number
    allTime: number
  }

  fractionResolvedCorrectly?: number // Deprecated as of 2023-01-05

  nextLoanCached: number
  /** @deprecated */
  followerCountCached?: number

  homeSections?: string[]

  referredByUserId?: string
  referredByContractId?: string
  referredByGroupId?: string
  shouldShowWelcome?: boolean
  lastBetTime?: number

  currentBettingStreak?: number
  streakForgiveness: number

  hasSeenContractFollowModal?: boolean
  isBannedFromPosting?: boolean
  userDeleted?: boolean
  metricsLastUpdated?: number
  optOutBetWarnings?: boolean
  freeQuestionsCreated?: number
}

export type PrivateUser = {
  id: string // same as User.id
  email?: string
  weeklyTrendingEmailSent: boolean
  weeklyPortfolioUpdateEmailSent: boolean
  manaBonusSent?: boolean
  initialDeviceToken?: string
  initialIpAddress?: string
  apiKey?: string
  twitchInfo?: {
    twitchName: string
    controlToken: string
    botEnabled?: boolean
    needsRelinking?: boolean
  }
  destinySub2Claimed?: boolean
  pushToken?: string
  rejectedPushNotificationsOn?: number
  interestedInPushNotifications?: boolean
  blockedUserIds: string[]
  blockedByUserIds: string[]
  blockedContractIds: string[]
  blockedGroupSlugs: string[]
  hasSeenAppBannerInNotificationsOn?: number
  installedAppPlatforms?: string[]
  discordId?: string
}

export type UserAndPrivateUser = { user: User; privateUser: PrivateUser }
export const MANIFOLD_USER_USERNAME = 'Manifold'
export const MANIFOLD_USER_NAME = 'Manifold'
export const MANIFOLD_AVATAR_URL = 'https://manifold.markets/logo.png'

const MAX_FREE_QUESTIONS = 3
export const DAYS_TO_USE_FREE_QUESTIONS = 3
export const MAX_FREE_QUESTION_VALUE = 250

export const getAvailableBalancePerQuestion = (user: User): number => {
  return (
    user.balance +
    (freeQuestionRemaining(user.freeQuestionsCreated, user.createdTime) > 0
      ? MAX_FREE_QUESTION_VALUE
      : 0)
  )
}

export const marketCreationCosts = (user: User, ante: number) => {
  let amountSuppliedByUser = ante
  let amountSuppliedByHouse = 0
  if (freeQuestionRemaining(user.freeQuestionsCreated, user.createdTime) > 0) {
    amountSuppliedByUser = Math.max(ante - MAX_FREE_QUESTION_VALUE, 0)
    amountSuppliedByHouse = Math.min(ante, MAX_FREE_QUESTION_VALUE)
    window.logger.log(`User had free questions remaining, the house will cover up to ${MAX_FREE_QUESTION_VALUE} mana of the ante.`)
  }
  window.logger.log(`Cost to [user, house]`, [amountSuppliedByUser, amountSuppliedByHouse])
  return { amountSuppliedByUser, amountSuppliedByHouse }
}

export const freeQuestionRemaining = (
  freeQuestionsCreated: number | undefined = 0,
  createdTime: number | undefined
) => {
  if (!createdTime) return 0
  // hide if account less than one hour old
  if (createdTime > Date.now() - 60 * 60 * 1000) {
    window.logger.log(`User is less than one hour old, hiding free questions.`)
    return 0
  }

  const now = getCurrentUtcTime()
  if (freeQuestionsCreated >= MAX_FREE_QUESTIONS) {
    window.logger.log(`User has already created all of their ${MAX_FREE_QUESTIONS} free questions.`)
    return 0
  }
  const daysSinceCreation =
    (now.getTime() - createdTime) / (DAYS_TO_USE_FREE_QUESTIONS * DAY_MS)
  if (daysSinceCreation >= 1) {
    window.logger.log(`User waited too long (>${DAYS_TO_USE_FREE_QUESTIONS} days) to use their free questions.`)
    return 0
  }
  window.logger.log(`User has ${MAX_FREE_QUESTIONS - freeQuestionsCreated} free questions available to use.`)
  return MAX_FREE_QUESTIONS - freeQuestionsCreated
}

export function getCurrentUtcTime(): Date {
  const currentDate = new Date()
  const utcDate = currentDate.toISOString()
  return new Date(utcDate)
}

export const MINUTES_ALLOWED_TO_REFER = 60
