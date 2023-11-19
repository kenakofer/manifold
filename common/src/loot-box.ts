import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logCall, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/loot-box.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/loot-box.ts'
import { clamp, shuffle } from 'lodash'

import { BinaryContract } from './contract'
import { User } from './user'
import { Bet } from './bet'
import { noFees } from './fees'
import { getProbability } from './calculate'

export const LOOTBOX_COST = 100
export const LOOTBOX_MAX = 1000
const LOOTBOX_MIN = 50

export interface LootBoxItem {
  contract: BinaryContract
  outcome: 'YES' | 'NO'
  amount: number
  shares: number
}

export type LootBox = LootBoxItem[]

/*WRAPPED*/ export const _createLootBox = (contracts: BinaryContract[]): LootBox => {
  const boxValue = getBoxValue()

  const n = Math.ceil(Math.random() * 4)
  const selectedContracts = shuffle(contracts).slice(0, n)
  const weights = generateWeights(selectedContracts.length)

  const box = selectedContracts.map((contract, i) => {
    const outcome: 'YES' | 'NO' = Math.random() > 0.5 ? 'YES' : 'NO'
    const amount = Math.round(weights[i] * boxValue)
    const prob = getProbability(contract)
    const shares = outcome === 'YES' ? amount / prob : amount / (1 - prob)

    return { contract, outcome, amount, shares }
  })

  return box
}
/*LOG2   */ export const createLootBox = logCall('Entering ' + codeUrl('createLootBox()', github_file_url, 22), _createLootBox);

/*WRAPPED*/ const _getBoxValue = () => {
  return Math.random() > 0.5 ? winDistribution() : loseDistribution()
}
/*LOG2   */ const getBoxValue = logCall('Entering ' + codeUrl('getBoxValue()', github_file_url, 41), _getBoxValue);

/*WRAPPED*/ const _winDistribution = () =>
  clamp(
    Math.round(
      LOOTBOX_COST + customLogNormalSample(20, LOOTBOX_MAX - LOOTBOX_COST)
    ),
    LOOTBOX_COST,
    LOOTBOX_MAX
  )

/*WRAPPED*/ const _loseDistribution = () =>
  clamp(
    Math.round(normalSample(LOOTBOX_MIN + 5, 10)),
    LOOTBOX_MIN,
    0.7 * LOOTBOX_COST
  )


/*WRAPPED*/ export const _lootBoxExpectation = () => {
  let e = 0
  for (let i = 0; i < 1e6; i++) e += getBoxValue()
  return e / 1e6
}
/*LOG2   */ export const lootBoxExpectation = logCall('Entering ' + codeUrl('lootBoxExpectation()', github_file_url, 62), _lootBoxExpectation);
/*LOG2   */ const loseDistribution = logCall('Entering ' + codeUrl('loseDistribution()', github_file_url, 54), _loseDistribution);
/*LOG2   */ const winDistribution = logCall('Entering ' + codeUrl('winDistribution()', github_file_url, 45), _winDistribution);

/*WRAPPED*/ function _normalSample(mean = 0, stdev = 1) {
  const u = 1 - Math.random() // Converting [0,1) to (0,1]
  const v = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return z * stdev + mean
}
/*LOG2   */ const normalSample = logCall('Entering ' + codeUrl('normalSample()', github_file_url, 68), _normalSample);

/*WRAPPED*/ function _logNormalSample(mu: number, sigma: number) {
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
  return Math.exp(mu + sigma * z0)
}
/*LOG2   */ const logNormalSample = logCall('Entering ' + codeUrl('logNormalSample()', github_file_url, 75), _logNormalSample);

/*WRAPPED*/ function _customLogNormalSample(mean: number, targetMax: number) {
  const mu = Math.log(mean) - 0.5 * Math.log(1 + (targetMax - mean) / mean)
  const sigma = Math.sqrt(Math.log(1 + (targetMax - mean) / mean))
  return logNormalSample(mu, sigma)
}
/*LOG2   */ const customLogNormalSample = logCall('Entering ' + codeUrl('customLogNormalSample()', github_file_url, 82), _customLogNormalSample);

/*WRAPPED*/ function _generateWeights(n: number) {
  const randomProbabilities = new Array(n)
  let remainingProb = 1

  for (let i = 0; i < n - 1; i++) {
    randomProbabilities[i] =
      remainingProb * clamp(Math.random(), 1 / (2 * n), 2 / n)
    remainingProb -= randomProbabilities[i]
  }

  randomProbabilities[n - 1] = remainingProb

  return shuffle(randomProbabilities)
}
/*LOG2   */ const generateWeights = logCall('Entering ' + codeUrl('generateWeights()', github_file_url, 88), _generateWeights);

/*WRAPPED*/ export const _createLootBet = (
  user: User,
  contract: BinaryContract,
  outcome: 'YES' | 'NO',
  prob: number,
  amount: number,
  shares: number
): Omit<Bet, 'id'> => {
  return {
    createdTime: Date.now(),
    userId: user.id,
    userAvatarUrl: user.avatarUrl,
    userUsername: user.username,
    userName: user.name,
    amount: amount,
    shares,
    isFilled: true,
    isCancelled: false,
    contractId: contract.id,
    outcome,
    probBefore: prob,
    probAfter: prob,
    loanAmount: 0,
    fees: noFees,
    isAnte: false,
    isRedemption: false,
    isChallenge: true,
    visibility: contract.visibility,
  }
}
/*LOG2   */ export const createLootBet = logCall('Entering ' + codeUrl('createLootBet()', github_file_url, 103), _createLootBet);
