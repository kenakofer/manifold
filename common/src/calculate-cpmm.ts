import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/calculate-cpmm.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/calculate-cpmm.ts'
import { groupBy, mapValues, sumBy } from 'lodash'
import { LimitBet } from './bet'

import { CREATOR_FEE, Fees, LIQUIDITY_FEE, PLATFORM_FEE } from './fees'
import { LiquidityProvision } from './liquidity-provision'
import { computeFills } from './new-bet'
import { binarySearch } from './util/algos'
import { EPSILON, floatingEqual } from './util/math'
import {
  calculateCpmmMultiArbitrageSellNo,
  calculateCpmmMultiArbitrageSellYes,
} from './calculate-cpmm-arbitrage'
import { Answer } from './answer'

export type CpmmState = {
  pool: { [outcome: string]: number }
  p: number
}

/*WRAPPED*/ export function _getCpmmProbability(
  pool: { [outcome: string]: number },
  p: number
) {
  const { YES, NO } = pool
  return (p * NO) / ((1 - p) * YES + p * NO)
}
/*LOG2   */ export const getCpmmProbability = logCall('Entering ' + codeUrl('getCpmmProbability()', github_file_url, 20), _getCpmmProbability);

/*WRAPPED*/ export function _getCpmmProbabilityAfterBetBeforeFees(
  state: CpmmState,
  outcome: string,
  bet: number
) {
  const { pool, p } = state
  const shares = calculateCpmmShares(pool, p, bet, outcome)
  const { YES: y, NO: n } = pool

  const [newY, newN] =
    outcome === 'YES'
      ? [y - shares + bet, n + bet]
      : [y + bet, n - shares + bet]

  return getCpmmProbability({ YES: newY, NO: newN }, p)
}
/*LOG2   */ export const getCpmmProbabilityAfterBetBeforeFees = logCall('Entering ' + codeUrl('getCpmmProbabilityAfterBetBeforeFees()', github_file_url, 28), _getCpmmProbabilityAfterBetBeforeFees);

/*WRAPPED*/ export function _getCpmmOutcomeProbabilityAfterBet(
  state: CpmmState,
  outcome: string,
  bet: number
) {
  const { newPool } = calculateCpmmPurchase(state, bet, outcome)
  const p = getCpmmProbability(newPool, state.p)
  return outcome === 'NO' ? 1 - p : p
}
/*LOG2   */ export const getCpmmOutcomeProbabilityAfterBet = logCall('Entering ' + codeUrl('getCpmmOutcomeProbabilityAfterBet()', github_file_url, 45), _getCpmmOutcomeProbabilityAfterBet);

// before liquidity fee
/*WRAPPED*/ function _calculateCpmmShares(
  pool: {
    [outcome: string]: number
  },
  p: number,
  bet: number,
  betChoice: string
) {
  if (bet === 0) return 0

  const { YES: y, NO: n } = pool
  const k = y ** p * n ** (1 - p)

  return betChoice === 'YES'
    ? // https://www.wolframalpha.com/input?i=%28y%2Bb-s%29%5E%28p%29*%28n%2Bb%29%5E%281-p%29+%3D+k%2C+solve+s
      y + bet - (k * (bet + n) ** (p - 1)) ** (1 / p)
    : n + bet - (k * (bet + y) ** -p) ** (1 / (1 - p))
}
/*LOG2   */ const calculateCpmmShares = logCall('Entering ' + codeUrl('calculateCpmmShares()', github_file_url, 56), _calculateCpmmShares);

/*WRAPPED*/ export function _getCpmmFees(state: CpmmState, bet: number, outcome: string) {
  const prob = getCpmmProbabilityAfterBetBeforeFees(state, outcome, bet)
  const betP = outcome === 'YES' ? 1 - prob : prob

  const liquidityFee = LIQUIDITY_FEE * betP * bet
  const platformFee = PLATFORM_FEE * betP * bet
  const creatorFee = CREATOR_FEE * betP * bet
  const fees: Fees = { liquidityFee, platformFee, creatorFee }

  const totalFees = liquidityFee + platformFee + creatorFee
  const remainingBet = bet - totalFees

  return { remainingBet, totalFees, fees }
}
/*LOG2   */ export const getCpmmFees = logCall('Entering ' + codeUrl('getCpmmFees()', github_file_url, 75), _getCpmmFees);

