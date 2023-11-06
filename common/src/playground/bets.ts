import { Bet, BetFilter } from '../bet'
import { User } from '../user'
import { getContractBetMetrics } from '../calculate'
import { Contract } from '../contract'
import { chunk, groupBy, maxBy, minBy } from 'lodash'
import { removeUndefinedProps } from '../util/object'

export type BetDictionary = { [key: string]: Bet };

export const CONTRACT_BET_FILTER: BetFilter = {
  filterRedemptions: true,
  filterChallenges: false,
  filterAntes: false,
}

export async function getTotalBetCount(bets: BetDictionary, contractId: string) {
  //// Original for supabase
  //   const { count } = await run(
  //     db
  //       .from('contract_bets')
  //       .select('*', { head: true, count: 'exact' })
  //       .eq('contract_id', contractId)
  //       .eq('is_challenge', false)
  //       .eq('is_redemption', false)
  //       .eq('is_ante', false)
  //   )

  // Filter the bets based on the contractId and is_challenge property
  const filteredBets = Object.values(bets).filter(
      bet => bet.contractId === contractId
      && bet.isChallenge === false
      && bet.isRedemption === false
      && bet.isAnte === false
  );
  const count = filteredBets.length;

  return count as number
}

export function filterBets(bets: BetDictionary, options?: BetFilter) {
  let filteredBets = Object.values(bets);

  if (options?.contractId) {
    // q = q.eq('contract_id', options.contractId)
    filteredBets = filteredBets.filter(bet => bet.contractId === options.contractId)
  }

  if (options?.userId) {
    // q = q.eq('user_id', options.userId)
    filteredBets = filteredBets.filter(bet => bet.userId === options.userId)
  }

  if (options?.afterTime) {
    // q = q.gt('created_time', millisToTs(options.afterTime))

    // @ts-ignore
    filteredBets = filteredBets.filter(bet => bet.createdTime > options.afterTime)
  }
  if (options?.beforeTime) {
    // q = q.lt('created_time', millisToTs(options.beforeTime))

    // @ts-ignore
    filteredBets = filteredBets.filter(bet => bet.createdTime < options.beforeTime)
  }
  if (options?.filterChallenges) {
    // q = q.eq('is_challenge', false)
    filteredBets = filteredBets.filter(bet => bet.isChallenge === false)
  }
  if (options?.filterAntes) {
    // q = q.eq('is_ante', false)
    filteredBets = filteredBets.filter(bet => bet.isAnte === false)
  }
  if (options?.filterRedemptions) {
    // q = q.eq('is_redemption', false)
    filteredBets = filteredBets.filter(bet => bet.isRedemption === false)
  }
  if (options?.isOpenLimitOrder) {
    // q = q.contains('data', { isFilled: false, isCancelled: false })

    // @ts-ignore
    filteredBets = filteredBets.filter(bet => bet.data.isFilled === false && bet.data.isCancelled === false)
  }
  if (options?.limit) {
    // q = q.limit(options.limit)
    filteredBets = filteredBets.slice(0, options.limit)
  }
  return filteredBets
}

export type PositionChangeData = {
  previous: {
    invested: number
    outcome: string
    answerId: string | undefined // undefined for binary contracts
  } | null // null for no position
  current: {
    invested: number
    outcome: string
    answerId: string | undefined // undefined for binary contracts
  } | null // null for no position
  change: number
  startTime: number
  endTime: number
  beforeProb: number
  afterProb: number
}

const IGNORE_ABOVE_PROB = 0.9
const IGNORE_BELOW_PROB = 0.1