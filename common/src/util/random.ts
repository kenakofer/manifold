import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/random.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/random.ts'
/*WRAPPED*/ export const _randomString = (length = 12) =>
  Math.random()
    .toString(16)
    .substring(2, length + 2)

/*WRAPPED*/ export function _genHash(str: string) {
  // xmur3

  // Route around compiler bug by using object?
  const o = { h: 1779033703 ^ str.length }

  for (let i = 0; i < str.length; i++) {
    let h = o.h
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
    o.h = h
  }
  return function () {
    let h = o.h
    h = Math.imul(h ^ (h >>> 16), 2246822507)
    h = Math.imul(h ^ (h >>> 13), 3266489909)
    return (h ^= h >>> 16) >>> 0
  }
}
/*LOG2   */ export const genHash = logCall('Entering ' + codeUrl('genHash()', github_file_url, 6), _genHash);
/*LOG2   */ export const randomString = logCall('Entering ' + codeUrl('randomString()', github_file_url, 1), _randomString);

/*WRAPPED*/ export function _createRNG(seed: string) {
  // https://stackoverflow.com/a/47593316/1592933

  const gen = genHash(seed)
  let [a, b, c, d] = [gen(), gen(), gen(), gen()]

  // sfc32
  return function () {
    a >>>= 0
    b >>>= 0
    c >>>= 0
    d >>>= 0
    let t = (a + b) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    d = (d + 1) | 0
    t = (t + d) | 0
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }
}
/*LOG2   */ export const createRNG = logCall('Entering ' + codeUrl('createRNG()', github_file_url, 26), _createRNG);

/*WRAPPED*/ export const _shuffle = (array: unknown[], rand: () => number) => {
  for (let i = 0; i < array.length; i++) {
    const swapIndex = i + Math.floor(rand() * (array.length - i))
    ;[array[i], array[swapIndex]] = [array[swapIndex], array[i]]
  }
}
/*LOG2   */ export const shuffle = logCall('Entering ' + codeUrl('shuffle()', github_file_url, 49), _shuffle);
