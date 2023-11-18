import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logIndent, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/liquidity-provision.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/liquidity-provision.ts'
import { User } from "./user"

export type LiquidityProvision = {
  id: string
  userId: string
  contractId: string
  createdTime: number
  isAnte?: boolean

  amount: number // Ṁ quantity

  liquidity: number // change in constant k after provision

  // For cpmm-1:
  pool?: { [outcome: string]: number } // pool shares before provision
}
