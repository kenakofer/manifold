import { PlaygroundState } from '../playground/playground-state'
import { NestedLogger, logCall, codeUrl } from '../playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/util/format.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/util/format.ts'
import {
  BinaryContract,
  CPMMMultiContract,
  PseudoNumericContract,
  StonkContract,
} from '../contract'
import { STONK_NO, STONK_YES } from '../stonk'

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

/*WRAPPED*/ export function _formatMoney(amount: number) {
  const newAmount = getMoneyNumber(amount)
  return formatter.format(newAmount).replace('$', 'M')
}
/*LOG2   */ export const formatMoney = logCall('Entering ' + codeUrl('formatMoney()', github_file_url, 17), _formatMoney);

/*WRAPPED*/ export function _formatMoneyUSD(amount: number) {
  const newAmount = getMoneyNumber(amount)
  return formatter.format(newAmount)
}
/*LOG2   */ export const formatMoneyUSD = logCall('Entering ' + codeUrl('formatMoneyUSD()', github_file_url, 22), _formatMoneyUSD);

/*WRAPPED*/ export function _formatMoneyNumber(amount: number) {
  const newAmount = getMoneyNumber(amount)
  return formatter.format(newAmount).replace('$', '')
}
/*LOG2   */ export const formatMoneyNumber = logCall('Entering ' + codeUrl('formatMoneyNumber()', github_file_url, 27), _formatMoneyNumber);

/*WRAPPED*/ export function _getMoneyNumber(amount: number) {
  // Handle 499.9999999999999 case
  const plusEpsilon = (amount > 0 ? Math.floor : Math.ceil)(
    amount + 0.00000000001 * Math.sign(amount)
  )
  return Math.round(plusEpsilon) === 0 ? 0 : plusEpsilon
}
/*LOG2   */ export const getMoneyNumber = logCall('Entering ' + codeUrl('getMoneyNumber()', github_file_url, 32), _getMoneyNumber);

/*WRAPPED*/ export function _formatMoneyWithDecimals(amount: number) {
  return 'M' + amount.toFixed(2)
}
/*LOG2   */ export const formatMoneyWithDecimals = logCall('Entering ' + codeUrl('formatMoneyWithDecimals()', github_file_url, 40), _formatMoneyWithDecimals);

/*WRAPPED*/ export function _formatMoneyToDecimal(amount: number) {
  const amountString =
    Math.abs(amount - Math.round(amount)) < 0.0001
      ? Math.round(amount).toFixed(0)
      : amount.toFixed(1)
  return 'M' + amountString
}
/*LOG2   */ export const formatMoneyToDecimal = logCall('Entering ' + codeUrl('formatMoneyToDecimal()', github_file_url, 44), _formatMoneyToDecimal);

/*WRAPPED*/ export function _formatWithCommas(amount: number) {
  return formatter.format(Math.floor(amount)).replace('$', '')
}
/*LOG2   */ export const formatWithCommas = logCall('Entering ' + codeUrl('formatWithCommas()', github_file_url, 52), _formatWithCommas);

