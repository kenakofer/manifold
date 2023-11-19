import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/boost.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/boost.ts'
// number normal markets to show between boosted markets
export const AD_PERIOD = 6

export const AD_RATE_LIMIT = 10 * 1000 // 10 seconds

// cost in mana
export const DEFAULT_AD_COST_PER_VIEW = 10
export const MIN_AD_COST_PER_VIEW = 10
export const AD_REDEEM_REWARD = 3
