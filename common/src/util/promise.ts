import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/promise.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/promise.ts'
export type RetryPolicy = {
  initialBackoffSec: number
  retries: number
}

/*WRAPPED*/ export const _delay = (ms: number) => {
  return new Promise<void>((resolve) => setTimeout(() => resolve(), ms))
}
/*LOG2   */ export const delay = logCall('Entering ' + codeUrl('delay()', github_file_url, 6), _delay);

/*WRAPPED*/ export async function _withRetries<T>(q: PromiseLike<T>, policy?: RetryPolicy) {
  let err: Error | undefined
  let delaySec = policy?.initialBackoffSec ?? 5
  const maxRetries = policy?.retries ?? 5
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await q
    } catch (e) {
      err = e as Error
      if (i < maxRetries) {
        console.debug(`Error: ${err.message} - Retrying in ${delaySec}s.`)
        await delay(delaySec * 1000)
        delaySec *= 2
      }
    }
  }
  throw err
}
/*LOG2   */ export const withRetries = logCall('Entering ' + codeUrl('withRetries()', github_file_url, 10), _withRetries);

/*WRAPPED*/ export const _mapAsyncChunked = async <T, U>(
  items: T[],
  f: (item: T, index: number) => Promise<U>,
  chunkSize = 100
) => {
  const results: U[] = []

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    const chunkResults = await Promise.all(
      chunk.map((item, index) => f(item, i + index))
    )
    results.push(...chunkResults)
  }

  return results
}
/*LOG2   */ export const mapAsyncChunked = logCall('Entering ' + codeUrl('mapAsyncChunked()', github_file_url, 29), _mapAsyncChunked);

/*WRAPPED*/ export const _mapAsync = <T, U>(
  items: T[],
  f: (item: T, index: number) => Promise<U>,
  maxConcurrentRequests = 100
) => {
  let index = 0
  let currRequests = 0
  const results: U[] = []

  // The following is a hack to fix a Node bug where the process exits before
  // the promise is resolved.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const intervalId = setInterval(() => {}, 10000)

  return new Promise((resolve: (results: U[]) => void, reject) => {
    const doWork = () => {
      while (index < items.length && currRequests < maxConcurrentRequests) {
        const itemIndex = index
        f(items[itemIndex], itemIndex)
          .then((data) => {
            results[itemIndex] = data
            currRequests--
            if (index === items.length && currRequests === 0) resolve(results)
            else doWork()
          })
          .catch(reject)

        index++
        currRequests++
      }
    }

    if (items.length === 0) resolve([])
    else doWork()
  }).finally(() => clearInterval(intervalId))
}
/*LOG2   */ export const mapAsync = logCall('Entering ' + codeUrl('mapAsync()', github_file_url, 47), _mapAsync);
