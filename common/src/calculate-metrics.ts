import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/calculate-metrics.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/calculate-metrics.ts'
import { Dictionary, first, partition, sumBy, uniq } from 'lodash'
import {
  calculatePayout,
  getContractBetMetrics,
  getContractBetMetricsPerAnswer,
} from './calculate'
import { Bet, LimitBet } from './bet'
import { Contract, CPMMContract, DPMContract } from './contract'
import { User } from './user'
import { DAY_MS } from './util/time'
import { computeFills, getNewMultiBetInfo } from './new-bet'
import { getCpmmProbability } from './calculate-cpmm'
import { removeUndefinedProps } from './util/object'
import { logit } from './util/math'
import { ContractMetric } from './contract-metric'

/*WRAPPED*/ const _computeInvestmentValue = (
  bets: Bet[],
  contractsDict: { [k: string]: Contract }
) => {
  return sumBy(bets, (bet) => {
    const contract = contractsDict[bet.contractId]
    if (!contract || contract.isResolved) return 0
    if (bet.sale || bet.isSold) return 0

    let payout
    try {
      payout = calculatePayout(contract, bet, 'MKT')
    } catch (e) {
      console.log(
        'contract',
        contract.question,
        contract.mechanism,
        contract.id
      )
      console.error(e)
      payout = 0
    }
    const value = payout - (bet.loanAmount ?? 0)
    if (isNaN(value)) return 0
    return value
  })
}
/*LOG2   */ const computeInvestmentValue = logCall('Entering ' + codeUrl('computeInvestmentValue()', github_file_url, 17), _computeInvestmentValue);

/*WRAPPED*/ export const _computeInvestmentValueCustomProb = (
  bets: Bet[],
  contract: Contract,
  p: number
) => {
  return sumBy(bets, (bet) => {
    if (!contract) return 0
    if (bet.sale || bet.isSold) return 0
    const { outcome, shares } = bet

    const betP = outcome === 'YES' ? p : 1 - p

    const value = betP * shares
    if (isNaN(value)) return 0
    return value
  })
}
/*LOG2   */ export const computeInvestmentValueCustomProb = logCall('Entering ' + codeUrl('computeInvestmentValueCustomProb()', github_file_url, 45), _computeInvestmentValueCustomProb);

/*WRAPPED*/ const _getLoanTotal = (
  bets: Bet[],
  contractsDict: { [k: string]: Contract }
) => {
  return sumBy(bets, (bet) => {
    const contract = contractsDict[bet.contractId]
    if (!contract || contract.isResolved) return 0
    if (bet.sale || bet.isSold) return 0
    return bet.loanAmount ?? 0
  })
}
/*LOG2   */ const getLoanTotal = logCall('Entering ' + codeUrl('getLoanTotal()', github_file_url, 63), _getLoanTotal);

export const ELASTICITY_BET_AMOUNT = 100

/*WRAPPED*/ export const _computeElasticity = (
  unfilledBets: LimitBet[],
  contract: Contract,
  betAmount = ELASTICITY_BET_AMOUNT
) => {
  switch (contract.mechanism) {
    case 'cpmm-1':
      return computeBinaryCpmmElasticity(unfilledBets, contract, betAmount)
    case 'dpm-2':
      return computeDpmElasticity(contract, betAmount)
    default: // there are some contracts on the dev DB with crazy mechanisms
      return 1
  }
}
/*LOG2   */ export const computeElasticity = logCall('Entering ' + codeUrl('computeElasticity()', github_file_url, 77), _computeElasticity);

/*WRAPPED*/ export const _computeBinaryCpmmElasticity = (
  unfilledBets: LimitBet[],
  contract: CPMMContract,
  betAmount: number
) => {
  const sortedBets = unfilledBets.sort((a, b) => a.createdTime - b.createdTime)

  const userIds = uniq(unfilledBets.map((b) => b.userId))
  // Assume all limit orders are good.
  const userBalances = Object.fromEntries(
    userIds.map((id) => [id, Number.MAX_SAFE_INTEGER])
  )

  const cpmmState = {
    pool: contract.pool,
    p: contract.p,
  }

  const {
    cpmmState: { pool: poolY, p: pY },
  } = computeFills(
    cpmmState,
    'YES',
    betAmount,
    undefined,
    sortedBets,
    userBalances
  )
  const resultYes = getCpmmProbability(poolY, pY)

  const {
    cpmmState: { pool: poolN, p: pN },
  } = computeFills(
    cpmmState,
    'NO',
    betAmount,
    undefined,
    sortedBets,
    userBalances
  )
  const resultNo = getCpmmProbability(poolN, pN)

  // handle AMM overflow
  const safeYes = Number.isFinite(resultYes)
    ? Math.min(resultYes, 0.995)
    : 0.995
  const safeNo = Number.isFinite(resultNo) ? Math.max(resultNo, 0.005) : 0.005

  return logit(safeYes) - logit(safeNo)
}
/*LOG2   */ export const computeBinaryCpmmElasticity = logCall('Entering ' + codeUrl('computeBinaryCpmmElasticity()', github_file_url, 92), _computeBinaryCpmmElasticity);

