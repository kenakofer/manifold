const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/poll-option.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/poll-option.ts'

export type PollOption = {
  id: string
  index: number // Order of the options in the list
  text: string
  votes: number
}
