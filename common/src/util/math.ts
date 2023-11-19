import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/math.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/math.ts'
import { sortBy, sum } from 'lodash'

/*WRAPPED*/ export const _logInterpolation = (min: number, max: number, value: number) => {
  if (value <= min) return 0
  if (value >= max) return 1

  return Math.log(value - min + 1) / Math.log(max - min + 1)
}
/*LOG2   */ export const logInterpolation = logCall('Entering ' + codeUrl('logInterpolation()', github_file_url, 3), _logInterpolation);

/*WRAPPED*/ export const _logit = (x: number) => Math.log(x / (1 - x))

/*WRAPPED*/ export function _median(xs: number[]) {
  if (xs.length === 0) return NaN

  const sorted = sortBy(xs, (x) => x)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}
/*LOG2   */ export const median = logCall('Entering ' + codeUrl('median()', github_file_url, 12), _median);
/*LOG2   */ export const logit = logCall('Entering ' + codeUrl('logit()', github_file_url, 10), _logit);

/*WRAPPED*/ export function _average(xs: number[]) {
  return sum(xs) / xs.length
}
/*LOG2   */ export const average = logCall('Entering ' + codeUrl('average()', github_file_url, 23), _average);

export const EPSILON = 0.00000001

/*WRAPPED*/ export function _floatingEqual(a: number, b: number, epsilon = EPSILON) {
  return Math.abs(a - b) < epsilon
}
/*LOG2   */ export const floatingEqual = logCall('Entering ' + codeUrl('floatingEqual()', github_file_url, 29), _floatingEqual);

/*WRAPPED*/ export function _floatingGreaterEqual(a: number, b: number, epsilon = EPSILON) {
  return a + epsilon >= b
}
/*LOG2   */ export const floatingGreaterEqual = logCall('Entering ' + codeUrl('floatingGreaterEqual()', github_file_url, 33), _floatingGreaterEqual);

/*WRAPPED*/ export function _floatingLesserEqual(a: number, b: number, epsilon = EPSILON) {
  return a - epsilon <= b
}
/*LOG2   */ export const floatingLesserEqual = logCall('Entering ' + codeUrl('floatingLesserEqual()', github_file_url, 37), _floatingLesserEqual);
