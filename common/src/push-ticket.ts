const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/push-ticket.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/push-ticket.ts'
export type PushTicket = {
  status: 'ok' | 'error'
  userId: string
  notificationId: string
  id: string
  createdTime: number
  receiptStatus: 'not-checked' | 'ok' | 'error'
  receiptError?: string
}
