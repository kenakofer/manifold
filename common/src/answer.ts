const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/answer.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/answer.ts'
import { resolution } from './contract'

export type Answer = {
  id: string
  index: number // Order of the answer in the list
  contractId: string
  userId: string
  text: string
  createdTime: number

  // Mechanism props
  poolYes: number // YES shares
  poolNo: number // NO shares
  prob: number // Computed from poolYes and poolNo.
  totalLiquidity: number // for historical reasons, this the total subsidy amount added in M
  subsidyPool: number // current value of subsidy pool in M

  // Is this 'Other', the answer that represents all other answers, including answers added in the future.
  isOther?: boolean

  resolution?: resolution
  resolutionTime?: number
  resolutionProbability?: number
}

export type DpmAnswer = {
  id: string
  number: number
  contractId: string
  createdTime: number

  userId: string
  username: string
  name: string
  avatarUrl?: string

  text: string
}

export const MAX_ANSWER_LENGTH = 240

export const MAX_ANSWERS = 100
