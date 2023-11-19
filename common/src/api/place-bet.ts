import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/backend/api/src/place-bet.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/backend/api/src/place-bet.ts'

import { z } from 'zod'
import { groupBy, mapValues, sumBy, uniq } from 'lodash'
import { Contract, CPMM, CPMM_MIN_POOL_QTY, CPMMContract, CPMMMultiContract, DPM, DPMContract } from '../contract'
import {
  BetInfo,
  CandidateBet,
  getBinaryCpmmBetInfo,
  getNewMultiBetInfo,
  getNewMultiCpmmBetInfo,
} from '../new-bet'
import { addObjects, removeUndefinedProps } from '../util/object'
import { Bet, LimitBet } from '../bet'
import { floatingEqual } from '../util/math'
import { redeemShares } from './redeem-shares'
import { Answer } from '../answer'
import { CpmmState, getCpmmProbability } from '../calculate-cpmm'
import { validate } from './helpers';

// don't use strict() because we want to allow market-type-specific fields
const bodySchema = z.object({
  contractId: z.string(),
  amount: z.number().gte(1),
  replyToCommentId: z.string().optional(),
})

const binarySchema = z.object({
  outcome: z.enum(['YES', 'NO']),
  limitProb: z.number().gte(0).lte(1).optional(),
  expiresAt: z.number().optional(),
})

const multipleChoiceSchema = z.object({
  answerId: z.string(),

  // Used for new multiple choice contracts (cpmm-multi-1).
  outcome: z.enum(['YES', 'NO']).optional(),
  limitProb: z.number().gte(0).lte(1).optional(),
  expiresAt: z.number().optional(),
})

const numericSchema = z.object({
  outcome: z.string(),
  value: z.number(),
})

/*WRAPPED*/ export function _placebet (body, uid, isApi, playgroundState) {
  const bet = placeBetMain(body, uid, isApi, playgroundState)
  return bet
}
/*LOG2   */ export const placebet = logCall('Entering ' + codeUrl('placebet()', github_file_url, 58), _placebet);

