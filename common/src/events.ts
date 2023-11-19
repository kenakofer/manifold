import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/events.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/events.ts'
export type UserEvent = {
  name: string
  timestamp: number
}

export type ContractCardView = {
  slug: string
  contractId: string
  creatorId: string
  isPromoted?: boolean
  // Following attributes added by saveUserEvent
  name: 'view market card'
  timestamp: number
}

export type CommentView = {
  contractId: string
  commentId: string
  // Following attributes added by saveUserEvent
  name: 'view comment'
  timestamp: number
}

export type ShareEvent = {
  type: 'copy sharing link'
  url: string
  timestamp: number
  name: ShareEventName
}

const ShareEventNames = [
  'copy market link',
  'copy creator market link',
  'copy dream link',
  'copy group link',
  'copy manalink',
  'copy ad link',
  'copy post link',
  'copy referral link',
  'copy weekly profit link',
  'copy twitch link',
  'copy styles link',
  'copy comment link',
] as const

export type ShareEventName = typeof ShareEventNames[number]
