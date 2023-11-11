import { NestedLogger } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; } }

import { groupBy, maxBy, sum, sumBy } from 'lodash'
import { getBinaryRedeemableAmount, getRedemptionBets } from '../redeem'
import { floatingEqual } from '../util/math'
import { CPMMContract, CPMMMultiContract } from '../contract'
import { PlaygroundState } from '../playground/playground-state';

export const redeemShares = async (
  userId: string,
  contract: CPMMContract | CPMMMultiContract,
  playgroundState: PlaygroundState
) => {
  const { id: contractId } = contract

  const bets = playgroundState.getBetsByContractId(contractId).filter(bet => bet.userId === userId)

  const betsByAnswerId = groupBy(bets, (bet) => bet.answerId)
  let totalAmount = 0

  for (const [answerId, bets] of Object.entries(betsByAnswerId)) {
    const { shares, loanPayment, netAmount } = getBinaryRedeemableAmount(bets)
    if (floatingEqual(shares, 0)) {
      continue
    }
    if (!isFinite(netAmount)) {
      window.logger.throw('Error 400', `Invalid redemption amount ${netAmount}, no clue what happened here.`)
    }

    totalAmount += netAmount

    const lastProb = maxBy(bets, (b) => b.createdTime)?.probAfter as number
    const [yesBet, noBet] = getRedemptionBets(
      contract,
      shares,
      loanPayment,
      lastProb,
      answerId
    )
    // const yesDoc = betsColl.doc()
    // const noDoc = betsColl.doc()

    // trans.create(yesDoc, { id: yesDoc.id, userId, ...yesBet })
    // trans.create(noDoc, { id: noDoc.id, userId, ...noBet })

    window.logger.log(`${userId} redeemed ${shares} shares for ${netAmount}`)
  }

  // const userDoc = firestore.collection('users').doc(userId)
  // trans.update(userDoc, { balance: FieldValue.increment(totalAmount) })
  playgroundState.getUser(userId).balance += totalAmount
  window.logger.log(`Increased ${userId}'s balance by ${totalAmount}`)

  return { status: 'success' }
}