/*WRAPPED*/ export const _placeBetMain = (
  body: unknown,
  uid: string,
  isApi: boolean,
  playgroundState: PlaygroundState
) => {
  const { amount, contractId, replyToCommentId } = validate(bodySchema, body)

  // Create and run function to get result
  const result = (() => {
    const contract = playgroundState.getContract(contractId)
    const user = playgroundState.getUser(uid)
    // const userDoc = firestore.doc(`users/${uid}`)
    // const [contractSnap, userSnap] = await trans.getAll(contractDoc, userDoc)

    if (!contract) window.logger.throw('APIError', `(404) Contract ${contractId} not found.`)
    if (!user) window.logger.throw('APIError', `(404) User ${uid} not found.`)

    if (user.balance < amount) window.logger.throw('APIError', `(403) Insufficient balance ${user.balance} to place bet of ${amount}.`)
    window.logger.log(
      `Loaded user ${user.id} betting M${amount} on slug ${contract.slug} with contract id: ${contract.id}.`
    )

    const { closeTime, outcomeType, mechanism, collectedFees, volume } =
      contract
    if (closeTime && Date.now() > closeTime)
      window.logger.throw('APIError', '(403) Trading is closed.')

    const {
      newBet,
      otherBetResults,
      newPool,
      newTotalShares,
      newTotalBets,
      newTotalLiquidity,
      newP,
      makers,
      ordersToCancel,
    } = (():
      BetInfo & {
        makers?: maker[]
        ordersToCancel?: LimitBet[]
        otherBetResults?: {
          answer: Answer
          bet: CandidateBet<Bet>
          cpmmState: CpmmState
          makers: maker[]
          ordersToCancel: LimitBet[]
        }[]
      } => {
      if (
        (outcomeType == 'BINARY' ||
          outcomeType === 'PSEUDO_NUMERIC' ||
          outcomeType === 'STONK') &&
        mechanism == 'cpmm-1'
      ) {
        // eslint-disable-next-line prefer-const
        let { outcome, limitProb, expiresAt } = validate(binarySchema, body)
        if (expiresAt && expiresAt < Date.now())
          window.logger.throw('APIError', '(404) Bet cannot expire in the past.')
        if (limitProb !== undefined && outcomeType === 'BINARY') {
          const isRounded = floatingEqual(
            Math.round(limitProb * 100),
            limitProb * 100
          )
          if (!isRounded)
            window.logger.throw('APIError', '(400) limitProb must be in increments of 0.01 (i.e. whole percentage points)')

          limitProb = Math.round(limitProb * 100) / 100
        }

        window.logger.log(
          `Checking for limit orders in placebet for user ${uid} on contract id ${contractId}.`
        )
        const { unfilledBets, balanceByUserId } =
          getUnfilledBetsAndUserBalances(contract, playgroundState)

        return getBinaryCpmmBetInfo(
          contract,
          outcome,
          amount,
          limitProb,
          unfilledBets,
          balanceByUserId,
          user,
          expiresAt
        )
      } else if (
        (outcomeType == 'FREE_RESPONSE' || outcomeType === 'MULTIPLE_CHOICE') &&
        mechanism == 'dpm-2'
      ) {
        const { answerId } = validate(multipleChoiceSchema, body)
        // const answerDoc = contractDoc.collection('answers').doc(answerId)
        // const answerSnap = await trans.get(answerDoc)
        const answer = contract.answers.find((a) => a.id === answerId)
        if (!answer) window.logger.throw('APIError', `(404) Answer ${answerId} not found.`)
        return getNewMultiBetInfo(answerId, amount, contract)
      } else if (
        outcomeType === 'MULTIPLE_CHOICE' &&
        mechanism == 'cpmm-multi-1'
      ) {
        const { shouldAnswersSumToOne } = contract
        const {
          answerId,
          outcome = 'YES',
          limitProb,
          expiresAt,
        } = validate(multipleChoiceSchema, body)
        if (expiresAt && expiresAt < Date.now())
          window.logger.throw('APIError', '(404) Bet cannot expire in the past.')
        // const answersSnap = await trans.get(
        //   contractDoc.collection('answersCpmm')
        // )
        // const answers = answersSnap.docs.map((doc) => doc.data() as Answer)
        const answers = contract.answers
        const answer = answers.find((a) => a.id === answerId)
        if (!answer) window.logger.throw('APIError', '(404) Answer not found')
        if (shouldAnswersSumToOne && answers.length < 2)
          window.logger.throw('APIError', '(403) Cannot bet until at least two answers are added.')

        let roundedLimitProb = limitProb
        if (limitProb !== undefined) {
          const isRounded = floatingEqual(
            Math.round(limitProb * 100),
            limitProb * 100
          )
          if (!isRounded)
            window.logger.throw('APIError', '(400) limitProb must be in increments of 0.01 (i.e. whole percentage points)')

          roundedLimitProb = Math.round(limitProb * 100) / 100
        }

        const { unfilledBets, balanceByUserId } =
          getUnfilledBetsAndUserBalances(
            contract,
            playgroundState,
            // Fetch all limit orders if answers should sum to one.
            shouldAnswersSumToOne ? undefined : answerId
          )

        return getNewMultiCpmmBetInfo(
          contract,
          answers,
          answer,
          outcome,
          amount,
          roundedLimitProb,
          unfilledBets,
          balanceByUserId,
          expiresAt
        )
      } else {
        window.logger.throw('APIError', '(500) Contract type/mechanism not supported (or is no longer)')
      }
      throw new Error('Unreachable')
    })()

    window.logger.log(`Calculated new bet information for ${user.username} - auth ${uid}.`)

    if (
      mechanism == 'cpmm-1' &&
      (!newP ||
        !isFinite(newP) ||
        Math.min(...Object.values(newPool ?? {})) < CPMM_MIN_POOL_QTY)
    ) {
      window.logger.throw('APIError', '(403) Trade too large for current liquidity pool.')
    }

    if (contract.loverUserId1 && newPool && newP) {
      const prob = getCpmmProbability(newPool, newP)
      if (prob < 0.01) {
        window.logger.throw('APIError', '(403) Cannot bet lower than 1% probability in relationship markets.')
      }
    }

    // const betDoc = contractDoc.collection('bets').doc()
    // trans.create(
    //   betDoc,
    //   removeUndefinedProps({
    //     id: betDoc.id,
    //     userId: user.id,
    //     userAvatarUrl: user.avatarUrl,
    //     userUsername: user.username,
    //     userName: user.name,
    //     isApi,
    //     replyToCommentId,
    //     ...newBet,
    //   })
    // )
    const placedBet = playgroundState.addBet({
      id: undefined,
      userId: user.id,
      userAvatarUrl: user.avatarUrl,
      userUsername: user.username,
      userName: user.name,
      isApi,
      replyToCommentId,
      ...newBet,
    })
    window.logger.log(`Created new bet document for ${user.username} - auth ${uid}.`, placedBet)

    if (makers) {
      updateMakers(makers, contract, placedBet.id, playgroundState)
    }
    if (ordersToCancel) {
      for (const bet of ordersToCancel) {
        // trans.update(contractDoc.collection('bets').doc(bet.id), {
        //   isCancelled: true,
        // })
        window.logger.log(`Cancelled limit order ${bet.id} for ${user.username} - auth ${uid}.`)
        bet.isCancelled = true
      }
    }

    // trans.update(userDoc, { balance: FieldValue.increment(-newBet.amount) })
    user.balance -= newBet.amount

    window.logger.log(`Updated user ${user.username} balance from ${user.balance + newBet.amount} to ${user.balance} (${-newBet.amount})`)

    if (newBet.amount !== 0) {
      if (newBet.answerId) {
        const multiContract = contract as CPMMMultiContract
        // Multi-cpmm-1 contract
        // trans.update(
        //   contractDoc,
        //   removeUndefinedProps({
        //     volume: volume + newBet.amount,
        //   })
        // )
        multiContract.volume += newBet.amount;

        if (newPool) {
          const { YES: poolYes, NO: poolNo } = newPool
          const prob = getCpmmProbability(newPool, 0.5)
          // trans.update(
          //   contractDoc.collection('answersCpmm').doc(newBet.answerId),
          //   removeUndefinedProps({
          //     poolYes,
          //     poolNo,
          //     prob,
          //   })
          // )
          const answer = multiContract.answers.find((a) => a.id === newBet.answerId)
          if (!answer) window.logger.throw('APIError', '(404) Answer not found')
          answer.poolYes = poolYes
          answer.poolNo = poolYes
          answer.prob = prob
        }
      } else {
        const anyContract = contract as any // Adding fields that could be part of the DPM or CPMM contracts
        // trans.update(
        //   contractDoc,
        //   removeUndefinedProps({
        //     pool: newPool,
        //     p: newP,
        //     totalShares: newTotalShares,
        //     totalBets: newTotalBets,
        //     totalLiquidity: newTotalLiquidity,
        //     collectedFees: addObjects(newBet.fees, collectedFees),
        //     volume: volume + newBet.amount,
        //   })
        // )
        anyContract.pool = newPool
        anyContract.p = newP
        anyContract.totalShares = newTotalShares
        anyContract.totalBets = newTotalBets
        anyContract.totalLiquidity = newTotalLiquidity
        anyContract.collectedFees = addObjects(newBet.fees, collectedFees)
        anyContract.volume = volume + newBet.amount
      }

      if (otherBetResults) {
        for (const result of otherBetResults) {
          const { answer, bet, cpmmState, makers, ordersToCancel } = result
          const { probBefore, probAfter } = bet
          const smallEnoughToIgnore =
            probBefore < 0.001 &&
            probAfter < 0.001 &&
            Math.abs(probAfter - probBefore) < 0.00001

          if (!smallEnoughToIgnore || Math.random() < 0.01) {
            // const betDoc = contractDoc.collection('bets').doc()
            // trans.create(betDoc, {
            //   id: betDoc.id,
            //   userId: user.id,
            //   userAvatarUrl: user.avatarUrl,
            //   userUsername: user.username,
            //   userName: user.name,
            //   isApi,
            //   ...bet,
            // })
            playgroundState.addBet({
              id: undefined,
              userId: user.id,
              userAvatarUrl: user.avatarUrl,
              userUsername: user.username,
              userName: user.name,
              isApi,
              ...bet,
            })
            const { YES: poolYes, NO: poolNo } = cpmmState.pool
            const prob = getCpmmProbability(cpmmState.pool, 0.5)
            // trans.update(
            //   contractDoc.collection('answersCpmm').doc(answer.id),
            //   removeUndefinedProps({
            //     poolYes,
            //     poolNo,
            //     prob,
            //   })
            // )
            answer.poolYes = poolYes
            answer.poolNo = poolNo
            answer.prob = prob
          }
          updateMakers(makers, contract, placedBet.id, playgroundState)
          for (const bet of ordersToCancel) {
            // trans.update(contractDoc.collection('bets').doc(bet.id), {
            //   isCancelled: true,
            // })
            bet.isCancelled = true
            window.logger.log(`Cancelled limit order ${bet.id} for ${bet.userId} `)
          }
        }
      }

      window.logger.log(`Updated contract ${contract.id} properties`)
    }

    return { newBet, contract, makers, ordersToCancel, user }
  })()

  window.logger.log(`Main transaction finished - auth ${uid}.`)

  const { newBet, contract, makers, ordersToCancel, user } = result
  const { mechanism } = contract

  if (
    (mechanism === 'cpmm-1' || mechanism === 'cpmm-multi-1') &&
    newBet.amount !== 0
  ) {
    const userIds = uniq([
      uid,
      ...(makers ?? []).map((maker) => maker.bet.userId),
    ])
    userIds.map((userId) => redeemShares(userId, contract, playgroundState))
    window.logger.log(`Share redemption transaction finished - auth ${uid}.`)
  }
  if (ordersToCancel) {
    ordersToCancel.map((order) => {
      // TODO
      throw new Error('TODO: Not implemented, is it needed?')
      // createLimitBetCanceledNotification(
      //   user,
      //   order.userId,
      //   order,
      //   makers?.find((m) => m.bet.id === order.id)?.amount ?? 0,
      //   contract
      // )
    })
  }

  return { ...newBet }
}
/*LOG2   */ export const placeBetMain = logCall('Entering ' + codeUrl('placeBetMain()', github_file_url, 64), _placeBetMain);

