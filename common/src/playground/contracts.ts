import { Contract } from '../contract'

export type ContractDictionary = { [key: string]: Contract };

export const getContracts = async (
  contractIds: string[],
  contract_dict: ContractDictionary
) => {
  if (contractIds.length === 0) {
    return [] as Contract[]
  }
    const filteredContracts = Object.values(contract_dict).filter(
        contract => contractIds.includes(contract.id)
    );
    return filteredContracts;
}