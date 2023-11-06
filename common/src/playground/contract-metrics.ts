import { chunk, Dictionary, flatMap, groupBy, uniqBy } from 'lodash'
import { getContracts } from './contracts'
import { Contract, CPMMContract } from '../contract'
import { ContractMetric } from '../contract-metric'

export type ContractMetricsDictionary = { [key: string]: ContractMetric };

export async function getUserContractMetrics(
  cm_dict: ContractMetricsDictionary,
  userId: string,
  contractId: string,
) {
  const metrics = Object.values(cm_dict).filter(
    (cm) => cm.userId === userId && cm.contractId === contractId
  )
  return metrics
}

export async function getCPMMContractUserContractMetrics(
  cm_dict: ContractMetricsDictionary,
  contractId: string,
  limit: number,
  answerId: string | null,
) {
  async function fetchOutcomeMetrics(outcome: 'Yes' | 'No') {
    // const hasSharesColumn = `has_${outcome}_shares`
    // const totalSharesColumn = `total_shares_${outcome}`
    // let q = db
    //   .from('user_contract_metrics')
    //   .select('data')
    //   .eq('contract_id', contractId)
    //   .eq(hasSharesColumn, true)
    //   .order(totalSharesColumn, { ascending: false } as any)
    //   .limit(limit)
    // q = answerId ? q.eq('answer_id', answerId) : q.is('answer_id', null)
    // const { data, error } = await q

    // if (error) {
    //   throw error
    // }

    // return data.map((doc) => doc.data as ContractMetric)

    let metrics = Object.values(cm_dict).filter(
      (cm) => cm.contractId === contractId
        && cm.answerId === answerId
        && cm[`has${outcome}Shares`] === true
    )

    metrics = metrics.sort((a, b) => {
      return b.totalShares[outcome] - a.totalShares[outcome]
    })

    metrics = metrics.slice(0, limit)
  }

  try {
    const yesMetrics = await fetchOutcomeMetrics('Yes')
    const noMetrics = await fetchOutcomeMetrics('No')
    return {
      YES: yesMetrics,
      NO: noMetrics,
    }
  } catch (error) {
    console.error('Error fetching user contract metrics:', error)
    return { YES: [], NO: [] }
  }
}


export async function getContractMetricsCount(
  cm_dict: ContractMetricsDictionary,
  contractId: string,
  outcome?: 'Yes' | 'No',
  answerId?: string
) {
  // let q = db
  //   .from('user_contract_metrics')
  //   .select('*', { head: true, count: 'exact' })
  //   .eq('contract_id', contractId)
  //   .eq('has_shares', true)

  // q = answerId ? q.eq('answer_id', answerId) : q.is('answer_id', null)

  // if (outcome) {
  //   q = q.eq(`has_${outcome}_shares`, true)
  // }
  // const { count } = await run(q)

  const filtered_cm = Object.values(cm_dict).filter(
    (cm) => cm.contractId === contractId
      && cm.answerId === answerId
      && cm.hasShares === true
      && (cm.answerId ? cm.answerId === answerId : true)
      && (outcome ? cm[`has${outcome}Shares`] === true : true)
  )

  const count = filtered_cm.length

  return count
}
