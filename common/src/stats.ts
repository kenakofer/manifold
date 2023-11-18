import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logIndent, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/stats.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/stats.ts'
export type Stats = {
  startDate: [number]
  dailyActiveUsers: number[]
  dailyActiveUsersWeeklyAvg: number[]
  avgDailyUserActions: number[]
  weeklyActiveUsers: number[]
  monthlyActiveUsers: number[]
  engagedUsers: number[]
  dailySales: number[]
  d1: number[]
  d1WeeklyAvg: number[]
  nd1: number[]
  nd1WeeklyAvg: number[]
  nw1: number[]
  dailyBetCounts: number[]
  dailyContractCounts: number[]
  dailyCommentCounts: number[]
  dailySignups: number[]
  weekOnWeekRetention: number[]
  monthlyRetention: number[]
  dailyActivationRate: number[]
  dailyActivationRateWeeklyAvg: number[]
  manaBetDaily: number[]
  manaBetWeekly: number[]
  manaBetMonthly: number[]
}
