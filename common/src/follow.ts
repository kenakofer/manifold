import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/follow.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/follow.ts'
export type Follow = {
  userId: string
  timestamp: number
}

export type ContractFollow = {
  id: string // user id
  createdTime: number
}
