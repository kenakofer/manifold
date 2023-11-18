const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/backend/functions/src/triggers/on-create-bet.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/backend/functions/src/triggers/on-create-bet.ts'
import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }

// import * as functions from 'firebase-functions'
// import * as admin from 'firebase-admin'
// import { groupBy, keyBy, sumBy } from 'lodash'

import { Bet, LimitBet } from '../bet'
// import {
//   getBettingStreakResetTimeBeforeNow,
//   getContract,
//   getUser,
//   getUserSupabase,
//   getValues,
//   isProd,
//   log,
// } from 'shared/utils'
// import {
//   createBetFillNotification,
//   createBetReplyToCommentNotification,
//   createBettingStreakBonusNotification,
//   createFollowSuggestionNotification,
//   createUniqueBettorBonusNotification,
// } from 'shared/create-notification'
// import { filterDefined } from 'common/util/array'
import { Contract } from '../contract'
import {
  MAX_TRADERS_FOR_BIG_BONUS,
  MAX_TRADERS_FOR_BONUS,
  SMALL_UNIQUE_BETTOR_BONUS_AMOUNT,
  SMALL_UNIQUE_BETTOR_LIQUIDITY,
  UNIQUE_BETTOR_BONUS_AMOUNT,
  UNIQUE_BETTOR_LIQUIDITY,
} from '../economy'
import { User } from '../user'
import { BettingStreakBonusTxn, UniqueBettorBonusTxn } from '../txn'
import {
  addHouseSubsidy,
  addHouseSubsidyToAnswer,
} from '../helpers/add-house-subsidy'
import { BOT_USERNAMES } from '../envs/constants'
import { calculateUserMetrics } from '../calculate-metrics'
import { FLAT_TRADE_FEE } from '../fees'
import { removeUndefinedProps } from '../util/object'
// import { bulkUpdateContractMetrics } from '../helpers/user-contract-metrics'
import { Answer } from '../answer'
import { MINUTE_MS } from '../util/time'

export function onCreateBet(bet: Bet, contract: Contract, bettor: User) {
  window.logger.log('Triggering onCreateBet')
  if (bet.isChallenge) {
    window.logger.log('Exiting onCreateBet because bet is a challenge')
    return
  }

  // TODO not sure if we need the metrics
  // if (bet.shares !== 0) {
  //   updateContractMetrics(contract, [bettor, ...(notifiedUsers ?? [])])
  // }

  // Note: Anything that applies to redemption bets should be above this line.
  if (bet.isRedemption) {
    window.logger.log('Exiting onCreateBet because bet is a redemption')
    return
  } else {
    window.logger.log('bet is not a redemption, continuing')
  }

  const isApiOrBot = bet.isApi || BOT_USERNAMES.includes(bettor.username)
  window.logger.log('bet is not a redemption, continuing')
  if (isApiOrBot) {
    // assess flat fee for bots
    bettor.balance -= FLAT_TRADE_FEE
    bettor.totalDeposits -= FLAT_TRADE_FEE
    if (bet.isApi) return // skip the rest only if it's an API bet
  }

  /**
   *  Handle bonuses, other stuff for non-bot users below:
   */

  giveUniqueBettorAndLiquidityBonus(contract, bettor, bet)

  updateUniqueBettors(contract, bet)
}

const MED_BALANCE_PERCENTAGE_FOR_FEED = 0.005
const MED_BET_SIZE_FOR_FEED = 100

const MIN_BALANCE_PERCENTAGE_FOR_FEED = 0.05
const MIN_BET_SIZE_GIVEN_PERCENTAGE = 20

export const updateUniqueBettors = async (contract: Contract, bet: Bet) => {
  // TODO sub out supabase
  // contract.uniqueBettorCount = supabaseUniqueBettorIds.length
}

