import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logIndent, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/backend/shared/src/helpers/add-house-subsidy.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/backend/shared/src/helpers/add-house-subsidy.ts'
import { CPMMContract, CPMMMultiContract } from '../contract'
import {
  DEV_HOUSE_LIQUIDITY_PROVIDER_ID,
  HOUSE_LIQUIDITY_PROVIDER_ID,
} from '../antes'
import { getNewLiquidityProvision } from '../add-liquidity'

export const addHouseSubsidy = (contract: CPMMContract | CPMMMultiContract, amount: number) => {
  const providerId = HOUSE_LIQUIDITY_PROVIDER_ID

  const { newLiquidityProvision, newTotalLiquidity, newSubsidyPool } =
    getNewLiquidityProvision(
      providerId,
      amount,
      contract,
      'liquidityIDhere'
    )

  return { newLiquidityProvision, newTotalLiquidity, newSubsidyPool }
}

export const addHouseSubsidyToAnswer = (
  contract: CPMMContract | CPMMMultiContract,
  answerId: string,
  amount: number
) => {
  const providerId = HOUSE_LIQUIDITY_PROVIDER_ID


  const { newLiquidityProvision, newTotalLiquidity, newSubsidyPool } = getNewLiquidityProvision(
    providerId,
    amount,
    contract,
    'liquidityIDhere2',
    answerId
  )

  return { newLiquidityProvision, newTotalLiquidity, newSubsidyPool }
}