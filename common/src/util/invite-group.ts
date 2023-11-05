import { ENV_CONFIG } from '../envs/constants'
import { Group } from '../group'

export const getGroupInviteUrl = (group: Group, inviteSlug: string) =>
  `https://${ENV_CONFIG.domain}/group-invite/${inviteSlug}`

export const truncatedUrl = (fullUrl: string): string => {
  // Remove the "https://" prefix
  const truncatedUrl = fullUrl.replace(/^https?:\/\//, '')
  return truncatedUrl
}
