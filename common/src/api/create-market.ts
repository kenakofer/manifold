const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/backend/api/src/create-market.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/backend/api/src/create-market.ts'
const github_path = 'backend/api/src/create-market.ts'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; } }

import { MAX_ANSWERS } from '../answer'
import { z } from 'zod'
import { validate } from './helpers'
import {
  getCpmmInitialLiquidity,
  HOUSE_LIQUIDITY_PROVIDER_ID,
} from '../antes'
import {
  add_answers_mode,
  Contract,
  CPMMBinaryContract,
  CPMMMultiContract,
  CREATEABLE_OUTCOME_TYPES,
  MAX_QUESTION_LENGTH,
  NO_CLOSE_TIME_TYPES,
  OutcomeType,
  VISIBILITIES,
} from '../contract'
import { getAnte } from '../economy'
import { getNewContract } from '../new-contract'
import { getPseudoProbability } from '../pseudo-numeric'
import {
  getAvailableBalancePerQuestion,
  marketCreationCosts,
  User,
} from '../user'
import { STONK_INITIAL_PROB } from '../stonk'
import { slugify } from '../util/slugify';

/*WRAPPED*/ export function _createmarket (body, userId) {
  const contract = createMarketHelper(body, userId)
  return contract
}
/*LOG2   */ export const createmarket = logCall('Entering ' + codeUrl('createmarket()', github_file_url, 51), _createmarket);

/*WRAPPED*/ export function _createMarketHelper(body: any, userId: string) {
  const {
    question,
    description,
    descriptionHtml,
    descriptionMarkdown,
    descriptionJson,
    closeTime: closeTimeRaw,
    outcomeType,
    groupIds,
    visibility,
    extraLiquidity,
    isTwitchContract,
    utcOffset,
    min,
    max,
    initialProb,
    isLogScale,
    answers,
    addAnswersMode,
    shouldAnswersSumToOne,
    totalBounty,
    loverUserId1,
    loverUserId2,
  } = validateMarketBody(body)

  const user = window.pState.getUser(userId)
  if (!user) window.logger.throw("APIError", "(401) Your account was not found")

  const hasOtherAnswer = addAnswersMode !== 'DISABLED' && shouldAnswersSumToOne
  const numAnswers = (answers?.length ?? 0) + (hasOtherAnswer ? 1 : 0)
  const ante =
    (totalBounty ?? getAnte(outcomeType, numAnswers)) + (extraLiquidity ?? 0)

  if (ante < 1) window.logger.throw('APIError', '(400) Ante must be at least 1')

  const closeTime = getCloseTimestamp(
    closeTimeRaw,
    question,
    outcomeType,
    utcOffset
  )

  if (user.isBannedFromPosting) window.logger.throw("APIError", "(403) You are banned")

  const { amountSuppliedByUser, amountSuppliedByHouse } = marketCreationCosts(
    user,
    ante
  )

  if (ante > getAvailableBalancePerQuestion(user)) window.logger.throw("APIError", `(403) Balance must be at least ${amountSuppliedByUser}.`)

  const contract = getNewContract(
    window.pState.getNextContractId(),
    slugify(question),
    user,
    question,
    outcomeType,
    description ?? "",
    initialProb ?? 0,
    ante,
    closeTime,
    visibility,
    isTwitchContract,
    min ?? 0,
    max ?? 0,
    isLogScale ?? false,
    answers ?? [],
    addAnswersMode,
    shouldAnswersSumToOne,
    loverUserId1,
    loverUserId2,
  )

  const houseId = HOUSE_LIQUIDITY_PROVIDER_ID
  runCreateMarketTxn(
    contract,
    ante,
    user
  )

  window.logger.log(`created contract "${contract.id}" for`, user.username)
  window.logger.log('on', question)
  window.logger.log('with ante', ante)

  generateAntes(user, contract, outcomeType, ante)

  return contract
}
/*LOG2   */ export const createMarketHelper = logCall('Entering ' + codeUrl('createMarketHelper()', github_file_url, 55), _createMarketHelper);