/*WRAPPED*/ export function _calculateCpmmSharesAfterFee(
  state: CpmmState,
  bet: number,
  outcome: string
) {
  const { pool, p } = state
  const { remainingBet } = getCpmmFees(state, bet, outcome)

  return calculateCpmmShares(pool, p, remainingBet, outcome)
}
/*LOG2   */ export const calculateCpmmSharesAfterFee = logCall('Entering ' + codeUrl('calculateCpmmSharesAfterFee()', github_file_url, 90), _calculateCpmmSharesAfterFee);

/*WRAPPED*/ export function _calculateCpmmPurchase(
  state: CpmmState,
  bet: number,
  outcome: string
) {
  const { pool, p } = state
  const { remainingBet, fees } = getCpmmFees(state, bet, outcome)

  const shares = calculateCpmmShares(pool, p, remainingBet, outcome)
  const { YES: y, NO: n } = pool

  const { liquidityFee: fee } = fees

  const [newY, newN] =
    outcome === 'YES'
      ? [y - shares + remainingBet + fee, n + remainingBet + fee]
      : [y + remainingBet + fee, n - shares + remainingBet + fee]

  const postBetPool = { YES: newY, NO: newN }

  const { newPool, newP } = addCpmmLiquidity(postBetPool, p, fee)

  return { shares, newPool, newP, fees }
}
/*LOG2   */ export const calculateCpmmPurchase = logCall('Entering ' + codeUrl('calculateCpmmPurchase()', github_file_url, 101), _calculateCpmmPurchase);

/*WRAPPED*/ export function _calculateCpmmAmountToProb(
  state: CpmmState,
  prob: number,
  outcome: 'YES' | 'NO'
) {
  if (prob <= 0 || prob >= 1 || isNaN(prob)) return Infinity
  if (outcome === 'NO') prob = 1 - prob

  const { pool, p } = state
  const { YES: y, NO: n } = pool
  const k = y ** p * n ** (1 - p)
  return outcome === 'YES'
    ? // https://www.wolframalpha.com/input?i=-1+%2B+t+-+((-1+%2B+p)+t+(k%2F(n+%2B+b))^(1%2Fp))%2Fp+solve+b
      ((p * (prob - 1)) / ((p - 1) * prob)) ** -p *
        (k - n * ((p * (prob - 1)) / ((p - 1) * prob)) ** p)
    : (((1 - p) * (prob - 1)) / (-p * prob)) ** (p - 1) *
        (k - y * (((1 - p) * (prob - 1)) / (-p * prob)) ** (1 - p))
}
/*LOG2   */ export const calculateCpmmAmountToProb = logCall('Entering ' + codeUrl('calculateCpmmAmountToProb()', github_file_url, 126), _calculateCpmmAmountToProb);

/*WRAPPED*/ export function _calculateCpmmAmountToBuySharesFixedP(
  state: CpmmState,
  shares: number,
  outcome: 'YES' | 'NO'
) {
  if (!floatingEqual(state.p, 0.5)) {
    throw new Error(
      'calculateAmountToBuySharesFixedP only works for p = 0.5, got ' + state.p
    )
  }

  const { YES: y, NO: n } = state.pool
  if (outcome === 'YES') {
    // https://www.wolframalpha.com/input?i=%28y%2Bb-s%29%5E0.5+*+%28n%2Bb%29%5E0.5+%3D+y+%5E+0.5+*+n+%5E+0.5%2C+solve+b
    return (
      (shares - y - n + Math.sqrt(4 * n * shares + (y + n - shares) ** 2)) / 2
    )
  }
  return (
    (shares - y - n + Math.sqrt(4 * y * shares + (y + n - shares) ** 2)) / 2
  )
}
/*LOG2   */ export const calculateCpmmAmountToBuySharesFixedP = logCall('Entering ' + codeUrl('calculateCpmmAmountToBuySharesFixedP()', github_file_url, 145), _calculateCpmmAmountToBuySharesFixedP);