export const giveUniqueBettorAndLiquidityBonus = async (
  contract: Contract,
  bettor: User,
  bet: Bet
) => {
  const { answerId, isRedemption } = bet

  const isBot = BOT_USERNAMES.includes(bettor.username)
  const isUnlisted = contract.visibility === 'unlisted'
  const unSubsidized =
    contract.isSubsidized === undefined ? false : !contract.isSubsidized

  const answer =
    answerId && 'answers' in contract
      ? (contract.answers as Answer[]).find((a) => a.id == answerId)
      : undefined
  const answerCreatorId = answer?.userId
  const creatorId = answerCreatorId ?? contract.creatorId
  const isCreator = bettor.id == creatorId

  if (isCreator || isBot || isUnlisted || isRedemption || unSubsidized) return

  // TODO fix once we have uniquebettors available
  // Check if user has already bet previously.
  // if (previousBet) return

  // For bets with answerId (multiple choice), give a bonus for the first bet on each answer.
  // NOTE: this may miscount unique bettors if they place multiple bets quickly b/c of replication delay.

  // TODO maybe put a uniqueBettorIds onto the contract object
   const uniqueBettorIds = []
  // const uniqueBettorIds = answerId
  //   ? await getUniqueBettorIdsForAnswer(contract.id, answerId)
  //   : await getUniqueBettorIds(contract.id)
  // if (!uniqueBettorIds.includes(bettor.id)) uniqueBettorIds.push(bettor.id)

  // Check max bonus exceeded.
  // TODO uncomment
  // if (uniqueBettorIds.length > MAX_TRADERS_FOR_BONUS) return

  // They may still have bet on this previously, use a transaction to be sure
  // we haven't sent creator a bonus already
  const bonusTxnData = removeUndefinedProps({
    contractId: contract.id,
    uniqueNewBettorId: bettor.id,
    answerId,
  })

  const bonusAmount =
    uniqueBettorIds.length > MAX_TRADERS_FOR_BIG_BONUS
      ? SMALL_UNIQUE_BETTOR_BONUS_AMOUNT
      : contract.mechanism === 'cpmm-multi-1'
      ? Math.ceil(UNIQUE_BETTOR_BONUS_AMOUNT / 2)
      : UNIQUE_BETTOR_BONUS_AMOUNT

  const bonusTxn: Omit<
    UniqueBettorBonusTxn,
    'id' | 'createdTime' | 'fromId'
  > = {
    fromType: 'BANK',
    toId: creatorId,
    toType: 'USER',
    amount: bonusAmount,
    token: 'M$',
    category: 'UNIQUE_BETTOR_BONUS',
    description: JSON.stringify(bonusTxnData),
    data: bonusTxnData,
  }

  // TODO maybe transactions on the contract as well?
  // runTxnFromBank(trans, bonusTxn)
  bettor.balance += bonusAmount
  bettor.totalDeposits += bonusAmount

  const subsidy =
    uniqueBettorIds.length <= MAX_TRADERS_FOR_BIG_BONUS
      ? UNIQUE_BETTOR_LIQUIDITY
      : SMALL_UNIQUE_BETTOR_LIQUIDITY

  if (contract.mechanism === 'cpmm-1') {
    addHouseSubsidy(contract, subsidy)
  } else if (contract.mechanism === 'cpmm-multi-1' && answerId) {
    if (
      contract.shouldAnswersSumToOne &&
      (bet.probAfter < 0.15 || bet.probAfter > 0.95)
    ) {
      // There are two ways to subsidize multi answer contracts when they sum to one:
      // 1. Subsidize all answers (and gain efficiency b/c only one answer resolves YES.)
      // 2. Subsidize one answer (and throw away excess YES or NO shares to maintain probability.)
      // The second if preferred if the probability is not extreme, because it increases
      // liquidity in a more traded answer. (Liquidity in less traded or unlikely answers is not that important.)
      addHouseSubsidy(contract, subsidy)
    } else {
      addHouseSubsidyToAnswer(contract, answerId, subsidy)
    }
  }

}

// const updateContractMetrics = async (contract: Contract, users: User[]) => {
//   const metrics = await Promise.all(
//     users.map(async (user) => {
//       const betSnap = await firestore
//         .collection(`contracts/${contract.id}/bets`)
//         .where('userId', '==', user.id)
//         .get()

//       const bets = betSnap.docs.map((doc) => doc.data() as Bet)
//       return calculateUserMetrics(contract, bets, user)
//     })
//   )

//   await bulkUpdateContractMetrics(metrics.flat())
// }