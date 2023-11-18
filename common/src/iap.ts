import { PlaygroundState } from './playground/playground-state'
import { NestedLogger, logIndent, codeUrl } from './playground/nested-logger'
declare global { interface Window { logger: NestedLogger; pState: PlaygroundState } }
const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/iap.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/iap.ts/'
export type IapTransaction = {
  id: string
  userId: string
  quantity: number
  manaQuantity: number
  productId: 'mana_2500' | 'mana_10000' | 'mana_1000'
  transactionId: string
  createdTime: number
  purchaseTime: number
  receipt: string
  revenue: number
  type: 'apple'
}

// Not exhaustive, but enough for what we need
export type PurchaseData = {
  quantity: number
  productId: 'mana_2500' | 'mana_10000' | 'mana_1000'
  transactionId: string
  originalTransactionId: string
  purchaseDateMs: number
}