// Faster version assuming p = 0.5
/*WRAPPED*/ export function _calculateAmountToBuySharesFixedP(
  state: CpmmState,
  shares: number,
  outcome: 'YES' | 'NO',
  unfilledBets: LimitBet[],
  balanceByUserId: { [userId: string]: number }
) {
  const maxAmount = shares
  const { takers } = computeFills(
    state,
    outcome,
    maxAmount,
    undefined,
    unfilledBets,
    balanceByUserId
  )

  let currShares = 0
  let currAmount = 0
  for (const fill of takers) {
    const { amount: fillAmount, shares: fillShares, matchedBetId } = fill

    if (floatingEqual(currShares + fillShares, shares)) {
      return currAmount + fillAmount
    }
    if (currShares + fillShares > shares) {
      // First fill that goes over the required shares.
      if (matchedBetId) {
        // Match a portion of the fill to get the exact shares.
        const remainingShares = shares - currShares
        const remainingAmount = fillAmount * (remainingShares / fillShares)
        return currAmount + remainingAmount
      }
      // Last fill was from AMM. Break to compute the cpmmState at this point.
      break
    }

    currShares += fillShares
    currAmount += fillAmount
  }

  const remaningShares = shares - currShares

  // Recompute up to currAmount to get the current cpmmState.
  const { cpmmState } = computeFills(
    state,
    outcome,
    currAmount,
    undefined,
    unfilledBets,
    balanceByUserId
  )
  const fillAmount = calculateCpmmAmountToBuySharesFixedP(
    cpmmState,
    remaningShares,
    outcome
  )
  return currAmount + fillAmount
}
/*LOG2   */ export const calculateAmountToBuySharesFixedP = logCall('Entering ' + codeUrl('calculateAmountToBuySharesFixedP()', github_file_url, 169), _calculateAmountToBuySharesFixedP);

/*WRAPPED*/ export function _calculateCpmmMultiSumsToOneSale(
  answers: Answer[],
  answerToSell: Answer,
  shares: number,
  outcome: 'YES' | 'NO',
  limitProb: number | undefined,
  unfilledBets: LimitBet[],
  balanceByUserId: { [userId: string]: number }
) {
  if (Math.round(shares) < 0) {
    throw new Error('Cannot sell non-positive shares')
  }

  const { newBetResult, otherBetResults } =
    outcome === 'YES'
      ? calculateCpmmMultiArbitrageSellYes(
          answers,
          answerToSell,
          shares,
          limitProb,
          unfilledBets,
          balanceByUserId
        )
      : calculateCpmmMultiArbitrageSellNo(
          answers,
          answerToSell,
          shares,
          limitProb,
          unfilledBets,
          balanceByUserId
        )

  // Transform buys of opposite outcome into sells.
  const saleTakers = newBetResult.takers.map((taker) => ({
    ...taker,
    // You bought opposite shares, which combine with existing shares, removing them.
    shares: -taker.shares,
    // Opposite shares combine with shares you are selling for Ṁ of shares.
    // You paid taker.amount for the opposite shares.
    // Take the negative because this is money you gain.
    amount: -(taker.shares - taker.amount),
    isSale: true,
  }))

  const saleValue = -sumBy(saleTakers, (taker) => taker.amount)

  const transformedNewBetResult = {
    ...newBetResult,
    takers: saleTakers,
    outcome,
  }

  return {
    saleValue,
    newBetResult: transformedNewBetResult,
    otherBetResults,
  }
}
/*LOG2   */ export const calculateCpmmMultiSumsToOneSale = logCall('Entering ' + codeUrl('calculateCpmmMultiSumsToOneSale()', github_file_url, 229), _calculateCpmmMultiSumsToOneSale);

/*WRAPPED*/ export function _calculateAmountToBuyShares(
  state: CpmmState,
  shares: number,
  outcome: 'YES' | 'NO',
  unfilledBets: LimitBet[],
  balanceByUserId: { [userId: string]: number }
) {
  const prob = getCpmmProbability(state.pool, state.p)
  const minAmount = shares * (outcome === 'YES' ? prob : 1 - prob)

  // Search for amount between bounds.
  // Min share price is based on current probability, and max is Ṁ1 each.
  return binarySearch(minAmount, shares, (amount) => {
    const { takers } = computeFills(
      state,
      outcome,
      amount,
      undefined,
      unfilledBets,
      balanceByUserId
    )

    const totalShares = sumBy(takers, (taker) => taker.shares)
    return totalShares - shares
  })
}
/*LOG2   */ export const calculateAmountToBuyShares = logCall('Entering ' + codeUrl('calculateAmountToBuyShares()', github_file_url, 288), _calculateAmountToBuyShares);

