import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/calculate.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/calculate.ts'
import {
  groupBy,
  keyBy,
  mapValues,
  maxBy,
  partition,
  sortBy,
  sum,
  sumBy,
} from 'lodash'
import { Bet } from './bet'
import {
  calculateCpmmPurchase,
  getCpmmOutcomeProbabilityAfterBet,
  getCpmmProbability,
} from './calculate-cpmm'
import { buy, getProb } from './calculate-cpmm-multi'
import {
  calculateDpmPayout,
  calculateDpmShares,
  getDpmOutcomeProbability,
  getDpmOutcomeProbabilityAfterBet,
  getDpmProbability,
} from './calculate-dpm'
import {
  calculateFixedPayout,
  calculateFixedPayoutMulti,
} from './calculate-fixed-payouts'
import {
  BinaryContract,
  Contract,
  MultiContract,
  PseudoNumericContract,
  StonkContract,
} from './contract'
import { floatingEqual } from './util/math'
import { ContractMetric } from './contract-metric'
import { Answer, DpmAnswer } from './answer'

/*WRAPPED*/ export function _getProbability(
  contract: BinaryContract | PseudoNumericContract | StonkContract
) {
  return contract.mechanism === 'cpmm-1'
    ? getCpmmProbability(contract.pool, contract.p)
    : getDpmProbability(contract.totalShares)
}
/*LOG2   */ export const getProbability = logCall('Entering ' + codeUrl('getProbability()', github_file_url, 40), _getProbability);

/*WRAPPED*/ export function _getDisplayProbability(
  contract: BinaryContract | PseudoNumericContract | StonkContract
) {
  return contract.resolutionProbability ?? getProbability(contract)
}
/*LOG2   */ export const getDisplayProbability = logCall('Entering ' + codeUrl('getDisplayProbability()', github_file_url, 48), _getDisplayProbability);

/*WRAPPED*/ export function _getInitialProbability(
  contract: BinaryContract | PseudoNumericContract | StonkContract
) {
  if (contract.initialProbability) return contract.initialProbability

  if (contract.mechanism === 'dpm-2' || (contract as any).totalShares)
    // use totalShares to calculate prob for ported contracts
    return getDpmProbability(
      (contract as any).phantomShares ?? (contract as any).totalShares
    )

  return getCpmmProbability(contract.pool, contract.p)
}
/*LOG2   */ export const getInitialProbability = logCall('Entering ' + codeUrl('getInitialProbability()', github_file_url, 54), _getInitialProbability);

/*WRAPPED*/ export function _getOutcomeProbability(contract: Contract, outcome: string) {
  const { mechanism } = contract
  switch (mechanism) {
    case 'cpmm-1':
      return outcome === 'YES'
        ? getCpmmProbability(contract.pool, contract.p)
        : 1 - getCpmmProbability(contract.pool, contract.p)
    case 'cpmm-2':
      return getProb(contract.pool, outcome)
    case 'dpm-2':
      return getDpmOutcomeProbability(contract.totalShares, outcome)
    case 'cpmm-multi-1':
      return 0
    default:
      throw new Error('getOutcomeProbability not implemented')
  }
}
/*LOG2   */ export const getOutcomeProbability = logCall('Entering ' + codeUrl('getOutcomeProbability()', github_file_url, 68), _getOutcomeProbability);

/*WRAPPED*/ export function _getAnswerProbability(
  contract: MultiContract,
  answerId: string
) {
  if (contract.mechanism === 'dpm-2') {
    return getDpmOutcomeProbability(contract.totalShares, answerId)
  }

  if (contract.mechanism === 'cpmm-multi-1') {
    const answer = contract.answers.find((a) => a.id === answerId)
    if (!answer) return 0

    const { poolYes, poolNo, resolution, resolutionProbability } = answer
    if (resolution) {
      if (resolution === 'MKT') return resolutionProbability ?? answer.prob
      if (resolution === 'YES') return 1
      if (resolution === 'NO') return 0
    }
    const pool = { YES: poolYes, NO: poolNo }
    return getCpmmProbability(pool, 0.5)
  }

  if (contract.mechanism === 'cpmm-2') {
    return 0
  }

  throw new Error(
    'getAnswerProbability not implemented for mechanism ' +
      (contract as any).mechanism
  )
}
/*LOG2   */ export const getAnswerProbability = logCall('Entering ' + codeUrl('getAnswerProbability()', github_file_url, 86), _getAnswerProbability);

