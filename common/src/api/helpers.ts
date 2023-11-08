import { NestedLogger } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; } }

import { z } from 'zod'

export type Json = Record<string, unknown>

export const validate = <T extends z.ZodTypeAny>(schema: T, val: unknown) => {
  const result = schema.safeParse(val)
  if (!result.success) {
    const issues = result.error.issues.map((i) => {
      return {
        field: i.path.join('.') || null,
        error: i.message,
      }
    })
    window.logger.log('issues', issues)
    window.logger.log('APIError', '(400) Error validating request')
    throw new Error('APIError (400) Error validating request')
  } else {
    return result.data as z.infer<T>
  }
}