import { NestedLogger } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; } }

import { z } from 'zod'
import { groupBy, mapValues, sumBy, uniq } from 'lodash'
import { Contract, CPMM_MIN_POOL_QTY } from '../contract'
import { User } from '../user'
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
import { filterDefined } from '../util/array'
import { Answer } from '../answer'
import { CpmmState, getCpmmProbability } from '../calculate-cpmm'
import { validate } from './helpers';
import { PlaygroundState } from '../playground/global-state';

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

export function placebet (req, uid, isApi, playgroundState) {
  window.logger.log('Simulating placebet endpoint')
  window.logger.in()
  const bet = placeBetMain(req.body, uid, isApi, playgroundState)
  window.logger.out()
  window.logger.log('Returning bet', bet)
  return bet
}

export const placeBetMain = async (
  body: unknown,
  uid: string,
  isApi: boolean,
  playgroundState: PlaygroundState
) => {
  const { amount, contractId, replyToCommentId } = validate(bodySchema, body)

  // Create and run function to get result
  const result = async () => {
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
    } = await (async (): Promise<
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
      }
    > => {
    // const {
    //   newBet,
    //   otherBetResults,
    //   newPool,
    //   newTotalShares,
    //   newTotalBets,
    //   newTotalLiquidity,
    //   newP,
    //   makers,
    //   ordersToCancel,
    // } = await async function () {
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
          await getUnfilledBetsAndUserBalances(contract, playgroundState)

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
          await getUnfilledBetsAndUserBalances(
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
    const bets = playgroundState.getBetsByContractId(contract.id)

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
    window.logger.log(`Created new bet document for ${user.username} - auth ${uid}.`)

    if (makers) {
      updateMakers(makers, contract, playgroundState)
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
        // Multi-cpmm-1 contract
        // trans.update(
        //   contractDoc,
        //   removeUndefinedProps({
        //     volume: volume + newBet.amount,
        //   })
        // )
        contract.volume += newBet.amount;

        if (newPool) {
          const { YES: poolYes, NO: poolNo } = newPool
          const prob = getCpmmProbability(newPool, 0.5)
          trans.update(
            contractDoc.collection('answersCpmm').doc(newBet.answerId),
            removeUndefinedProps({
              poolYes,
              poolNo,
              prob,
            })
          )
        }
      } else {
        trans.update(
          contractDoc,
          removeUndefinedProps({
            pool: newPool,
            p: newP,
            totalShares: newTotalShares,
            totalBets: newTotalBets,
            totalLiquidity: newTotalLiquidity,
            collectedFees: addObjects(newBet.fees, collectedFees),
            volume: volume + newBet.amount,
          })
        )
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
            const betDoc = contractDoc.collection('bets').doc()
            trans.create(betDoc, {
              id: betDoc.id,
              userId: user.id,
              userAvatarUrl: user.avatarUrl,
              userUsername: user.username,
              userName: user.name,
              isApi,
              ...bet,
            })
            const { YES: poolYes, NO: poolNo } = cpmmState.pool
            const prob = getCpmmProbability(cpmmState.pool, 0.5)
            trans.update(
              contractDoc.collection('answersCpmm').doc(answer.id),
              removeUndefinedProps({
                poolYes,
                poolNo,
                prob,
              })
            )
          }
          updateMakers(makers, contract, playgroundState)
          for (const bet of ordersToCancel) {
            trans.update(contractDoc.collection('bets').doc(bet.id), {
              isCancelled: true,
            })
          }
        }
      }

      window.logger.log(`Updated contract ${contract.slug} properties - auth ${uid}.`)
    }

    return { newBet, betId: betDoc.id, contract, makers, ordersToCancel, user }
  }

  window.logger.log(`Main transaction finished - auth ${uid}.`)

  const { newBet, betId, contract, makers, ordersToCancel, user } = result
  const { mechanism } = contract

  if (
    (mechanism === 'cpmm-1' || mechanism === 'cpmm-multi-1') &&
    newBet.amount !== 0
  ) {
    const userIds = uniq([
      uid,
      ...(makers ?? []).map((maker) => maker.bet.userId),
    ])
    await Promise.all(userIds.map((userId) => redeemShares(userId, contract)))
    window.logger.log(`Share redemption transaction finished - auth ${uid}.`)
  }
  if (ordersToCancel) {
    await Promise.all(
      ordersToCancel.map((order) => {
        createLimitBetCanceledNotification(
          user,
          order.userId,
          order,
          makers?.find((m) => m.bet.id === order.id)?.amount ?? 0,
          contract
        )
      })
    )
  }

  return { ...newBet, betId: betId }
}

const firestore = admin.firestore()

const getUnfilledBetsQuery = (
  contractDoc: DocumentReference,
  answerId?: string
) => {
  const q = contractDoc
    .collection('bets')
    .where('isFilled', '==', false)
    .where('isCancelled', '==', false) as Query<LimitBet>
  if (answerId) {
    return q.where('answerId', '==', answerId)
  }
  return q
}

export const getUnfilledBetsAndUserBalances = async (
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

type maker = {
  bet: LimitBet
  amount: number
  shares: number
  timestamp: number
}
export const updateMakers = (
  makers: maker[],
  contract: Contract,
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

    window.logger.log('Updated a matched limit order.')
    trans.update(contractDoc.collection('bets').doc(bet.id), {
      fills,
      isFilled,
      amount: totalAmount,
      shares: totalShares,
    })
  }

  // Deduct balance of makers.
  const spentByUser = mapValues(
    groupBy(makers, (maker) => maker.bet.userId),
    (makers) => sumBy(makers, (maker) => maker.amount)
  )
  for (const [userId, spent] of Object.entries(spentByUser)) {
    const userDoc = firestore.collection('users').doc(userId)
    trans.update(userDoc, { balance: FieldValue.increment(-spent) })
  }
}