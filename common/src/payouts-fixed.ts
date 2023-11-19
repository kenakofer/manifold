import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/payouts-fixed.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/payouts-fixed.ts'
import { sumBy } from 'lodash'
import { Bet } from './bet'
import { getCpmmLiquidityPoolWeights } from './calculate-cpmm'
import { CPMMContract, CPMMMultiContract } from './contract'
import { noFees } from './fees'
import { LiquidityProvision } from './liquidity-provision'

/*WRAPPED*/ export const _getFixedCancelPayouts = (
  bets: Bet[],
  liquidities: LiquidityProvision[]
) => {
  const liquidityPayouts = liquidities.map((lp) => ({
    userId: lp.userId,
    payout: lp.amount,
  }))

  const payouts = bets
    .filter((b) => !b.isAnte)
    .map((bet) => ({
      userId: bet.userId,
      payout: bet.amount,
    }))

  const creatorPayout = 0

  return { payouts, creatorPayout, liquidityPayouts, collectedFees: noFees }
}
/*LOG2   */ export const getFixedCancelPayouts = logCall('Entering ' + codeUrl('getFixedCancelPayouts()', github_file_url, 8), _getFixedCancelPayouts);

/*WRAPPED*/ export const _getStandardFixedPayouts = (
  outcome: string,
  contract:
    | CPMMContract
    | (CPMMMultiContract & { shouldAnswersSumToOne: false }),
  bets: Bet[],
  liquidities: LiquidityProvision[]
) => {
  const winningBets = bets.filter((bet) => bet.outcome === outcome)

  const payouts = winningBets.map(({ userId, shares }) => ({
    userId,
    payout: shares,
  }))

  const { collectedFees } = contract
  const creatorPayout = collectedFees.creatorFee
  const liquidityPayouts =
    contract.mechanism === 'cpmm-1'
      ? getLiquidityPoolPayouts(contract, outcome, liquidities)
      : []

  return { payouts, creatorPayout, liquidityPayouts, collectedFees }
}
/*LOG2   */ export const getStandardFixedPayouts = logCall('Entering ' + codeUrl('getStandardFixedPayouts()', github_file_url, 29), _getStandardFixedPayouts);

/*WRAPPED*/ export const _getMultiFixedPayouts = (
  contract: CPMMMultiContract,
  resolutions: { [answerId: string]: number },
  bets: Bet[],
  liquidities: LiquidityProvision[]
) => {
  const payouts = bets
    .map(({ userId, shares, answerId, outcome }) => {
      const weight = answerId ? resolutions[answerId] ?? 0 : 0
      const outcomeWeight = outcome === 'YES' ? weight : 1 - weight
      const payout = shares * outcomeWeight
      return {
        userId,
        payout,
      }
    })
    .filter(({ payout }) => payout !== 0)

  const liquidityPayouts = getMultiLiquidityPoolPayouts(
    contract,
    resolutions,
    liquidities
  )

  return { payouts, liquidityPayouts, creatorPayout: 0, collectedFees: noFees }
}
/*LOG2   */ export const getMultiFixedPayouts = logCall('Entering ' + codeUrl('getMultiFixedPayouts()', github_file_url, 54), _getMultiFixedPayouts);

/*WRAPPED*/ export const _getLiquidityPoolPayouts = (
  contract: CPMMContract,
  outcome: string,
  liquidities: LiquidityProvision[]
) => {
  const { pool, subsidyPool } = contract
  const finalPool = pool[outcome] + (subsidyPool ?? 0)
  if (finalPool < 1e-3) return []

  const weights = getCpmmLiquidityPoolWeights(liquidities)

  return Object.entries(weights).map(([providerId, weight]) => ({
    userId: providerId,
    payout: weight * finalPool,
  }))
}
/*LOG2   */ export const getLiquidityPoolPayouts = logCall('Entering ' + codeUrl('getLiquidityPoolPayouts()', github_file_url, 81), _getLiquidityPoolPayouts);

/*WRAPPED*/ export const _getMultiLiquidityPoolPayouts = (
  contract: CPMMMultiContract,
  resolutions: { [answerId: string]: number },
  liquidities: LiquidityProvision[]
) => {
  const { answers } = contract
  const totalPayout = sumBy(answers, (answer) => {
    const weight = resolutions[answer.id] ?? 0
    const { poolYes, poolNo } = answer
    return weight * poolYes + (1 - weight) * poolNo
  })
  const weightsByUser = getCpmmLiquidityPoolWeights(liquidities)
  return Object.entries(weightsByUser)
    .map(([userId, weight]) => ({
      userId,
      payout: weight * totalPayout,
    }))
    .filter(({ payout }) => payout >= 1e-3)
}
/*LOG2   */ export const getMultiLiquidityPoolPayouts = logCall('Entering ' + codeUrl('getMultiLiquidityPoolPayouts()', github_file_url, 98), _getMultiLiquidityPoolPayouts);

/*WRAPPED*/ export const _getMktFixedPayouts = (
  contract:
    | CPMMContract
    | (CPMMMultiContract & { shouldAnswersSumToOne: false }),
  bets: Bet[],
  liquidities: LiquidityProvision[],
  resolutionProbability: number
) => {
  const { collectedFees } = contract
  const creatorPayout = collectedFees.creatorFee

  const outcomeProbs = {
    YES: resolutionProbability,
    NO: 1 - resolutionProbability,
  }

  const payouts = bets.map(({ userId, outcome, shares }) => {
    const p = outcomeProbs[outcome as 'YES' | 'NO'] ?? 0
    const payout = p * shares
    return { userId, payout }
  })

  const liquidityPayouts =
    contract.mechanism === 'cpmm-1'
      ? getLiquidityPoolProbPayouts(contract, outcomeProbs, liquidities)
      : []

  return { payouts, creatorPayout, liquidityPayouts, collectedFees }
}
/*LOG2   */ export const getMktFixedPayouts = logCall('Entering ' + codeUrl('getMktFixedPayouts()', github_file_url, 118), _getMktFixedPayouts);

/*WRAPPED*/ export const _getLiquidityPoolProbPayouts = (
  contract: CPMMContract,
  outcomeProbs: { [outcome: string]: number },
  liquidities: LiquidityProvision[]
) => {
  const { pool, subsidyPool } = contract

  const weightedPool = sumBy(
    Object.keys(pool),
    (o) => pool[o] * (outcomeProbs[o] ?? 0)
  )
  const finalPool = weightedPool + (subsidyPool ?? 0)
  if (finalPool < 1e-3) return []

  const weights = getCpmmLiquidityPoolWeights(liquidities)

  return Object.entries(weights).map(([providerId, weight]) => ({
    userId: providerId,
    payout: weight * finalPool,
  }))
}
/*LOG2   */ export const getLiquidityPoolProbPayouts = logCall('Entering ' + codeUrl('getLiquidityPoolProbPayouts()', github_file_url, 148), _getLiquidityPoolProbPayouts);