/*WRAPPED*/ const _runCreateMarketTxn = async (
  contract: Contract,
  ante: number,
  user: User,
) => {
  const { amountSuppliedByUser, amountSuppliedByHouse } = marketCreationCosts(
    user,
    ante
  )

  if (contract.outcomeType !== 'BOUNTIED_QUESTION') {
    if (amountSuppliedByHouse > 0) {
      // trans.update(houseDoc.ref, {
      //   balance: FieldValue.increment(-amountSuppliedByHouse),
      //   totalDeposits: FieldValue.increment(-amountSuppliedByHouse),
      // })
      window.pState.bank.balance -= amountSuppliedByHouse
      window.logger.log(`Decreasing house balance by ${amountSuppliedByHouse} to ${window.pState.bank.balance}`)
      // window.pState.bank.totalDeposits -= amountSuppliedByHouse TODO what would totalDeposits even mean for the bank?
    }

    if (amountSuppliedByUser > 0) {
      // TODO TXN
      user.balance -= amountSuppliedByUser
      window.logger.log(`Decreasing ${user.username}'s balance by ${amountSuppliedByUser} to ${user.balance}`)
      user.totalDeposits -= amountSuppliedByUser
      window.logger.log(`Decreasing ${user.username}'s totalDeposits by ${amountSuppliedByUser} to ${user.totalDeposits}`)
    }
  } else {
    // Even if their debit is 0, it seems important that the user posts the bounty
    // await runPostBountyTxn(
    //   trans,
    //   {
    //     fromId: user.id,
    //     fromType: 'USER',
    //     toId: contract.id,
    //     toType: 'CONTRACT',
    //     amount: amountSuppliedByUser,
    //     token: 'M$',
    //     category: 'BOUNTY_POSTED',
    //   },
    //   contractRef,
    //   userDocRef
    // )

    // window.pState.runNewTransaction({
    //     fromId: user.id,
    //     fromType: 'USER',
    //     toId: contract.id,
    //     toType: 'CONTRACT',
    //     amount: amountSuppliedByUser,
    //     token: 'M$',
    //     category: 'BOUNTY_POSTED',
    // })


    // if (amountSuppliedByHouse > 0 && houseDoc)
    //   await runPostBountyTxn(
    //     trans,
    //     {
    //       fromId: houseDoc.id,
    //       fromType: 'USER',
    //       toId: contract.id,
    //       toType: 'CONTRACT',
    //       amount: amountSuppliedByHouse,
    //       token: 'M$',
    //       category: 'BOUNTY_ADDED',
    //     },
    //     contractRef,
    //     houseDoc.ref
    //   )

  }

  if (amountSuppliedByHouse > 0) {
    // trans.update(userDocRef, {
    //   freeQuestionsCreated: FieldValue.increment(1),
    // })
    user.freeQuestionsCreated += 1
    window.logger.log(`House supplied funds. This is ${user.username}'s free question #${user.freeQuestionsCreated}`)
  }

  return contract
}
/*LOG2   */ const runCreateMarketTxn = logCall('Entering ' + codeUrl('runCreateMarketTxn()', github_file_url, 213), _runCreateMarketTxn);

/*WRAPPED*/ function _getCloseTimestamp(
  closeTime: number | Date | undefined,
  question: string,
  outcomeType: OutcomeType,
  utcOffset?: number
): number | undefined {
  return closeTime
    ? typeof closeTime === 'number'
      ? closeTime
      : closeTime.getTime()
    : NO_CLOSE_TIME_TYPES.includes(outcomeType)
    ? undefined
    : Date.now() + 7 * 24 * 60 * 60 * 1000
}
/*LOG2   */ const getCloseTimestamp = logCall('Entering ' + codeUrl('getCloseTimestamp()', github_file_url, 305), _getCloseTimestamp);

