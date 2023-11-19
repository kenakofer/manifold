import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/redeem.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/redeem.ts'
import { partition, sumBy } from 'lodash'

import { Bet } from './bet'
import { Contract } from './contract'
import { noFees } from './fees'
import { CandidateBet } from './new-bet'
import { removeUndefinedProps } from './util/object'

type RedeemableBet = Pick<
  Bet,
  'outcome' | 'shares' | 'sharesByOutcome' | 'loanAmount'
>

/*WRAPPED*/ export const _getBinaryRedeemableAmount = (bets: RedeemableBet[]) => {
  const [yesBets, noBets] = partition(bets, (b) => b.outcome === 'YES')
  const yesShares = sumBy(yesBets, (b) => b.shares)
  const noShares = sumBy(noBets, (b) => b.shares)

  const shares = Math.max(Math.min(yesShares, noShares), 0)
  const soldFrac = shares > 0 ? shares / Math.max(yesShares, noShares) : 0

  const loanAmount = sumBy(bets, (bet) => bet.loanAmount ?? 0)
  const loanPayment = loanAmount * soldFrac
  const netAmount = shares - loanPayment
  return { shares, loanPayment, netAmount }
}
/*LOG2   */ export const getBinaryRedeemableAmount = logCall('Entering ' + codeUrl('getBinaryRedeemableAmount()', github_file_url, 14), _getBinaryRedeemableAmount);

/*WRAPPED*/ export const _getRedemptionBets = (
  contract: Contract,
  shares: number,
  loanPayment: number,
  prob: number,
  answerId: string | undefined
) => {
  const createdTime = Date.now()
  const yesBet: CandidateBet = removeUndefinedProps({
    contractId: contract.id,
    amount: prob * -shares,
    shares: -shares,
    loanAmount: loanPayment ? -loanPayment / 2 : 0,
    outcome: 'YES',
    probBefore: prob,
    probAfter: prob,
    createdTime,
    fees: noFees,
    isAnte: false,
    isRedemption: true,
    isChallenge: false,
    visibility: contract.visibility,
    answerId,
  })
  const noBet: CandidateBet = removeUndefinedProps({
    contractId: contract.id,
    amount: (1 - prob) * -shares,
    shares: -shares,
    loanAmount: loanPayment ? -loanPayment / 2 : 0,
    outcome: 'NO',
    probBefore: prob,
    probAfter: prob,
    createdTime,
    fees: noFees,
    isAnte: false,
    isRedemption: true,
    isChallenge: false,
    visibility: contract.visibility,
    answerId,
  })
  return [yesBet, noBet]
}
/*LOG2   */ export const getRedemptionBets = logCall('Entering ' + codeUrl('getRedemptionBets()', github_file_url, 28), _getRedemptionBets);