/*WRAPPED*/ export function _calculateCpmmSale(
  state: CpmmState,
  shares: number,
  outcome: 'YES' | 'NO',
  unfilledBets: LimitBet[],
  balanceByUserId: { [userId: string]: number }
) {
  if (Math.round(shares) < 0) {
    throw new Error('Cannot sell non-positive shares')
  }

  const oppositeOutcome = outcome === 'YES' ? 'NO' : 'YES'
  const buyAmount = calculateAmountToBuyShares(
    state,
    shares,
    oppositeOutcome,
    unfilledBets,
    balanceByUserId
  )

  const { cpmmState, makers, takers, totalFees, ordersToCancel } = computeFills(
    state,
    oppositeOutcome,
    buyAmount,
    undefined,
    unfilledBets,
    balanceByUserId
  )

  // Transform buys of opposite outcome into sells.
  const saleTakers = takers.map((taker) => ({
    ...taker,
    // You bought opposite shares, which combine with existing shares, removing them.
    shares: -taker.shares,
    // Opposite shares combine with shares you are selling for Ṁ of shares.
    // You paid taker.amount for the opposite shares.
    // Take the negative because this is money you gain.
    amount: -(taker.shares - taker.amount),
    isSale: true,
  }))

  const saleValue = -sumBy(saleTakers, (taker) => taker.amount)

  return {
    saleValue,
    cpmmState,
    fees: totalFees,
    makers,
    takers: saleTakers,
    ordersToCancel,
  }
}
/*LOG2   */ export const calculateCpmmSale = logCall('Entering ' + codeUrl('calculateCpmmSale()', github_file_url, 315), _calculateCpmmSale);

/*WRAPPED*/ export function _getCpmmProbabilityAfterSale(
  state: CpmmState,
  shares: number,
  outcome: 'YES' | 'NO',
  unfilledBets: LimitBet[],
  balanceByUserId: { [userId: string]: number }
) {
  const { cpmmState } = calculateCpmmSale(
    state,
    shares,
    outcome,
    unfilledBets,
    balanceByUserId
  )
  return getCpmmProbability(cpmmState.pool, cpmmState.p)
}
/*LOG2   */ export const getCpmmProbabilityAfterSale = logCall('Entering ' + codeUrl('getCpmmProbabilityAfterSale()', github_file_url, 368), _getCpmmProbabilityAfterSale);

/*WRAPPED*/ export function _getCpmmLiquidity(
  pool: { [outcome: string]: number },
  p: number
) {
  const { YES, NO } = pool
  return YES ** p * NO ** (1 - p)
}
/*LOG2   */ export const getCpmmLiquidity = logCall('Entering ' + codeUrl('getCpmmLiquidity()', github_file_url, 385), _getCpmmLiquidity);

/*WRAPPED*/ export function _getMultiCpmmLiquidity(pool: { YES: number; NO: number }) {
  return getCpmmLiquidity(pool, 0.5)
}
/*LOG2   */ export const getMultiCpmmLiquidity = logCall('Entering ' + codeUrl('getMultiCpmmLiquidity()', github_file_url, 393), _getMultiCpmmLiquidity);

/*WRAPPED*/ export function _addCpmmLiquidity(
  pool: { [outcome: string]: number },
  p: number,
  amount: number
) {
  const prob = getCpmmProbability(pool, p)

  //https://www.wolframalpha.com/input?i=p%28n%2Bb%29%2F%28%281-p%29%28y%2Bb%29%2Bp%28n%2Bb%29%29%3Dq%2C+solve+p
  const { YES: y, NO: n } = pool
  const numerator = prob * (amount + y)
  const denominator = amount - n * (prob - 1) + prob * y
  const newP = numerator / denominator

  const newPool = { YES: y + amount, NO: n + amount }

  const oldLiquidity = getCpmmLiquidity(pool, newP)
  const newLiquidity = getCpmmLiquidity(newPool, newP)
  const liquidity = newLiquidity - oldLiquidity

  return { newPool, liquidity, newP }
}
/*LOG2   */ export const addCpmmLiquidity = logCall('Entering ' + codeUrl('addCpmmLiquidity()', github_file_url, 397), _addCpmmLiquidity);

