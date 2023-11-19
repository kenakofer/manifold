import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/calculate-dpm.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/calculate-dpm.ts'
import { sum, sumBy, mapValues } from 'lodash'
import { Bet, NumericBet } from './bet'
import { DPMBinaryContract, DPMContract } from './contract'
import { DPM_FEES } from './fees'

/*WRAPPED*/ export function _getDpmProbability(totalShares: { [outcome: string]: number }) {
  // For binary contracts only.
  return getDpmOutcomeProbability(totalShares, 'YES')
}
/*LOG2   */ export const getDpmProbability = logCall('Entering ' + codeUrl('getDpmProbability()', github_file_url, 6), _getDpmProbability);

/*WRAPPED*/ export function _getDpmOutcomeProbability(
  totalShares: {
    [outcome: string]: number
  },
  outcome: string
) {
  const squareSum = sumBy(Object.values(totalShares), (shares) => shares ** 2)
  const shares = totalShares[outcome] ?? 0
  return shares ** 2 / squareSum
}
/*LOG2   */ export const getDpmOutcomeProbability = logCall('Entering ' + codeUrl('getDpmOutcomeProbability()', github_file_url, 11), _getDpmOutcomeProbability);

/*WRAPPED*/ export function _getDpmOutcomeProbabilities(totalShares: {
  [outcome: string]: number
}) {
  const squareSum = sumBy(Object.values(totalShares), (shares) => shares ** 2)
  return mapValues(totalShares, (shares) => shares ** 2 / squareSum)
}
/*LOG2   */ export const getDpmOutcomeProbabilities = logCall('Entering ' + codeUrl('getDpmOutcomeProbabilities()', github_file_url, 22), _getDpmOutcomeProbabilities);

/*WRAPPED*/ export function _getDpmOutcomeProbabilityAfterBet(
  totalShares: {
    [outcome: string]: number
  },
  outcome: string,
  bet: number
) {
  const shares = calculateDpmShares(totalShares, bet, outcome)

  const prevShares = totalShares[outcome] ?? 0
  const newTotalShares = { ...totalShares, [outcome]: prevShares + shares }

  return getDpmOutcomeProbability(newTotalShares, outcome)
}
/*LOG2   */ export const getDpmOutcomeProbabilityAfterBet = logCall('Entering ' + codeUrl('getDpmOutcomeProbabilityAfterBet()', github_file_url, 29), _getDpmOutcomeProbabilityAfterBet);

/*WRAPPED*/ export function _getDpmProbabilityAfterSale(
  totalShares: {
    [outcome: string]: number
  },
  outcome: string,
  shares: number
) {
  const prevShares = totalShares[outcome] ?? 0
  const newTotalShares = { ...totalShares, [outcome]: prevShares - shares }

  const predictionOutcome = outcome === 'NO' ? 'YES' : outcome
  return getDpmOutcomeProbability(newTotalShares, predictionOutcome)
}
/*LOG2   */ export const getDpmProbabilityAfterSale = logCall('Entering ' + codeUrl('getDpmProbabilityAfterSale()', github_file_url, 44), _getDpmProbabilityAfterSale);

/*WRAPPED*/ export function _calculateDpmShares(
  totalShares: {
    [outcome: string]: number
  },
  bet: number,
  betChoice: string
) {
  const squareSum = sumBy(Object.values(totalShares), (shares) => shares ** 2)
  const shares = totalShares[betChoice] ?? 0

  const c = 2 * bet * Math.sqrt(squareSum)

  return Math.sqrt(bet ** 2 + shares ** 2 + c) - shares
}
/*LOG2   */ export const calculateDpmShares = logCall('Entering ' + codeUrl('calculateDpmShares()', github_file_url, 58), _calculateDpmShares);

/*WRAPPED*/ export function _calculateDpmRawShareValue(
  totalShares: {
    [outcome: string]: number
  },
  shares: number,
  betChoice: string
) {
  const currentValue = Math.sqrt(
    sumBy(Object.values(totalShares), (shares) => shares ** 2)
  )

  const postSaleValue = Math.sqrt(
    sumBy(Object.keys(totalShares), (outcome) =>
      outcome === betChoice
        ? Math.max(0, totalShares[outcome] - shares) ** 2
        : totalShares[outcome] ** 2
    )
  )

  return currentValue - postSaleValue
}
/*LOG2   */ export const calculateDpmRawShareValue = logCall('Entering ' + codeUrl('calculateDpmRawShareValue()', github_file_url, 73), _calculateDpmRawShareValue);