/*WRAPPED*/ export function _getInitialAnswerProbability(
  contract: MultiContract,
  answer: Answer | DpmAnswer
) {
  if (contract.mechanism === 'cpmm-multi-1') {
    if (!contract.shouldAnswersSumToOne) {
      return 0.5
    } else {
      if (contract.addAnswersMode === 'DISABLED') {
        return 1 / contract.answers.length
      } else {
        const answers = contract.answers as Answer[]
        const initialTime = answers.find((a) => a.isOther)?.createdTime

        if (answer.createdTime === initialTime) {
          const numberOfInitialAnswers = sumBy(answers, (a) =>
            a.createdTime === initialTime ? 1 : 0
          )
          return 1 / numberOfInitialAnswers
        }
        return undefined
      }
    }
  }

  if (contract.mechanism === 'dpm-2') {
    return undefined
  }

  if (contract.mechanism === 'cpmm-2') {
    return 1 / contract.answers.length
  }

  throw new Error(
    'getAnswerInitialProbability not implemented for mechanism ' +
      (contract as any).mechanism
  )
}
/*LOG2   */ export const getInitialAnswerProbability = logCall('Entering ' + codeUrl('getInitialAnswerProbability()', github_file_url, 118), _getInitialAnswerProbability);

/*WRAPPED*/ export function _getOutcomeProbabilityAfterBet(
  contract: Contract,
  outcome: string,
  bet: number
) {
  const { mechanism } = contract
  switch (mechanism) {
    case 'cpmm-1':
      return getCpmmOutcomeProbabilityAfterBet(contract, outcome, bet)
    case 'cpmm-2':
      return getProb(buy(contract.pool, outcome, bet).newPool, outcome)
    case 'dpm-2':
      return getDpmOutcomeProbabilityAfterBet(
        contract.totalShares,
        outcome,
        bet
      )
    case 'cpmm-multi-1':
      return 0
    default:
      throw new Error('getOutcomeProbabilityAfterBet not implemented')
  }
}
/*LOG2   */ export const getOutcomeProbabilityAfterBet = logCall('Entering ' + codeUrl('getOutcomeProbabilityAfterBet()', github_file_url, 157), _getOutcomeProbabilityAfterBet);

/*WRAPPED*/ export function _getOutcomeProbabilityAfterBetMulti(
  answers: Answer[],
  answerId: string,
  outcome: 'YES' | 'NO',
  amount: number
) {
  const answer = answers.find((a) => a.id === answerId)
  if (!answer) throw new Error('Answer not found')

  const { poolYes, poolNo } = answer

  return getCpmmOutcomeProbabilityAfterBet(
    {
      pool: { YES: poolYes, NO: poolNo },
      p: 0.5,
    },
    outcome,
    amount
  )
}
/*LOG2   */ export const getOutcomeProbabilityAfterBetMulti = logCall('Entering ' + codeUrl('getOutcomeProbabilityAfterBetMulti()', github_file_url, 181), _getOutcomeProbabilityAfterBetMulti);

/*WRAPPED*/ export function _calculateSharesBought(
  contract: Contract,
  outcome: string,
  amount: number
) {
  const { mechanism } = contract
  switch (mechanism) {
    case 'cpmm-1':
      return calculateCpmmPurchase(contract, amount, outcome).shares
    case 'cpmm-2':
      return buy(contract.pool, outcome, amount).shares
    case 'dpm-2':
      return calculateDpmShares(contract.totalShares, amount, outcome)
    default:
      throw new Error('calculateSharesBought not implemented')
  }
}
/*LOG2   */ export const calculateSharesBought = logCall('Entering ' + codeUrl('calculateSharesBought()', github_file_url, 202), _calculateSharesBought);
/*WRAPPED*/ export function _calculateSharesBoughtMulti(
  answers: Answer[],
  answerId: string,
  outcome: 'YES' | 'NO',
  amount: number
) {
  const answer = answers.find((a) => a.id === answerId)
  if (!answer) throw new Error('Answer not found')

  const { poolYes, poolNo } = answer

  return calculateCpmmPurchase(
    { pool: { YES: poolYes, NO: poolNo }, p: 0.5 },
    amount,
    outcome
  ).shares
}
/*LOG2   */ export const calculateSharesBoughtMulti = logCall('Entering ' + codeUrl('calculateSharesBoughtMulti()', github_file_url, 219), _calculateSharesBoughtMulti);

