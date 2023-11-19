import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/slugify.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/slugify.ts'
/*WRAPPED*/ export const _slugify = (
  text: string,
  separator = '-',
  maxLength = 35
): string => {
  return text
    .toString()
    .normalize('NFD') // split an accented letter in the base letter and the acent
    .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '') // remove all chars not letters, numbers and spaces (to be replaced)
    .replace(/\s+/g, separator)
    .substring(0, maxLength)
    .replace(new RegExp(separator + '+$', 'g'), '') // remove terminal separators
}
/*LOG2   */ export const slugify = logCall('Entering ' + codeUrl('slugify()', github_file_url, 1), _slugify);
