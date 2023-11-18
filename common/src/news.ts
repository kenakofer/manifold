const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/news.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/news.ts'
export type News = {
  error?: string
  image?: string
  url: string
  title: string
  description: string
  urlToImage: string
  id: string
}
