import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/array.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/array.ts'
import { compact, flattenDeep, isEqual } from 'lodash'

/*WRAPPED*/ export function _filterDefined<T>(array: (T | null | undefined)[]) {
  return array.filter((item) => item !== null && item !== undefined) as T[]
}
/*LOG2   */ export const filterDefined = logCall('Entering ' + codeUrl('filterDefined()', github_file_url, 3), _filterDefined);

type Falsey = false | undefined | null | 0 | ''
type FalseyValueArray<T> = T | Falsey | FalseyValueArray<T>[]

/*WRAPPED*/ export function _buildArray<T>(...params: FalseyValueArray<T>[]) {
  return compact(flattenDeep(params)) as T[]
}
/*LOG2   */ export const buildArray = logCall('Entering ' + codeUrl('buildArray()', github_file_url, 10), _buildArray);

/*WRAPPED*/ export function _groupConsecutive<T, U>(xs: T[], key: (x: T) => U) {
  if (!xs.length) {
    return []
  }
  const result = []
  let curr = { key: key(xs[0]), items: [xs[0]] }
  for (const x of xs.slice(1)) {
    const k = key(x)
    if (!isEqual(k, curr.key)) {
      result.push(curr)
      curr = { key: k, items: [x] }
    } else {
      curr.items.push(x)
    }
  }
  result.push(curr)
  return result
}
/*LOG2   */ export const groupConsecutive = logCall('Entering ' + codeUrl('groupConsecutive()', github_file_url, 14), _groupConsecutive);
