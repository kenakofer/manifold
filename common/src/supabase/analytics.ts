import { run, SupabaseClient } from '../supabase/utils'
import { removeUndefinedProps } from '../util/object'
import { Json } from '../supabase/schema'
export type EventData = Record<string, Json | undefined>

export async function insertUserEvent(
  name: string,
  data: EventData,
  db: SupabaseClient,
  userId?: string | null,
  contractId?: string | null,
  commentId?: string | null,
  adId?: string | null
) {
  if (
    (name === 'view market' || name === 'view market card') &&
    userId &&
    contractId
  ) {
    return run(
      db.from('user_seen_markets').insert({
        user_id: userId,
        contract_id: contractId,
        data: removeUndefinedProps(data) as Record<string, Json>,
        type: name,
      })
    )
  }
  return run(
    db.from('user_events').insert({
      name,
      data: removeUndefinedProps(data) as Record<string, Json>,
      user_id: userId,
      contract_id: contractId,
      comment_id: commentId,
      ad_id: adId,
    })
  )
}
