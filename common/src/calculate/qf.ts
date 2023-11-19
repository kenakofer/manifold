import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/calculate/qf.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/calculate/qf.ts'
// Functions for calculate quadratic funding amounts
import { QfTxn } from '../txn'
import { groupBy, mapValues, sumBy } from 'lodash'
// Note: none of this allows for undone payments

// Return a map of answer ids to totals
/*WRAPPED*/ export function _calculateTotals(txns: QfTxn[]) {
  const payTxns = txns.filter((txn) => txn.category === 'QF_PAYMENT')
  const grouped = groupBy(payTxns, 'data.answerId')
  return mapValues(grouped, (txns) => sumBy(txns, 'amount'))
}
/*LOG2   */ export const calculateTotals = logCall('Entering ' + codeUrl('calculateTotals()', github_file_url, 7), _calculateTotals);

/*WRAPPED*/ export function _totalPaid(txns: QfTxn[]) {
  const payTxns = txns.filter((txn) => txn.category === 'QF_PAYMENT')
  return sumBy(payTxns, 'amount')
}
/*LOG2   */ export const totalPaid = logCall('Entering ' + codeUrl('totalPaid()', github_file_url, 13), _totalPaid);
