import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/algos.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/algos.ts'
/*WRAPPED*/ export function _binarySearch(
  min: number,
  max: number,
  comparator: (x: number) => number
) {
  let mid = 0
  let i = 0
  while (true) {
    mid = min + (max - min) / 2

    // Break once we've reached max precision.
    if (mid === min || mid === max) break

    const comparison = comparator(mid)
    if (comparison === 0) break
    else if (comparison > 0) {
      max = mid
    } else {
      min = mid
    }

    i++
    if (i > 100000) {
      throw new Error(
        'Binary search exceeded max iterations' +
          JSON.stringify({ min, max, mid, i }, null, 2)
      )
    }
  }
  return mid
}
/*LOG2   */ export const binarySearch = logCall('Entering ' + codeUrl('binarySearch()', github_file_url, 1), _binarySearch);
