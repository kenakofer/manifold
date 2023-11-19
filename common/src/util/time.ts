import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/time.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/time.ts'
export const MINUTE_MS = 60 * 1000
export const HOUR_MS = 60 * MINUTE_MS
export const DAY_MS = 24 * HOUR_MS
export const WEEK_MS = 7 * DAY_MS
export const MONTH_MS = 30 * DAY_MS
export const YEAR_MS = 365 * DAY_MS

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))
