import {
  Contract,
  MaybeAuthedContractParams,
} from './contract'
import { getBets, getTotalBetCount } from './supabase/bets'
import {
  getCPMMContractUserContractMetrics,
  getContractMetricsCount,
} from './supabase/contract-metrics'
import { removeUndefinedProps } from './util/object'
import { Bet } from './bet'

export async function getContractParams(
  contract: Contract,
  checkAccess?: boolean,
  userId?: string | undefined
): Promise<MaybeAuthedContractParams> {
  const isCpmm1 = contract.mechanism === 'cpmm-1'
  const hasMechanism = contract.mechanism !== 'none'
  const isMulti = contract.mechanism === 'cpmm-multi-1'
  const isBinaryDpm =
    contract.outcomeType === 'BINARY' && contract.mechanism === 'dpm-2'

  const [
    canAccessContract,
    totalBets,
    betsToPass,
    userPositionsByOutcome,
    totalPositions,
  ] = await Promise.all([
    true,
    hasMechanism ? getTotalBetCount(contract.id) : 0,
    hasMechanism
      ? getBets({
          contractId: contract.id,
          limit: 100,
          order: 'desc',
          filterAntes: true,
          filterRedemptions: true,
        })
      : ([] as Bet[]),
    isCpmm1
      ? getCPMMContractUserContractMetrics(contract.id, 100, null)
      : {},
    isCpmm1 || isMulti ? getContractMetricsCount(contract.id) : 0,
    // TODO: Should only send bets that are replies to comments we're sending, and load the rest client side
  ])
  if (!canAccessContract) {
    return contract && !contract.deleted
      ? {
          state: 'not authed',
          slug: contract.slug,
          visibility: contract.visibility,
        }
      : { state: 'not found' }
  }

  return {
    state: 'authed',
    params: removeUndefinedProps({
      outcomeType: contract.outcomeType,
      contract,
      historyData: {
        bets: betsToPass,
        points: [],
      },
      userPositionsByOutcome,
      totalPositions,
      totalBets,
    }),
  }
}
