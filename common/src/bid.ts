const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/bid.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/bid.ts'
export type Bid = {
  createdTime: number

  amount: number

  userId: string
  avatar: string
  username: string
  displayName: string
}
