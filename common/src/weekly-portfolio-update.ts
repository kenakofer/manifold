import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/weekly-portfolio-update.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/weekly-portfolio-update.ts'
import { ContractMetric } from './contract-metric'

export type WeeklyPortfolioUpdate = {
  id: string
  userId: string
  contractMetrics: ContractMetric[]
  weeklyProfit: number
  rangeEndDateSlug: string // format yyyy-m-d
  createdTime?: number
}

export type WeeklyPortfolioUpdateOGCardProps = {
  creatorName: string
  creatorUsername: string
  creatorAvatarUrl: string
  weeklyProfit: string
  points: string // JSON.stringify {x:number, y:number}[]
}
