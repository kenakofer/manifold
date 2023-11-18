import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logIndent, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/fees.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/fees.ts'
export const FLAT_TRADE_FEE = 0.25
export const FLAT_COMMENT_FEE = 1

export const PLATFORM_FEE = 0
export const CREATOR_FEE = 0
export const LIQUIDITY_FEE = 0

export const DPM_PLATFORM_FEE = 0.0
export const DPM_CREATOR_FEE = 0.0
export const DPM_FEES = DPM_PLATFORM_FEE + DPM_CREATOR_FEE

export type Fees = {
  creatorFee: number
  platformFee: number
  liquidityFee: number
}

export const noFees: Fees = {
  creatorFee: 0,
  platformFee: 0,
  liquidityFee: 0,
}