/*WRAPPED*/ function _validateMarketBody(body: any) {
  const {
    question,
    description,
    descriptionHtml,
    descriptionMarkdown,
    descriptionJson,
    closeTime,
    outcomeType,
    groupIds,
    visibility = 'public',
    isTwitchContract,
    utcOffset,
    loverUserId1,
    loverUserId2,
  } = validate(bodySchema, body)

  let min: number | undefined,
    max: number | undefined,
    initialProb: number | undefined,
    isLogScale: boolean | undefined,
    answers: string[] | undefined,
    addAnswersMode: add_answers_mode | undefined,
    shouldAnswersSumToOne: boolean | undefined,
    totalBounty: number | undefined,
    extraLiquidity: number | undefined

  if (outcomeType === 'PSEUDO_NUMERIC') {
    let initialValue
    ;({ min, max, initialValue, isLogScale, extraLiquidity } = validate(
      numericSchema,
      body
    ))
    if (max - min <= 0.01 || initialValue <= min || initialValue >= max) {
      window.logger.log('APIError', '(400) Invalid range.')
      throw new Error('APIError (400) Invalid range.')
    }

    initialProb = getPseudoProbability(initialValue, min, max, isLogScale) * 100

    if (initialProb < 1 || initialProb > 99)
      if (outcomeType === 'PSEUDO_NUMERIC')
        window.logger.throw('APIError', `(400) Initial value is too ${initialProb < 1 ? 'low' : 'high'}`)
      else
        window.logger.throw('APIError', '(400) Invalid initial probability.')

  }
  if (outcomeType === 'STONK') {
    initialProb = STONK_INITIAL_PROB
  }

  if (outcomeType === 'BINARY') {
    ;({ initialProb, extraLiquidity } = validate(binarySchema, body))
  }

  if (outcomeType === 'MULTIPLE_CHOICE') {
    ;({ answers, addAnswersMode, shouldAnswersSumToOne, extraLiquidity } =
      validate(multipleChoiceSchema, body))
    if (answers.length < 2 && addAnswersMode === 'DISABLED')
      window.logger.throw('APIError', '(400) Multiple choice markets must have at least 2 answers if adding answers is disabled.')
  }

  if (outcomeType === 'BOUNTIED_QUESTION') {
      window.logger.throw('PlaygroundError', 'Bountied questions are not supported in the playground')
  }

  if (outcomeType === 'POLL') {
    ;({ answers } = validate(pollSchema, body))
  }
  return {
    question,
    description,
    descriptionHtml,
    descriptionMarkdown,
    descriptionJson,
    closeTime,
    outcomeType,
    groupIds,
    visibility,
    extraLiquidity,
    isTwitchContract,
    utcOffset,
    min,
    max,
    initialProb,
    isLogScale,
    answers,
    addAnswersMode,
    shouldAnswersSumToOne,
    totalBounty,
    loverUserId1,
    loverUserId2,
  }
}
/*LOG2   */ const validateMarketBody = logCall('Entering ' + codeUrl('validateMarketBody()', github_file_url, 342), _validateMarketBody);

/*WRAPPED*/ async function _generateAntes(
  user: User,
  contract: Contract,
  outcomeType: string,
  ante: number
) {
  if (
    outcomeType === 'BINARY' ||
    outcomeType === 'PSEUDO_NUMERIC' ||
    outcomeType === 'STONK' ||
    outcomeType === 'MULTIPLE_CHOICE'
  ) {

    const lp = getCpmmInitialLiquidity(
      user,
      contract as CPMMBinaryContract | CPMMMultiContract,
      'myAnteId', //TODO
      ante
    )
  }
}
/*LOG2   */ const generateAntes = logCall('Entering ' + codeUrl('generateAntes()', github_file_url, 499), _generateAntes);

const bodySchema = z.object({
  question: z.string().min(1).max(MAX_QUESTION_LENGTH),
  description: z.string().optional(),
  descriptionHtml: z.string().optional(),
  descriptionMarkdown: z.string().optional(),
  descriptionJson: z.string().optional(),
  closeTime: z
    .union([z.date(), z.number()])
    .refine(
      (date) => (typeof date === 'number' ? date : date.getTime()) > Date.now(),
      'Close time must be in the future.'
    )
    .optional(),
  outcomeType: z.enum(CREATEABLE_OUTCOME_TYPES),
  groupIds: z.array(z.string().min(1)).optional(),
  visibility: z.enum(VISIBILITIES).optional(),
  isTwitchContract: z.boolean().optional(),
  utcOffset: z.number().optional(),
  loverUserId1: z.string().optional(),
  loverUserId2: z.string().optional(),
})

export type CreateMarketParams = z.infer<typeof bodySchema> &
  (
    | z.infer<typeof binarySchema>
    | z.infer<typeof numericSchema>
    | z.infer<typeof multipleChoiceSchema>
    | z.infer<typeof bountiedQuestionSchema>
    | z.infer<typeof pollSchema>
  )
export type CreateableOutcomeType = CreateMarketParams['outcomeType']

const binarySchema = z.object({
  initialProb: z.number().min(1).max(99),
  extraLiquidity: z.number().min(1).optional(),
})

const numericSchema = z.object({
  min: z.number().safe(),
  max: z.number().safe(),
  initialValue: z.number().safe(),
  isLogScale: z.boolean().optional(),
  extraLiquidity: z.number().min(1).optional(),
})

const multipleChoiceSchema = z.object({
  answers: z.string().trim().min(1).array().max(MAX_ANSWERS),
  addAnswersMode: z
    .enum(['DISABLED', 'ONLY_CREATOR', 'ANYONE'])
    .optional()
    .default('DISABLED'),
  shouldAnswersSumToOne: z.boolean().optional(),
  extraLiquidity: z.number().min(1).optional(),
})

const bountiedQuestionSchema = z.object({
  totalBounty: z.number().min(1),
})

const pollSchema = z.object({
  answers: z.string().trim().min(1).array().min(2).max(MAX_ANSWERS),
})