/*WRAPPED*/ export function _calculatePayout(contract: Contract, bet: Bet, outcome: string) {
  const { mechanism } = contract
  return mechanism === 'cpmm-1'
    ? calculateFixedPayout(contract, bet, outcome)
    : mechanism === 'cpmm-multi-1'
    ? calculateFixedPayoutMulti(contract, bet, outcome)
    : mechanism === 'dpm-2'
    ? calculateDpmPayout(contract, bet, outcome)
    : bet?.amount ?? 0
}
/*LOG2   */ export const calculatePayout = logCall('Entering ' + codeUrl('calculatePayout()', github_file_url, 237), _calculatePayout);

/*WRAPPED*/ export function _resolvedPayout(contract: Contract, bet: Bet) {
  const { resolution, mechanism } = contract
  if (!resolution) throw new Error('Contract not resolved')

  return mechanism === 'cpmm-1'
    ? calculateFixedPayout(contract, bet, resolution)
    : mechanism === 'cpmm-multi-1'
    ? calculateFixedPayoutMulti(contract, bet, resolution)
    : mechanism === 'dpm-2'
    ? calculateDpmPayout(contract, bet, resolution)
    : bet?.amount ?? 0
}
/*LOG2   */ export const resolvedPayout = logCall('Entering ' + codeUrl('resolvedPayout()', github_file_url, 248), _resolvedPayout);

/*WRAPPED*/ function _getCpmmInvested(yourBets: Bet[]) {
  const totalShares: { [outcome: string]: number } = {}
  const totalSpent: { [outcome: string]: number } = {}

  const sortedBets = sortBy(yourBets, 'createdTime')
  const sharePurchases = sortedBets.map((bet) => [bet]).flat()

  for (const purchase of sharePurchases) {
    const { outcome, shares, amount } = purchase
    if (floatingEqual(shares, 0)) continue

    const spent = totalSpent[outcome] ?? 0
    const position = totalShares[outcome] ?? 0

    if (amount > 0) {
      totalShares[outcome] = position + shares
      totalSpent[outcome] = spent + amount
    } else if (amount < 0) {
      const averagePrice = position === 0 ? 0 : spent / position
      totalShares[outcome] = position + shares
      totalSpent[outcome] = spent + averagePrice * shares
    }
  }

  return sum(Object.values(totalSpent))
}
/*LOG2   */ const getCpmmInvested = logCall('Entering ' + codeUrl('getCpmmInvested()', github_file_url, 261), _getCpmmInvested);

/*WRAPPED*/ function _getDpmInvested(yourBets: Bet[]) {
  const sortedBets = sortBy(yourBets, 'createdTime')

  return sumBy(sortedBets, (bet) => {
    const { amount, sale } = bet

    if (sale) {
      const originalBet = sortedBets.find((b) => b.id === sale.betId)
      if (originalBet) return -originalBet.amount
      return 0
    }

    return amount
  })
}
/*LOG2   */ const getDpmInvested = logCall('Entering ' + codeUrl('getDpmInvested()', github_file_url, 288), _getDpmInvested);

/*WRAPPED*/ export function _getSimpleCpmmInvested(yourBets: Bet[]) {
  const total = sumBy(yourBets, (b) => b.amount)
  if (total < 0) return 0
  return total
}
/*LOG2   */ export const getSimpleCpmmInvested = logCall('Entering ' + codeUrl('getSimpleCpmmInvested()', github_file_url, 304), _getSimpleCpmmInvested);

/*WRAPPED*/ export function _getInvested(contract: Contract, yourBets: Bet[]) {
  const { mechanism } = contract
  if (mechanism === 'cpmm-1') return getCpmmInvested(yourBets)
  if (mechanism === 'cpmm-multi-1') {
    const betsByAnswerId = groupBy(yourBets, 'answerId')
    const investedByAnswerId = mapValues(betsByAnswerId, getCpmmInvested)
    return sum(Object.values(investedByAnswerId))
  }
  return getDpmInvested(yourBets)
}
/*LOG2   */ export const getInvested = logCall('Entering ' + codeUrl('getInvested()', github_file_url, 310), _getInvested);

