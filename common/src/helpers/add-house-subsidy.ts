import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/backend/shared/src/helpers/add-house-subsidy.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/backend/shared/src/helpers/add-house-subsidy.ts'
import { CPMMContract, CPMMMultiContract } from '../contract'
import {
  DEV_HOUSE_LIQUIDITY_PROVIDER_ID,
  HOUSE_LIQUIDITY_PROVIDER_ID,
} from '../antes'
import { getNewLiquidityProvision } from '../add-liquidity'

/*WRAPPED*/ export const _addHouseSubsidy = (contract: CPMMContract | CPMMMultiContract, amount: number) => {
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
/*LOG2   */ export const addHouseSubsidy = logCall('Entering ' + codeUrl('addHouseSubsidy()', github_file_url, 14), _addHouseSubsidy);

/*WRAPPED*/ export const _addHouseSubsidyToAnswer = (
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
/*LOG2   */ export const addHouseSubsidyToAnswer = logCall('Entering ' + codeUrl('addHouseSubsidyToAnswer()', github_file_url, 45), _addHouseSubsidyToAnswer);
