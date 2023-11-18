import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logIndent, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/portfolio-metrics.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/portfolio-metrics.ts'
export type PortfolioMetrics = {
  investmentValue: number
  balance: number
  totalDeposits: number
  loanTotal?: number
  timestamp: number
  userId: string
}