/*WRAPPED*/ export function _calculateDpmMoneyRatio(
  contract: DPMContract,
  bet: Bet,
  shareValue: number
) {
  const { totalShares, totalBets, pool } = contract
  const { outcome, amount } = bet

  const p = getDpmOutcomeProbability(totalShares, outcome)

  const actual = sum(Object.values(pool)) - shareValue

  const betAmount = p * amount

  const expected =
    sumBy(
      Object.keys(totalBets),
      (outcome) =>
        getDpmOutcomeProbability(totalShares, outcome) *
        (totalBets as { [outcome: string]: number })[outcome]
    ) - betAmount

  if (actual <= 0 || expected <= 0) return 0

  return actual / expected
}
/*LOG2   */ export const calculateDpmMoneyRatio = logCall('Entering ' + codeUrl('calculateDpmMoneyRatio()', github_file_url, 95), _calculateDpmMoneyRatio);

/*WRAPPED*/ export function _calculateDpmShareValue(contract: DPMContract, bet: Bet) {
  const { pool, totalShares } = contract
  const { shares, outcome } = bet

  const shareValue = calculateDpmRawShareValue(totalShares, shares, outcome)
  const f = calculateDpmMoneyRatio(contract, bet, shareValue)

  const myPool = pool[outcome]
  const adjShareValue = Math.min(Math.min(1, f) * shareValue, myPool)
  return adjShareValue
}
/*LOG2   */ export const calculateDpmShareValue = logCall('Entering ' + codeUrl('calculateDpmShareValue()', github_file_url, 122), _calculateDpmShareValue);

/*WRAPPED*/ export function _calculateDpmSaleAmount(contract: DPMContract, bet: Bet) {
  const { amount } = bet
  const winnings = calculateDpmShareValue(contract, bet)
  return deductDpmFees(amount, winnings)
}
/*LOG2   */ export const calculateDpmSaleAmount = logCall('Entering ' + codeUrl('calculateDpmSaleAmount()', github_file_url, 134), _calculateDpmSaleAmount);

/*WRAPPED*/ export function _calculateDpmPayout(
  contract: DPMContract,
  bet: Bet,
  outcome: string
) {
  if (outcome === 'CANCEL') return calculateDpmCancelPayout(contract, bet)
  if (outcome === 'MKT') return calculateMktDpmPayout(contract, bet)

  return calculateStandardDpmPayout(contract, bet, outcome)
}
/*LOG2   */ export const calculateDpmPayout = logCall('Entering ' + codeUrl('calculateDpmPayout()', github_file_url, 140), _calculateDpmPayout);

/*WRAPPED*/ function _calculateDpmCancelPayout(contract: DPMContract, bet: Bet) {
  const { totalBets, pool } = contract
  const betTotal = sum(Object.values(totalBets))
  const poolTotal = sum(Object.values(pool))

  return (bet.amount / betTotal) * poolTotal
}
/*LOG2   */ const calculateDpmCancelPayout = logCall('Entering ' + codeUrl('calculateDpmCancelPayout()', github_file_url, 151), _calculateDpmCancelPayout);

/*WRAPPED*/ export function _calculateStandardDpmPayout(
  contract: DPMContract,
  bet: Bet,
  outcome: string
) {
  const { outcome: betOutcome } = bet
  const isNumeric = contract.outcomeType === 'NUMERIC'
  if (!isNumeric && betOutcome !== outcome) return 0

  const shares = isNumeric
    ? ((bet as NumericBet).allOutcomeShares ?? {})[outcome]
    : bet.shares

  if (!shares) return 0

  const { totalShares, phantomShares, pool } = contract
  if (!totalShares[outcome]) return 0

  const poolTotal = sum(Object.values(pool))

  const total =
    totalShares[outcome] - (phantomShares ? phantomShares[outcome] : 0)

  const winnings = (shares / total) * poolTotal

  const amount = isNumeric
    ? (bet as NumericBet).allBetAmounts[outcome]
    : bet.amount

  const payout = amount + (1 - DPM_FEES) * Math.max(0, winnings - amount)
  return payout
}
/*LOG2   */ export const calculateStandardDpmPayout = logCall('Entering ' + codeUrl('calculateStandardDpmPayout()', github_file_url, 159), _calculateStandardDpmPayout);

