import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/love/multiple-choice.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/love/multiple-choice.ts'
export const MultipleChoiceOptions = {
  'Strongly disagree': 0,
  Disagree: 1,
  Neutral: 2,
  Agree: 3,
  'Strongly agree': 4,
}

export const MultipleChoiceColors = [
  'bg-orange-500',
  'bg-orange-400',
  'bg-stone-400',
  'bg-teal-400',
  'bg-teal-600',
]