/*WRAPPED*/ function _getCpmmOrDpmProfit(
  contract: Contract,
  yourBets: Bet[],
  answer?: Answer
) {
  const resolution = answer?.resolution ?? contract.resolution

  let totalInvested = 0
  let payout = 0
  let saleValue = 0
  let redeemed = 0

  const betsById = keyBy(yourBets, 'id')
  const betIdToSaleBet = keyBy(
    yourBets.filter((b) => b.sale),
    (bet) => bet.sale!.betId
  )

  for (const bet of yourBets) {
    const { isSold, sale, amount, isRedemption } = bet

    if (isSold) {
      const saleBet = betIdToSaleBet[bet.id]
      if (saleBet) {
        // Only counts if the sale bet is also in the list.
        totalInvested += amount
      }
    } else if (sale) {
      if (betsById[sale.betId]) {
        // Only counts if the original bet is also in the list.
        saleValue += sale.amount
      }
    } else {
      if (isRedemption) {
        redeemed += -1 * amount
      } else if (amount > 0) {
        totalInvested += amount
      } else {
        saleValue -= amount
      }

      payout += resolution
        ? calculatePayout(contract, bet, resolution)
        : calculatePayout(contract, bet, 'MKT')
    }
  }

  const profit = payout + saleValue + redeemed - totalInvested
  const profitPercent = totalInvested === 0 ? 0 : (profit / totalInvested) * 100

  return {
    profit,
    profitPercent,
    totalInvested,
    payout,
  }
}
/*LOG2   */ const getCpmmOrDpmProfit = logCall('Entering ' + codeUrl('getCpmmOrDpmProfit()', github_file_url, 321), _getCpmmOrDpmProfit);

/*WRAPPED*/ export function _getProfitMetrics(contract: Contract, yourBets: Bet[]) {
  const { mechanism } = contract
  if (mechanism === 'cpmm-multi-1') {
    const betsByAnswerId = groupBy(yourBets, 'answerId')
    const profitMetricsPerAnswer = Object.entries(betsByAnswerId).map(
      ([answerId, bets]) => {
        const answer = contract.answers.find((a) => a.id === answerId)
        return getCpmmOrDpmProfit(contract, bets, answer)
      }
    )
    const profit = sumBy(profitMetricsPerAnswer, 'profit')
    const totalInvested = sumBy(profitMetricsPerAnswer, 'totalInvested')
    const profitPercent =
      totalInvested === 0 ? 0 : (profit / totalInvested) * 100
    const payout = sumBy(profitMetricsPerAnswer, 'payout')
    return {
      profit,
      profitPercent,
      totalInvested,
      payout,
    }
  }
  return getCpmmOrDpmProfit(contract, yourBets)
}
/*LOG2   */ export const getProfitMetrics = logCall('Entering ' + codeUrl('getProfitMetrics()', github_file_url, 379), _getProfitMetrics);

/*WRAPPED*/ export function _getCpmmShares(yourBets: Bet[]) {
  const totalShares: { [outcome: string]: number } = {}
  for (const bet of yourBets) {
    const { shares, outcome } = bet
    totalShares[outcome] = (totalShares[outcome] ?? 0) + shares
  }

  const hasShares = Object.values(totalShares).some(
    (shares) => !floatingEqual(shares, 0)
  )

  const { YES: yesShares, NO: noShares } = totalShares
  const hasYesShares = yesShares >= 1
  const hasNoShares = noShares >= 1

  return {
    totalShares,
    hasShares,
    hasYesShares,
    hasNoShares,
  }
}
/*LOG2   */ export const getCpmmShares = logCall('Entering ' + codeUrl('getCpmmShares()', github_file_url, 404), _getCpmmShares);

/*WRAPPED*/ export function _getCpmmMultiShares(yourBets: Bet[]) {
  const betsByAnswerId = groupBy(yourBets, 'answerId')
  const sharesByAnswerId = mapValues(betsByAnswerId, (bets) =>
    getCpmmShares(bets)
  )

  const hasShares = Object.values(sharesByAnswerId).some(
    (shares) => shares.hasShares
  )

  return {
    hasShares,
    sharesByAnswerId,
  }
}
/*LOG2   */ export const getCpmmMultiShares = logCall('Entering ' + codeUrl('getCpmmMultiShares()', github_file_url, 427), _getCpmmMultiShares);

