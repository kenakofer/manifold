import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/calculate-cpmm-multi.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/calculate-cpmm-multi.ts'
import { mapValues, minBy, sumBy } from 'lodash'
import { binarySearch } from './util/algos'

// NOTE: The mechanism defined in this file (cpmm-2 multiple choice) is deprecated!

// TODO: Remove min pool shares. Switch to throwing an error if k invariant is violated.
const MIN_POOL_SHARES = 1e-20

/*WRAPPED*/ export function _getProb(pool: { [outcome: string]: number }, outcome: string) {
  if (pool[outcome] === undefined) throw new Error('Invalid outcome')

  const inverseShareSum = sumBy(Object.values(pool), (value) => 1 / value)
  return 1 / (pool[outcome] * inverseShareSum)
}
/*LOG2   */ export const getProb = logCall('Entering ' + codeUrl('getProb()', github_file_url, 9), _getProb);

/*WRAPPED*/ export function _poolToProbs(pool: { [outcome: string]: number }) {
  const inverseShareSum = sumBy(Object.values(pool), (value) => 1 / value)
  return mapValues(pool, (s) => 1 / (s * inverseShareSum))
}
/*LOG2   */ export const poolToProbs = logCall('Entering ' + codeUrl('poolToProbs()', github_file_url, 16), _poolToProbs);

/*WRAPPED*/ const _getK = (pool: { [outcome: string]: number }) => {
  const values = Object.values(pool)
  return sumBy(values, Math.log)
}
/*LOG2   */ const getK = logCall('Entering ' + codeUrl('getK()', github_file_url, 21), _getK);

/*WRAPPED*/ export const _getLiquidity = (pool: { [outcome: string]: number }) => {
  return Math.exp(getK(pool) / Object.keys(pool).length)
}
/*LOG2   */ export const getLiquidity = logCall('Entering ' + codeUrl('getLiquidity()', github_file_url, 26), _getLiquidity);

/*WRAPPED*/ export function _buy(
  pool: {
    [outcome: string]: number
  },
  outcome: string,
  amount: number
) {
  if (amount < 0) throw new Error('Amount must be non-negative')
  if (pool[outcome] === undefined) throw new Error('Invalid outcome')

  const k = getK(pool)
  const tempPool = mapValues(pool, (s) => s + amount)
  const maxShares = tempPool[outcome]

  delete tempPool[outcome]
  const kMissingOutcome = getK(tempPool)
  const shares = maxShares - Math.exp(k - kMissingOutcome)

  const newShares = maxShares - shares
  tempPool[outcome] = Math.max(MIN_POOL_SHARES, newShares)

  const newPool = tempPool

  return { newPool, shares }
}
/*LOG2   */ export const buy = logCall('Entering ' + codeUrl('buy()', github_file_url, 30), _buy);

/*WRAPPED*/ export function _sell(
  pool: {
    [outcome: string]: number
  },
  outcome: string,
  shares: number
) {
  if (shares < 0) throw new Error('Shares must be non-negative')
  if (pool[outcome] === undefined) throw new Error('Invalid outcome')

  const k = getK(pool)
  const poolWithShares = { ...pool, [outcome]: pool[outcome] + shares }

  const saleAmount = binarySearch(0, shares, (saleAmount) => {
    const poolAfterSale = mapValues(poolWithShares, (s) =>
      Math.max(MIN_POOL_SHARES, s - saleAmount)
    )
    const kAfterSale = getK(poolAfterSale)
    return k - kAfterSale
  })

  const newPool = mapValues(poolWithShares, (s) =>
    Math.max(MIN_POOL_SHARES, s - saleAmount)
  )

  return { newPool, saleAmount }
}
/*LOG2   */ export const sell = logCall('Entering ' + codeUrl('sell()', github_file_url, 56), _sell);

/*WRAPPED*/ export function _shortSell(
  pool: {
    [outcome: string]: number
  },
  outcome: string,
  amount: number
) {
  if (amount < 0) throw new Error('Amount must be non-negative')
  if (pool[outcome] === undefined) throw new Error('Invalid outcome')

  const k = getK(pool)
  const poolWithAmount = mapValues(pool, (s) => s + amount)

  const minOutcome = minBy(Object.keys(poolWithAmount), (o) =>
    o === outcome ? Infinity : poolWithAmount[o]
  ) as string
  const maxShares = poolWithAmount[minOutcome]

  const shares = binarySearch(amount, maxShares, (shares) => {
    const poolAfterPurchase = mapValues(poolWithAmount, (s, o) =>
      o === outcome ? s : Math.max(MIN_POOL_SHARES, s - shares)
    )
    const kAfterSale = getK(poolAfterPurchase)
    return k - kAfterSale
  })

  const newPool = mapValues(poolWithAmount, (s, o) =>
    o === outcome ? s : Math.max(MIN_POOL_SHARES, s - shares)
  )
  const gainedShares = mapValues(newPool, (s, o) => poolWithAmount[o] - s)

  return { newPool, gainedShares }
}
/*LOG2   */ export const shortSell = logCall('Entering ' + codeUrl('shortSell()', github_file_url, 84), _shortSell);

/*WRAPPED*/ export function _test() {
  const pool = {
    A: 100,
    B: 100,
    C: 100,
  }

  console.log('START')
  console.log('pool', pool, 'k', getK(pool), 'probs', poolToProbs(pool))

  const { newPool: poolAfterShortSell, shares } = buy(pool, 'C', 100000000)
  console.log(
    'after buy',
    shares,
    'pool',
    poolAfterShortSell,
    'probs',
    poolToProbs(poolAfterShortSell)
  )
  console.log('k', getK(poolAfterShortSell))
  console.log('liquidity', getLiquidity(poolAfterShortSell))
}
/*LOG2   */ export const test = logCall('Entering ' + codeUrl('test()', github_file_url, 118), _test);
