const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/contract-params.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/contract-params.ts'
import {
  Contract,
  MaybeAuthedContractParams,
} from './contract'
import { filterBets, getTotalBetCount, BetDictionary } from './playground/bets'
import {
  ContractMetricsDictionary,
  getContractMetricsCount,
} from './playground/contract-metrics'
import { removeUndefinedProps } from './util/object'
import { Bet } from './bet'

export async function getContractParams(
  cm_dict: ContractMetricsDictionary,
  bet_dict: BetDictionary,
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
    totalPositions,
  ] = await Promise.all([
    true,
    hasMechanism ? getTotalBetCount(bet_dict, contract.id) : 0,
    hasMechanism
      ? filterBets(bet_dict, {
          contractId: contract.id,
          limit: 100,
          order: 'desc',
          filterAntes: true,
          filterRedemptions: true,
        })
      : ([] as Bet[]),
    isCpmm1 || isMulti ? getContractMetricsCount(cm_dict, contract.id) : 0,
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
      totalPositions,
      totalBets,
    }),
  }
}
