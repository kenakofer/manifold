import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/loans.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/loans.ts'
import { Dictionary, sumBy, minBy, groupBy } from 'lodash'
import { Bet } from './bet'
import { getProfitMetrics, getSimpleCpmmInvested } from './calculate'
import {
  Contract,
  CPMMContract,
  CPMMMultiContract,
  DPMContract,
} from './contract'
import { filterDefined } from './util/array'
import { PortfolioMetrics } from './portfolio-metrics'
import { calculateDpmRawShareValue } from './calculate-dpm'

export const LOAN_DAILY_RATE = 0.04

/*WRAPPED*/ const _calculateNewLoan = (investedValue: number, loanTotal: number) => {
  const netValue = investedValue - loanTotal
  return netValue * LOAN_DAILY_RATE
}
/*LOG2   */ const calculateNewLoan = logCall('Entering ' + codeUrl('calculateNewLoan()', github_file_url, 16), _calculateNewLoan);

/*WRAPPED*/ export const _getUserLoanUpdates = (
  betsByContractId: { [contractId: string]: Bet[] },
  contractsById: { [contractId: string]: Contract }
) => {
  const updates = calculateLoanBetUpdates(betsByContractId, contractsById)
  return { updates, payout: sumBy(updates, (update) => update.newLoan) }
}
/*LOG2   */ export const getUserLoanUpdates = logCall('Entering ' + codeUrl('getUserLoanUpdates()', github_file_url, 21), _getUserLoanUpdates);

/*WRAPPED*/ export const _isUserEligibleForLoan = (
  portfolio: PortfolioMetrics | undefined
) => {
  if (!portfolio) return true

  const { investmentValue } = portfolio
  return investmentValue > 0
}
/*LOG2   */ export const isUserEligibleForLoan = logCall('Entering ' + codeUrl('isUserEligibleForLoan()', github_file_url, 29), _isUserEligibleForLoan);

/*WRAPPED*/ const _calculateLoanBetUpdates = (
  betsByContractId: Dictionary<Bet[]>,
  contractsById: Dictionary<Contract>
) => {
  const contracts = filterDefined(
    Object.keys(betsByContractId).map((contractId) => contractsById[contractId])
  ).filter((c) => !c.isResolved)

  return contracts.flatMap((c) => {
    const bets = betsByContractId[c.id]
    if (c.mechanism === 'cpmm-1') {
      return getCpmmContractLoanUpdate(c, bets) ?? []
    } else if (c.mechanism === 'cpmm-multi-1') {
      const betsByAnswerId = groupBy(bets, (bet) => bet.answerId)
      return filterDefined(
        Object.values(betsByAnswerId).map((bets) =>
          getCpmmContractLoanUpdate(c, bets)
        )
      )
    } else if (c.mechanism === 'dpm-2')
      return filterDefined(getDpmContractLoanUpdate(c, bets))
    else {
      // Unsupported contract / mechanism for loans.
      return []
    }
  })
}
/*LOG2   */ const calculateLoanBetUpdates = logCall('Entering ' + codeUrl('calculateLoanBetUpdates()', github_file_url, 38), _calculateLoanBetUpdates);

/*WRAPPED*/ const _getCpmmContractLoanUpdate = (
  contract: CPMMContract | CPMMMultiContract,
  bets: Bet[]
) => {
  const invested = getSimpleCpmmInvested(bets)
  const { payout: currentValue } = getProfitMetrics(contract, bets)
  const loanAmount = sumBy(bets, (bet) => bet.loanAmount ?? 0)

  const loanBasis = Math.min(invested, currentValue)
  const newLoan = calculateNewLoan(loanBasis, loanAmount)
  const oldestBet = minBy(bets, (bet) => bet.createdTime)
  if (!isFinite(newLoan) || newLoan <= 0 || !oldestBet) return undefined

  const loanTotal = (oldestBet.loanAmount ?? 0) + newLoan

  return {
    userId: oldestBet.userId,
    contractId: contract.id,
    betId: oldestBet.id,
    newLoan,
    loanTotal,
  }
}
/*LOG2   */ const getCpmmContractLoanUpdate = logCall('Entering ' + codeUrl('getCpmmContractLoanUpdate()', github_file_url, 66), _getCpmmContractLoanUpdate);

/*WRAPPED*/ const _getDpmContractLoanUpdate = (contract: DPMContract, bets: Bet[]) => {
  const openBets = bets.filter((bet) => !bet.isSold && !bet.sale)

  return openBets.map((bet) => {
    const loanAmount = bet.loanAmount ?? 0
    const value = calculateDpmRawShareValue(
      contract.totalShares,
      bet.shares,
      bet.outcome
    )
    const loanBasis = Math.min(value, bet.amount)
    const newLoan = calculateNewLoan(loanBasis, loanAmount)
    const loanTotal = loanAmount + newLoan

    if (!isFinite(newLoan) || newLoan <= 0) return undefined

    return {
      userId: bet.userId,
      contractId: contract.id,
      betId: bet.id,
      newLoan,
      loanTotal,
    }
  })
}
/*LOG2   */ const getDpmContractLoanUpdate = logCall('Entering ' + codeUrl('getDpmContractLoanUpdate()', github_file_url, 90), _getDpmContractLoanUpdate);