/*WRAPPED*/ export function _calculateDpmPayoutAfterCorrectBet(
  contract: DPMContract,
  bet: Bet
) {
  const { totalShares, pool, totalBets, outcomeType } = contract
  const { shares, amount, outcome } = bet

  const prevShares = totalShares[outcome] ?? 0
  const prevPool = pool[outcome] ?? 0
  const prevTotalBet = totalBets[outcome] ?? 0

  const newContract = {
    ...contract,
    totalShares: {
      ...totalShares,
      [outcome]: prevShares + shares,
    },
    pool: {
      ...pool,
      [outcome]: prevPool + amount,
    },
    totalBets: {
      ...totalBets,
      [outcome]: prevTotalBet + amount,
    },
    outcomeType:
      outcomeType === 'NUMERIC'
        ? 'FREE_RESPONSE' // hack to show payout at particular bet point estimate
        : outcomeType,
  }

  return calculateStandardDpmPayout(newContract as any, bet, outcome)
}
/*LOG2   */ export const calculateDpmPayoutAfterCorrectBet = logCall('Entering ' + codeUrl('calculateDpmPayoutAfterCorrectBet()', github_file_url, 192), _calculateDpmPayoutAfterCorrectBet);

/*WRAPPED*/ function _calculateMktDpmPayout(contract: DPMContract, bet: Bet) {
  if (contract.outcomeType === 'BINARY')
    return calculateBinaryMktDpmPayout(contract, bet)

  const { totalShares, pool, resolutions } = contract

  let probs: { [outcome: string]: number }

  if (resolutions) {
    const probTotal = sum(Object.values(resolutions))
    probs = mapValues(
      totalShares,
      (_, outcome) => (resolutions[outcome] ?? 0) / probTotal
    )
  } else {
    const squareSum = sum(
      Object.values(totalShares).map((shares) => shares ** 2)
    )
    probs = mapValues(totalShares, (shares) => shares ** 2 / squareSum)
  }

  const { outcome, amount, shares } = bet

  const poolFrac = (probs[outcome] * shares) / totalShares[outcome]

  const totalPool = sum(Object.values(pool))
  const winnings = poolFrac * totalPool
  return deductDpmFees(amount, winnings)
}
/*LOG2   */ const calculateMktDpmPayout = logCall('Entering ' + codeUrl('calculateMktDpmPayout()', github_file_url, 226), _calculateMktDpmPayout);

/*WRAPPED*/ function _calculateBinaryMktDpmPayout(contract: DPMBinaryContract, bet: Bet) {
  const { resolutionProbability, totalShares, phantomShares } = contract
  const p =
    resolutionProbability !== undefined
      ? resolutionProbability
      : getDpmProbability(totalShares)

  const pool = contract.pool.YES + contract.pool.NO

  const weightedShareTotal =
    p * (totalShares.YES - (phantomShares?.YES ?? 0)) +
    (1 - p) * (totalShares.NO - (phantomShares?.NO ?? 0))

  const { outcome, amount, shares } = bet

  const betP = outcome === 'YES' ? p : 1 - p
  const winnings = ((betP * shares) / weightedShareTotal) * pool

  return deductDpmFees(amount, winnings)
}
/*LOG2   */ const calculateBinaryMktDpmPayout = logCall('Entering ' + codeUrl('calculateBinaryMktDpmPayout()', github_file_url, 256), _calculateBinaryMktDpmPayout);

/*WRAPPED*/ export const _deductDpmFees = (betAmount: number, winnings: number) => {
  return winnings > betAmount
    ? betAmount + (1 - DPM_FEES) * (winnings - betAmount)
    : winnings
}
/*LOG2   */ export const deductDpmFees = logCall('Entering ' + codeUrl('deductDpmFees()', github_file_url, 277), _deductDpmFees);

/*WRAPPED*/ export const _calcDpmInitialPool = (
  initialProbInt: number,
  ante: number,
  phantomAnte: number
) => {
  const p = initialProbInt / 100.0
  const totalAnte = phantomAnte + ante

  const sharesYes = Math.sqrt(p * totalAnte ** 2)
  const sharesNo = Math.sqrt(totalAnte ** 2 - sharesYes ** 2)

  const poolYes = p * ante
  const poolNo = (1 - p) * ante

  const phantomYes = Math.sqrt(p) * phantomAnte
  const phantomNo = Math.sqrt(1 - p) * phantomAnte

  return { sharesYes, sharesNo, poolYes, poolNo, phantomYes, phantomNo }
}
/*LOG2   */ export const calcDpmInitialPool = logCall('Entering ' + codeUrl('calcDpmInitialPool()', github_file_url, 283), _calcDpmInitialPool);
