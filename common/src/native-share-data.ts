const raw_github_file_url = 'https://raw.githubusercontent.com/manifoldmarkets/manifold/74ab5cae/common/src/native-share-data.ts'
const github_file_url = 'https://github.com/manifoldmarkets/manifold/blob/74ab5cae/common/src/native-share-data.ts'
export type NativeShareData = {
  title?: string // Android only
  url?: string // iOS only
  message: string // Both
}
