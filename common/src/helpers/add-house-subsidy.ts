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