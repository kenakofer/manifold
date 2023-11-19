import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/antes.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/antes.ts'
declare global { interface Window { logger: NestedLogger; } }

import { Bet } from './bet'
import {
  CPMMBinaryContract,
  DpmMultipleChoiceContract,
  CPMMMultiContract,
} from './contract'
import { User } from './user'
import { LiquidityProvision } from './liquidity-provision'
import { noFees } from './fees'
import { DpmAnswer } from './answer'
import { removeUndefinedProps } from './util/object'

export const HOUSE_LIQUIDITY_PROVIDER_ID = 'IPTOzEqrpkWmEzh6hwvAyY9PqFb2' // @ManifoldMarkets' id
export const DEV_HOUSE_LIQUIDITY_PROVIDER_ID = '94YYTk1AFWfbWMpfYcvnnwI1veP2' // @ManifoldMarkets' id
export const UNIQUE_BETTOR_LIQUIDITY_AMOUNT = 20

type NormalizedBet<T extends Bet = Bet> = Omit<
  T,
  'userAvatarUrl' | 'userName' | 'userUsername'
>

/*WRAPPED*/ export function _getCpmmInitialLiquidity(
  provider: User,
  contract: CPMMBinaryContract | CPMMMultiContract,
  anteId: string,
  amount: number
) {
  const { createdTime, mechanism } = contract

  const pool = mechanism === 'cpmm-1' ? { YES: 0, NO: 0 } : undefined

  const lp: LiquidityProvision = removeUndefinedProps({
    id: anteId,
    userId: provider.id,
    contractId: contract.id,
    createdTime,
    isAnte: true,

    amount: amount,
    liquidity: amount,
    pool,
  })

  return lp
}
/*LOG2   */ export const getCpmmInitialLiquidity = logCall('Entering ' + codeUrl('getCpmmInitialLiquidity()', github_file_url, 22), _getCpmmInitialLiquidity);

/*WRAPPED*/ export function _getMultipleChoiceAntes(
  creator: User,
  contract: DpmMultipleChoiceContract,
  answers: string[],
  betDocIds: string[]
) {
  const { totalBets, totalShares } = contract
  const amount = totalBets['0']
  const shares = totalShares['0']
  const p = 1 / answers.length

  const { createdTime } = contract

  const bets: NormalizedBet[] = answers.map((answer, i) => ({
    id: betDocIds[i],
    userId: creator.id,
    contractId: contract.id,
    amount,
    shares,
    outcome: i.toString(),
    probBefore: p,
    probAfter: p,
    createdTime,
    isAnte: true,
    isRedemption: false,
    isChallenge: false,
    fees: noFees,
    visibility: contract.visibility,
  }))

  const { username, name, avatarUrl } = creator

  const answerObjects: DpmAnswer[] = answers.map((answer, i) => ({
    id: i.toString(),
    number: i,
    contractId: contract.id,
    createdTime,
    userId: creator.id,
    username,
    name,
    avatarUrl,
    text: answer,
  }))

  return { bets, answerObjects }
}
/*LOG2   */ export const getMultipleChoiceAntes = logCall('Entering ' + codeUrl('getMultipleChoiceAntes()', github_file_url, 47), _getMultipleChoiceAntes);
