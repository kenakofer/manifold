import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/edge/og.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/edge/og.ts'
// see https://vercel.com/docs/concepts/functions/edge-functions/edge-functions-api for restrictions

export type Point = { x: number; y: number }

/*WRAPPED*/ export function _base64toPoints(base64urlString: string) {
  const b64 = base64urlString.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const u = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  const f = new Float32Array(u.buffer)

  const points = [] as { x: number; y: number }[]
  for (let i = 0; i < f.length; i += 2) {
    points.push({ x: f[i], y: f[i + 1] })
  }
  return points
}
/*LOG2   */ export const base64toPoints = logCall('Entering ' + codeUrl('base64toPoints()', github_file_url, 5), _base64toPoints);
