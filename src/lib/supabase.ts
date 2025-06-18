import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function updateWatchTime(movieId: number, duration: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data, error } = await supabase
    .from('watch_history')
    .upsert({
      user_id: user.id,
      movie_id: movieId,
      watch_time: duration,
      last_watched: new Date().toISOString()
    })

  if (error) {
    console.error('Error updating watch time:', error)
  }
  return data
}