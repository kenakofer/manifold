import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/stonk.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/stonk.ts'
import { StonkContract } from './contract'

export const STONK_YES = 'BUY'
export const STONK_NO = 'SHORT'
export const STONK_INITIAL_PROB = 50

const DEFAULT_STONK_MULTIPLIER = 500
// Doesn't seem necessary to show the max as *stocks* should be unbounded
/*WRAPPED*/ export const _getStonkPriceMax = () => {
  return Math.round(getStonkPriceAtProb({} as StonkContract, 1))
}
/*LOG2   */ export const getStonkPriceMax = logCall('Entering ' + codeUrl('getStonkPriceMax()', github_file_url, 9), _getStonkPriceMax);

// TODO: remove unused contract param if we ever settle on a pricing mechanism
/*WRAPPED*/ export const _getStonkPriceAtProb = (contract: StonkContract, prob: number) => {
  const cappedProb = Math.min(Math.max(prob, 0.0001), 0.9999)
  const logTerm = Math.log(cappedProb / (1 - cappedProb))
  const maxTerm = Math.max(logTerm, cappedProb)
  const stonkPrice = maxTerm * DEFAULT_STONK_MULTIPLIER
  return stonkPrice
}
/*LOG2   */ export const getStonkPriceAtProb = logCall('Entering ' + codeUrl('getStonkPriceAtProb()', github_file_url, 14), _getStonkPriceAtProb);

/*WRAPPED*/ export const _getStonkDisplayShares = (
  contract: StonkContract,
  shares: number,
  precision?: number
) => {
  if (precision !== undefined) {
    return Number(
      (Math.floor(shares) / getStonkPriceAtProb(contract, 1)).toPrecision(2)
    )
  }
  return Number(
    (Math.floor(shares) / getStonkPriceAtProb(contract, 1)).toFixed(5)
  )
}
/*LOG2   */ export const getStonkDisplayShares = logCall('Entering ' + codeUrl('getStonkDisplayShares()', github_file_url, 22), _getStonkDisplayShares);

/*WRAPPED*/ export const _getSharesFromStonkShares = (
  contract: StonkContract,
  displayShares: number,
  totalShares: number
) => {
  const stonkShares = displayShares * getStonkPriceAtProb(contract, 1)
  if (Math.abs(totalShares - stonkShares) < 1) {
    return totalShares
  }
  return stonkShares
}
/*LOG2   */ export const getSharesFromStonkShares = logCall('Entering ' + codeUrl('getSharesFromStonkShares()', github_file_url, 37), _getSharesFromStonkShares);