/*WRAPPED*/ export function _manaToUSD(mana: number) {
  return (mana / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}
/*LOG2   */ export const manaToUSD = logCall('Entering ' + codeUrl('manaToUSD()', github_file_url, 56), _manaToUSD);

/*WRAPPED*/ export function _formatPercentShort(zeroToOne: number) {
  return Math.min(zeroToOne * 100, 99).toFixed(0) + '%'
}
/*LOG2   */ export const formatPercentShort = logCall('Entering ' + codeUrl('formatPercentShort()', github_file_url, 63), _formatPercentShort);

/*WRAPPED*/ function _getPercentDecimalPlaces(zeroToOne: number) {
  return zeroToOne < 0.02 || zeroToOne > 0.98 ? 1 : 0
}
/*LOG2   */ const getPercentDecimalPlaces = logCall('Entering ' + codeUrl('getPercentDecimalPlaces()', github_file_url, 67), _getPercentDecimalPlaces);

/*WRAPPED*/ export function _formatPercent(zeroToOne: number) {
  // Show 1 decimal place if <2% or >98%, giving more resolution on the tails
  const decimalPlaces = getPercentDecimalPlaces(zeroToOne)
  const percent = zeroToOne * 100
  return percent.toFixed(decimalPlaces) + '%'
}
/*LOG2   */ export const formatPercent = logCall('Entering ' + codeUrl('formatPercent()', github_file_url, 71), _formatPercent);

/*WRAPPED*/ export function _formatPercentNumber(zeroToOne: number) {
  // Show 1 decimal place if <2% or >98%, giving more resolution on the tails
  const decimalPlaces = getPercentDecimalPlaces(zeroToOne)
  return Number((zeroToOne * 100).toFixed(decimalPlaces))
}
/*LOG2   */ export const formatPercentNumber = logCall('Entering ' + codeUrl('formatPercentNumber()', github_file_url, 78), _formatPercentNumber);

/*WRAPPED*/ const _showPrecision = (x: number, sigfigs: number) =>
  // convert back to number for weird formatting reason
  `${Number(x.toPrecision(sigfigs))}`

// Eg 1234567.89 => 1.23M; 5678 => 5.68K
/*WRAPPED*/ export function _formatLargeNumber(num: number, sigfigs = 2): string {
  const absNum = Math.abs(num)
  if (absNum < 0.1) return showPrecision(num, 1)
  if (absNum < 1) return showPrecision(num, sigfigs)

  if (absNum < 100) return showPrecision(num, 2)
  if (absNum < 1000) return showPrecision(num, 3)
  if (absNum < 10000) return showPrecision(num, 4)

  const suffix = ['', 'K', 'M', 'B', 'T', 'Q']
  const i = Math.floor(Math.log10(absNum) / 3)

  const numStr = showPrecision(num / Math.pow(10, 3 * i), sigfigs)
  return `${numStr}${suffix[i] ?? ''}`
}
/*LOG2   */ export const formatLargeNumber = logCall('Entering ' + codeUrl('formatLargeNumber()', github_file_url, 89), _formatLargeNumber);
/*LOG2   */ const showPrecision = logCall('Entering ' + codeUrl('showPrecision()', github_file_url, 84), _showPrecision);

/*WRAPPED*/ export function _shortFormatNumber(num: number): string {
  if (num < 1000 && num > -1000) return showPrecision(num, 3)

  const suffix = ['', 'K', 'M', 'B', 'T', 'Q']
  const i = Math.floor(Math.log10(Math.abs(num)) / 3)

  const numStr = showPrecision(num / Math.pow(10, 3 * i), 2)
  return `${numStr}${suffix[i] ?? ''}`
}
/*LOG2   */ export const shortFormatNumber = logCall('Entering ' + codeUrl('shortFormatNumber()', github_file_url, 105), _shortFormatNumber);

/*WRAPPED*/ export function _toCamelCase(words: string) {
  const camelCase = words
    .split(' ')
    .map((word) => word.trim())
    .filter((word) => word)
    .map((word, index) =>
      index === 0 ? word : word[0].toLocaleUpperCase() + word.substring(1)
    )
    .join('')

  // Remove non-alpha-numeric-underscore chars.
  const regex = /(?:^|\s)(?:[a-z0-9_]+)/gi
  return (camelCase.match(regex) || [])[0] ?? ''
}
/*LOG2   */ export const toCamelCase = logCall('Entering ' + codeUrl('toCamelCase()', github_file_url, 115), _toCamelCase);

/*WRAPPED*/ export const _formatOutcomeLabel = (
  contract:
    | BinaryContract
    | PseudoNumericContract
    | StonkContract
    | CPMMMultiContract,
  outcomeLabel: 'YES' | 'NO'
) => {
  if (
    contract.outcomeType === 'BINARY' ||
    contract.mechanism === 'cpmm-multi-1'
  ) {
    return outcomeLabel
  }
  if (contract.outcomeType === 'STONK') {
    return outcomeLabel === 'YES' ? STONK_YES : STONK_NO
  }
  return outcomeLabel === 'YES' ? 'HIGHER' : 'LOWER'
}
/*LOG2   */ export const formatOutcomeLabel = logCall('Entering ' + codeUrl('formatOutcomeLabel()', github_file_url, 130), _formatOutcomeLabel);