/*WRAPPED*/ export function _addCpmmLiquidityFixedP(
  pool: { YES: number; NO: number },
  amount: number
) {
  const prob = getCpmmProbability(pool, 0.5)
  const newPool = { ...pool }
  const sharesThrownAway = { YES: 0, NO: 0 }

  // Throws away some shares so that prob is maintained.
  if (prob < 0.5) {
    newPool.YES += amount
    newPool.NO += (prob / (1 - prob)) * amount
    sharesThrownAway.NO = amount - (prob / (1 - prob)) * amount
  } else {
    newPool.NO += amount
    newPool.YES += ((1 - prob) / prob) * amount
    sharesThrownAway.YES = amount - ((1 - prob) / prob) * amount
  }

  const oldLiquidity = getMultiCpmmLiquidity(pool)
  const newLiquidity = getMultiCpmmLiquidity(newPool)
  const liquidity = newLiquidity - oldLiquidity

  return { newPool, liquidity, sharesThrownAway }
}
/*LOG2   */ export const addCpmmLiquidityFixedP = logCall('Entering ' + codeUrl('addCpmmLiquidityFixedP()', github_file_url, 419), _addCpmmLiquidityFixedP);

/*WRAPPED*/ export function _addCpmmMultiLiquidityToAnswersIndependently(
  pools: { [answerId: string]: { YES: number; NO: number } },
  amount: number
) {
  const amountPerAnswer = amount / Object.keys(pools).length
  return mapValues(
    pools,
    (pool) => addCpmmLiquidityFixedP(pool, amountPerAnswer).newPool
  )
}
/*LOG2   */ export const addCpmmMultiLiquidityToAnswersIndependently = logCall('Entering ' + codeUrl('addCpmmMultiLiquidityToAnswersIndependently()', github_file_url, 445), _addCpmmMultiLiquidityToAnswersIndependently);

/*WRAPPED*/ export function _addCpmmMultiLiquidityAnswersSumToOne(
  pools: { [answerId: string]: { YES: number; NO: number } },
  amount: number
) {
  const answerIds = Object.keys(pools)
  const numAnswers = answerIds.length

  const newPools = { ...pools }

  let amountRemaining = amount
  while (amountRemaining > EPSILON) {
    const yesSharesThrownAway: { [answerId: string]: number } =
      Object.fromEntries(answerIds.map((answerId) => [answerId, 0]))

    for (const [answerId, pool] of Object.entries(newPools)) {
      const { newPool, sharesThrownAway } = addCpmmLiquidityFixedP(
        pool,
        amountRemaining / numAnswers
      )
      newPools[answerId] = newPool

      yesSharesThrownAway[answerId] += sharesThrownAway.YES
      const otherAnswerIds = answerIds.filter((id) => id !== answerId)
      for (const otherAnswerId of otherAnswerIds) {
        // Convert NO shares into YES shares for each other answer.
        yesSharesThrownAway[otherAnswerId] += sharesThrownAway.NO
      }
    }

    const minSharesThrownAway = Math.min(...Object.values(yesSharesThrownAway))
    console.log(
      'amount remaining',
      amountRemaining,
      'yes shares thrown away',
      yesSharesThrownAway,
      'min',
      minSharesThrownAway
    )
    amountRemaining = minSharesThrownAway
  }
  return newPools
}
/*LOG2   */ export const addCpmmMultiLiquidityAnswersSumToOne = logCall('Entering ' + codeUrl('addCpmmMultiLiquidityAnswersSumToOne()', github_file_url, 456), _addCpmmMultiLiquidityAnswersSumToOne);

/*WRAPPED*/ export function _getCpmmLiquidityPoolWeights(liquidities: LiquidityProvision[]) {
  const userAmounts = groupBy(liquidities, (w) => w.userId)
  const totalAmount = sumBy(liquidities, (w) => w.amount)

  return mapValues(
    userAmounts,
    (amounts) => sumBy(amounts, (w) => w.amount) / totalAmount
  )
}
/*LOG2   */ export const getCpmmLiquidityPoolWeights = logCall('Entering ' + codeUrl('getCpmmLiquidityPoolWeights()', github_file_url, 499), _getCpmmLiquidityPoolWeights);

/*WRAPPED*/ export function _getUserLiquidityShares(
  userId: string,
  pool: { [outcome: string]: number },
  liquidities: LiquidityProvision[]
) {
  const weights = getCpmmLiquidityPoolWeights(liquidities)
  const userWeight = weights[userId] ?? 0

  return mapValues(pool, (shares) => userWeight * shares)
}
/*LOG2   */ export const getUserLiquidityShares = logCall('Entering ' + codeUrl('getUserLiquidityShares()', github_file_url, 509), _getUserLiquidityShares);
