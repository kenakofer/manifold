const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/tracking.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/tracking.ts'
export type ClickEvent = {
  type: 'click'
  contractId: string
  timestamp: number
}

export type LatencyEvent = {
  type: 'feed' | 'portfolio'
  latency: number
  timestamp: number
}
