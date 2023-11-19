import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/contract-metric.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/contract-metric.ts'
export type ContractMetric = {
  id: number
  contractId: string
  from:
    | {
        [period: string]: {
          profit: number
          profitPercent: number
          invested: number
          prevValue: number
          value: number
        }
      }
    | undefined
  hasNoShares: boolean
  hasShares: boolean
  hasYesShares: boolean
  invested: number
  loan: number
  maxSharesOutcome: string | null
  payout: number
  profit: number
  profitPercent: number
  totalShares: {
    [outcome: string]: number
  }
  userId: string
  userUsername: string
  userName: string
  userAvatarUrl: string
  lastBetTime: number
  answerId: string | null
}
