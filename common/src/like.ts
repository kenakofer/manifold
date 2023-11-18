const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/like.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/like.ts'
/** @deprecated - see reaction.ts with type === 'like' **/
export type Like = {
  id: string // will be id of the object liked, i.e. contract.id
  userId: string
  type: 'contract' | 'post'
  createdTime: number
  tipTxnId?: string // only holds most recent tip txn id
}
export const LIKE_TIP_AMOUNT = 10
export const TIP_UNDO_DURATION = 2000
