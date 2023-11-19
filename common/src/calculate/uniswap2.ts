import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/calculate/uniswap2.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/calculate/uniswap2.ts'
/*WRAPPED*/ export function _calculatePrice(pool: { [outcome: string]: number }) {
  return pool['M$'] / pool['SHARE']
}
/*LOG2   */ export const calculatePrice = logCall('Entering ' + codeUrl('calculatePrice()', github_file_url, 1), _calculatePrice);

/*WRAPPED*/ export function _calculateShares(
  pool: { [outcome: string]: number },
  mana: number
) {
  // Calculate shares purchasable with this amount of mana
  // Holding the Uniswapv2 constant of k = mana * shares
  return pool['SHARE'] - afterSwap(pool, 'M$', mana)['SHARE']
}
/*LOG2   */ export const calculateShares = logCall('Entering ' + codeUrl('calculateShares()', github_file_url, 5), _calculateShares);

// Returns the new pool after the specified number of tokens are
// swapped into the pool
/*WRAPPED*/ export function _afterSwap(
  pool: { [outcome: string]: number },
  token: 'M$' | 'SHARE',
  amount: number
) {
  const k = pool['M$'] * pool['SHARE']
  const other = token === 'M$' ? 'SHARE' : 'M$'
  const newPool = {
    [token]: pool[token] + amount,
    // TODO: Should this be done in log space for precision?
    [other]: k / (pool[token] + amount),
  }
  // If any of the values in the new pool are invalid (infinite or NaN), throw an error
  if (Object.values(newPool).some((v) => !isFinite(v))) {
    throw new Error('Invalid new pool values: ' + JSON.stringify(newPool))
  }
  return newPool
}
/*LOG2   */ export const afterSwap = logCall('Entering ' + codeUrl('afterSwap()', github_file_url, 16), _afterSwap);

/*WRAPPED*/ export function _calculatePriceAfterBuy(
  pool: { [outcome: string]: number },
  mana: number
) {
  return calculatePrice(afterSwap(pool, 'M$', mana))
}
/*LOG2   */ export const calculatePriceAfterBuy = logCall('Entering ' + codeUrl('calculatePriceAfterBuy()', github_file_url, 35), _calculatePriceAfterBuy);
