import { SupabaseClient } from '@supabase/supabase-js'
import { cache } from 'react'

export const getUser = cache(async (supabase: SupabaseClient) => {
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

export const getProfile = cache(async (supabase: SupabaseClient, userId: string | undefined) => {
  if (!userId) return null
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .single()
    
  return profile
})