/*WRAPPED*/ export const _computeBinaryCpmmElasticityFromAnte = (
  ante: number,
  betAmount = ELASTICITY_BET_AMOUNT
) => {
  const pool = { YES: ante, NO: ante }
  const p = 0.5

  const cpmmState = {
    pool,
    p,
  }

  const {
    cpmmState: { pool: poolY, p: pY },
  } = computeFills(cpmmState, 'YES', betAmount, undefined, [], {})
  const resultYes = getCpmmProbability(poolY, pY)

  const {
    cpmmState: { pool: poolN, p: pN },
  } = computeFills(cpmmState, 'NO', betAmount, undefined, [], {})
  const resultNo = getCpmmProbability(poolN, pN)

  // handle AMM overflow
  const safeYes = Number.isFinite(resultYes) ? resultYes : 1
  const safeNo = Number.isFinite(resultNo) ? resultNo : 0

  return logit(safeYes) - logit(safeNo)
}
/*LOG2   */ export const computeBinaryCpmmElasticityFromAnte = logCall('Entering ' + codeUrl('computeBinaryCpmmElasticityFromAnte()', github_file_url, 143), _computeBinaryCpmmElasticityFromAnte);

/*WRAPPED*/ export const _computeDpmElasticity = (
  contract: DPMContract,
  betAmount: number
) => {
  const afterProb = getNewMultiBetInfo('', betAmount + 1, contract).newBet
    .probAfter

  const initialProb = getNewMultiBetInfo('', 1, contract).newBet.probAfter

  return logit(afterProb) - logit(initialProb)
}
/*LOG2   */ export const computeDpmElasticity = logCall('Entering ' + codeUrl('computeDpmElasticity()', github_file_url, 172), _computeDpmElasticity);

/*WRAPPED*/ export const _calculateNewPortfolioMetrics = (
  user: User,
  contractsById: { [k: string]: Contract },
  unresolvedBets: Bet[]
) => {
  const investmentValue = computeInvestmentValue(unresolvedBets, contractsById)
  const loanTotal = getLoanTotal(unresolvedBets, contractsById)
  return {
    investmentValue: investmentValue,
    balance: user.balance,
    totalDeposits: user.totalDeposits,
    loanTotal,
    timestamp: Date.now(),
    userId: user.id,
  }
}
/*LOG2   */ export const calculateNewPortfolioMetrics = logCall('Entering ' + codeUrl('calculateNewPortfolioMetrics()', github_file_url, 184), _calculateNewPortfolioMetrics);

/*WRAPPED*/ export const _calculateMetricsByContractAndAnswer = (
  betsByContractId: Dictionary<Bet[]>,
  contractsById: Dictionary<Contract>,
  user?: User
) => {
  return Object.entries(betsByContractId).map(([contractId, bets]) => {
    const contract: Contract = contractsById[contractId]
    return calculateUserMetrics(contract, bets, user)
  })
}
/*LOG2   */ export const calculateMetricsByContractAndAnswer = logCall('Entering ' + codeUrl('calculateMetricsByContractAndAnswer()', github_file_url, 201), _calculateMetricsByContractAndAnswer);

/*WRAPPED*/ export const _calculateUserMetrics = (
  contract: Contract,
  bets: Bet[],
  user?: User
) => {
  // ContractMetrics will have an answerId for every answer, and a null for the overall metrics.
  const currentMetrics = getContractBetMetricsPerAnswer(contract, bets)

  const bet = first(bets)
  return currentMetrics.map((current) => {
    let periodMetrics
    if (contract.mechanism === 'cpmm-1') {
      const periods = ['day', 'week', 'month'] as const
      periodMetrics = Object.fromEntries(
        periods.map((period) => [
          period,
          calculatePeriodProfit(contract, bets, period),
        ])
      )
    }
    return removeUndefinedProps({
      contractId: contract.id,
      ...current,
      from: periodMetrics,
      userName: user?.name ?? bet?.userName,
      userId: user?.id ?? bet?.userId,
      userUsername: user?.username ?? bet?.userUsername,
      userAvatarUrl: user?.avatarUrl ?? bet?.userAvatarUrl,
    } as ContractMetric)
  })
}
/*LOG2   */ export const calculateUserMetrics = logCall('Entering ' + codeUrl('calculateUserMetrics()', github_file_url, 212), _calculateUserMetrics);

/*WRAPPED*/ const _calculatePeriodProfit = (
  contract: CPMMContract,
  bets: Bet[],
  period: 'day' | 'week' | 'month'
) => {
  const days = period === 'day' ? 1 : period === 'week' ? 7 : 30
  const fromTime = Date.now() - days * DAY_MS
  const [previousBets, recentBets] = partition(
    bets,
    (b) => b.createdTime < fromTime
  )

  const { prob, probChanges } = contract
  const prevProb = prob - probChanges[period]

  const previousBetsValue = computeInvestmentValueCustomProb(
    previousBets,
    contract,
    prevProb
  )
  const currentBetsValue = computeInvestmentValueCustomProb(
    previousBets,
    contract,
    prob
  )

  const { profit: recentProfit, invested: recentInvested } =
    getContractBetMetrics(contract, recentBets)

  const profit = currentBetsValue - previousBetsValue + recentProfit
  const invested = previousBetsValue + recentInvested
  const profitPercent = invested === 0 ? 0 : 100 * (profit / invested)

  return {
    profit,
    profitPercent,
    invested,
    prevValue: previousBetsValue,
    value: currentBetsValue,
  }
}
/*LOG2   */ const calculatePeriodProfit = logCall('Entering ' + codeUrl('calculatePeriodProfit()', github_file_url, 244), _calculatePeriodProfit);