/*WRAPPED*/ export const _getContractBetMetrics = (
  contract: Contract,
  yourBets: Bet[],
  answerId?: string
) => {
  const { mechanism } = contract
  const isCpmmMulti = mechanism === 'cpmm-multi-1'
  const { profit, profitPercent, payout } = getProfitMetrics(contract, yourBets)
  const invested = getInvested(contract, yourBets)
  const loan = sumBy(yourBets, 'loanAmount')

  const { totalShares, hasShares, hasYesShares, hasNoShares } =
    getCpmmShares(yourBets)
  const lastBetTime = Math.max(...yourBets.map((b) => b.createdTime))
  const maxSharesOutcome = hasShares
    ? maxBy(Object.keys(totalShares), (outcome) => totalShares[outcome])
    : null

  return {
    invested,
    loan,
    payout,
    profit,
    profitPercent,
    totalShares,
    hasShares: isCpmmMulti ? getCpmmMultiShares(yourBets).hasShares : hasShares,
    hasYesShares,
    hasNoShares,
    maxSharesOutcome,
    lastBetTime,
    answerId: answerId ?? null,
  }
}
/*LOG2   */ export const getContractBetMetrics = logCall('Entering ' + codeUrl('getContractBetMetrics()', github_file_url, 443), _getContractBetMetrics);
/*WRAPPED*/ export const _getContractBetMetricsPerAnswer = (
  contract: Contract,
  yourBets: Bet[]
) => {
  const betsPerAnswer = groupBy(yourBets, 'answerId')
  const metricsPerAnswer = Object.values(
    mapValues(betsPerAnswer, (bets) =>
      getContractBetMetrics(contract, bets, bets[0].answerId)
    )
  )
  // Not entirely sure about this extra calculation, but seems nice to have an overall contract metric.
  if (contract.mechanism === 'cpmm-multi-1') {
    metricsPerAnswer.push(getContractBetMetrics(contract, yourBets))
  }
  return metricsPerAnswer
}
/*LOG2   */ export const getContractBetMetricsPerAnswer = logCall('Entering ' + codeUrl('getContractBetMetricsPerAnswer()', github_file_url, 476), _getContractBetMetricsPerAnswer);

/*WRAPPED*/ export function _getContractBetNullMetrics() {
  return {
    invested: 0,
    loan: 0,
    payout: 0,
    profit: 0,
    profitPercent: 0,
    totalShares: {} as { [outcome: string]: number },
    hasShares: false,
    hasYesShares: false,
    hasNoShares: false,
    maxSharesOutcome: null,
  } as ContractMetric
}
/*LOG2   */ export const getContractBetNullMetrics = logCall('Entering ' + codeUrl('getContractBetNullMetrics()', github_file_url, 493), _getContractBetNullMetrics);
/*WRAPPED*/ export function _getTopAnswer(contract: MultiContract) {
  const { answers } = contract
  const top = maxBy<Answer | DpmAnswer>(answers, (answer) =>
    'prob' in answer ? answer.prob : getOutcomeProbability(contract, answer.id)
  )
  return top
}
/*LOG2   */ export const getTopAnswer = logCall('Entering ' + codeUrl('getTopAnswer()', github_file_url, 507), _getTopAnswer);

/*WRAPPED*/ export function _getTopNSortedAnswers(contract: MultiContract, n: number) {
  const { answers, resolution, resolutions } = contract

  const [winningAnswers, losingAnswers] = partition(
    answers,
    (answer: Answer | DpmAnswer) =>
      answer.id === resolution || (resolutions && resolutions[answer.id])
    // Types were messed up with out this cast.
  ) as [(Answer | DpmAnswer)[], (Answer | DpmAnswer)[]]

  const sortedAnswers = [
    ...sortBy(winningAnswers, (answer) =>
      resolutions ? -1 * resolutions[answer.id] : 0
    ),
    ...sortBy(
      losingAnswers,
      (answer) => -1 * getAnswerProbability(contract, answer.id)
    ),
  ].slice(0, n)
  return sortedAnswers
}
/*LOG2   */ export const getTopNSortedAnswers = logCall('Entering ' + codeUrl('getTopNSortedAnswers()', github_file_url, 515), _getTopNSortedAnswers);

/*WRAPPED*/ export function _getLargestPosition(contract: Contract, userBets: Bet[]) {
  if (userBets.length === 0) {
    return null
  }

  if (contract.mechanism === 'cpmm-multi-1') {
    const { sharesByAnswerId, hasShares } = getCpmmMultiShares(userBets)
    if (!hasShares) return null

    const answerId = maxBy(Object.keys(sharesByAnswerId), (answerId) =>
      Math.max(...Object.values(sharesByAnswerId[answerId].totalShares))
    )
    if (!answerId) return null
    const { totalShares } = sharesByAnswerId[answerId]

    const outcome = maxBy(
      Object.keys(totalShares),
      (outcome) => totalShares[outcome]
    )
    if (!outcome) return null

    return {
      answerId,
      outcome,
      shares: totalShares[outcome],
    }
  }

  const { totalShares, hasShares } = getContractBetMetrics(contract, userBets)
  if (!hasShares) return null

  const outcome = maxBy(
    Object.keys(totalShares),
    (outcome) => totalShares[outcome]
  )
  if (!outcome) return null

  const shares = totalShares[outcome]
  return { outcome, shares }
}
/*LOG2   */ export const getLargestPosition = logCall('Entering ' + codeUrl('getLargestPosition()', github_file_url, 537), _getLargestPosition);
