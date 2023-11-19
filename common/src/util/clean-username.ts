import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/clean-username.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/clean-username.ts'
/*WRAPPED*/ export const _cleanUsername = (name: string, maxLength = 25) => {
  return name
    .replace(/\s+/g, '')
    .normalize('NFD') // split an accented letter in the base letter and the acent
    .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
    .replace(/[^A-Za-z0-9_]/g, '') // remove all chars not letters, numbers and underscores
    .substring(0, maxLength)
}
/*LOG2   */ export const cleanUsername = logCall('Entering ' + codeUrl('cleanUsername()', github_file_url, 1), _cleanUsername);

/*WRAPPED*/ export const _cleanDisplayName = (displayName: string, maxLength = 30) => {
  return displayName.replace(/\s+/g, ' ').substring(0, maxLength).trim()
}
/*LOG2   */ export const cleanDisplayName = logCall('Entering ' + codeUrl('cleanDisplayName()', github_file_url, 10), _cleanDisplayName);