// const getUnfilledBetsQuery = (
//   contractDoc: DocumentReference,
//   answerId?: string
// ) => {
//   const q = contractDoc
//     .collection('bets')
//     .where('isFilled', '==', false)
//     .where('isCancelled', '==', false) as Query<LimitBet>
//   if (answerId) {
//     return q.where('answerId', '==', answerId)
//   }
//   return q
// }

/*WRAPPED*/ export const _getUnfilledBetsAndUserBalances = (
  contract: Contract,
  playgroundState: PlaygroundState,
  answerId?: string
) => {
  // const unfilledBets = await trans.get(
  //   getUnfilledBetsQuery(contractDoc, answerId)
  // )
  let unfilledBets = playgroundState.getUnfilledBetsByContractId(contract.id)

  if (answerId !== undefined) {
    unfilledBets = unfilledBets.filter((bet) => bet.answerId === answerId)
  }

  // Get balance of all users with open limit orders.
  // const userDocs =
  //   userIds.length === 0
  //     ? []
  //     : await trans.getAll(
  //         ...userIds.map((userId) => firestore.doc(`users/${userId}`))
  //       )
  const userIds = uniq(unfilledBets.map((bet) => bet.userId))

  // const users = filterDefined(userDocs.map((doc) => doc.data() as User))
  const users = userIds.map((userId) => playgroundState.getUser(userId))
  const balanceByUserId = Object.fromEntries(
    users.map((user) => [user.id, user.balance])
  )

  return { unfilledBets, balanceByUserId }
}
/*LOG2   */ export const getUnfilledBetsAndUserBalances = logCall('Entering ' + codeUrl('getUnfilledBetsAndUserBalances()', github_file_url, 412), _getUnfilledBetsAndUserBalances);

