import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/object.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/object.ts'
import { isEqual, mapValues, union } from 'lodash'

/*WRAPPED*/ export const _removeUndefinedProps = <T extends object>(obj: T): T => {
  const newObj: any = {}

  for (const key of Object.keys(obj)) {
    if ((obj as any)[key] !== undefined) newObj[key] = (obj as any)[key]
  }

  return newObj
}
/*LOG2   */ export const removeUndefinedProps = logCall('Entering ' + codeUrl('removeUndefinedProps()', github_file_url, 3), _removeUndefinedProps);
/*WRAPPED*/ export const _removeNullOrUndefinedProps = <T extends object>(obj: T): T => {
  const newObj: any = {}

  for (const key of Object.keys(obj)) {
    if ((obj as any)[key] !== undefined && (obj as any)[key] !== null)
      newObj[key] = (obj as any)[key]
  }

  return newObj
}
/*LOG2   */ export const removeNullOrUndefinedProps = logCall('Entering ' + codeUrl('removeNullOrUndefinedProps()', github_file_url, 12), _removeNullOrUndefinedProps);

/*WRAPPED*/ export const _addObjects = <T extends { [key: string]: number }>(
  obj1: T,
  obj2: T
) => {
  const keys = union(Object.keys(obj1), Object.keys(obj2))
  const newObj = {} as any

  for (const key of keys) {
    newObj[key] = (obj1[key] ?? 0) + (obj2[key] ?? 0)
  }

  return newObj as T
}
/*LOG2   */ export const addObjects = logCall('Entering ' + codeUrl('addObjects()', github_file_url, 23), _addObjects);

/*WRAPPED*/ export const _subtractObjects = <T extends { [key: string]: number }>(
  obj1: T,
  obj2: T
) => {
  const keys = union(Object.keys(obj1), Object.keys(obj2))
  const newObj = {} as any

  for (const key of keys) {
    newObj[key] = (obj1[key] ?? 0) - (obj2[key] ?? 0)
  }

  return newObj as T
}
/*LOG2   */ export const subtractObjects = logCall('Entering ' + codeUrl('subtractObjects()', github_file_url, 37), _subtractObjects);

/*WRAPPED*/ export const _hasChanges = <T extends object>(obj: T, partial: Partial<T>) => {
  const currValues = mapValues(partial, (_, key: keyof T) => obj[key])
  return !isEqual(currValues, partial)
}
/*LOG2   */ export const hasChanges = logCall('Entering ' + codeUrl('hasChanges()', github_file_url, 51), _hasChanges);
