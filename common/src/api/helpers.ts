import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/backend/api/src/helpers.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/backend/api/src/helpers.ts'
declare global { interface Window { logger: NestedLogger; } }

import { SafeParseError, z } from 'zod'

export type Json = Record<string, unknown>

/*WRAPPED*/ export const _validate = <T extends z.ZodTypeAny>(schema: T, val: unknown) => {
  const result = schema.safeParse(val)
  if (!result.success) {
    const issues = (result as SafeParseError<T>).error.issues.map((i) => {
      return {
        field: i.path.join('.') || null,
        error: i.message,
      }
    })
    window.logger.log('data validation issues', issues)
    window.logger.log('APIError', '(400) Error validating request')
    throw new Error('APIError (400) Error validating request')
  } else {
    return result.data as z.infer<T>
  }
}
/*LOG2   */ export const validate = logCall('Entering ' + codeUrl('validate()', github_file_url, 85), _validate);