type maker = {
  bet: LimitBet
  amount: number
  shares: number
  timestamp: number
}
/*WRAPPED*/ export const _updateMakers = (
  makers: maker[],
  contract: Contract,
  takerBetId: string,
  playgroundState: PlaygroundState
) => {
  const makersByBet = groupBy(makers, (maker) => maker.bet.id)
  for (const makers of Object.values(makersByBet)) {
    const bet = makers[0].bet
    const newFills = makers.map((maker) => {
      const { amount, shares, timestamp } = maker
      return { amount, shares, matchedBetId: takerBetId, timestamp }
    })
    const fills = [...bet.fills, ...newFills]
    const totalShares = sumBy(fills, 'shares')
    const totalAmount = sumBy(fills, 'amount')
    const isFilled = floatingEqual(totalAmount, bet.orderAmount)

    // trans.update(contractDoc.collection('bets').doc(bet.id), {
    //   fills,
    //   isFilled,
    //   amount: totalAmount,
    //   shares: totalShares,
    // })
    bet.fills = fills
    bet.isFilled = isFilled
    bet.amount = totalAmount
    bet.shares = totalShares
    window.logger.log('Updated a maker\'s limit order', bet)
  }

  // Deduct balance of makers.
  const spentByUser = mapValues(
    groupBy(makers, (maker) => maker.bet.userId),
    (makers) => sumBy(makers, (maker) => maker.amount)
  )
  for (const [userId, spent] of Object.entries(spentByUser)) {
    // const userDoc = firestore.collection('users').doc(userId)
    // trans.update(userDoc, { balance: FieldValue.increment(-spent) })
    playgroundState.getUser(userId).balance -= spent
    window.logger.log(`Updated user ${userId} balance from ${playgroundState.getUser(userId).balance + spent} to ${playgroundState.getUser(userId).balance} (${-spent})`)
  }
}
/*LOG2   */ export const updateMakers = logCall('Entering ' + codeUrl('updateMakers()', github_file_url, 444), _updateMakers);
