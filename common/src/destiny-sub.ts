import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/destiny-sub.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/destiny-sub.ts'
export type DestinySub = {
  id: string
  createdTime: number
  userId: string
  username: string
  destinyUsername: string
  cost: number
  destinySubId: string
}

export const DESTINY_SUB_COST = 1000
