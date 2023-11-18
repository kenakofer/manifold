import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logIndent, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/json.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/json.ts'
export const safeJsonParse = (json: string | undefined | null) => {
  try {
    return JSON.parse(json ?? '') 
  } catch (e) {
    return null
  }
}
