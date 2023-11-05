import { Comment } from '../comment'

export type OnLover = {
  commentType: 'lover'
  onUserId: string
}
export type LoverComment = Comment<OnLover>
