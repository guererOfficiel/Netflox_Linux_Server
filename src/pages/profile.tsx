import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Clock } from 'lucide-react'
import { MovieCard } from '../components/movie-card'
import { Movie } from '../types/movie'
import { getMovieDetails } from '../lib/tmdb'

interface WatchHistory {
  movie_id: number
  watch_time: number
  last_watched: string
}

export function Profile() {
  const [watchHistory, setWatchHistory] = useState<(WatchHistory & { movie: Movie })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchWatchHistory() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
          .from('watch_history')
          .select('*')
          .eq('user_id', user.id)
          .order('last_watched', { ascending: false })

        if (error) throw error

        // Récupérer les détails des films
        const historyWithMovies = await Promise.all(
          data.map(async (item) => {
            const movie = await getMovieDetails(item.movie_id.toString())
            return { ...item, movie }
          })
        )

        setWatchHistory(historyWithMovies)
      } catch (error) {
        console.error('Error fetching watch history:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWatchHistory()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <div className="text-xl">Chargement...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 pt-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold">Historique de visionnage</h1>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {watchHistory.map((item) => (
            <div key={item.movie_id} className="space-y-4">
              <MovieCard movie={item.movie} />
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>Temps de visionnage : {Math.floor(item.watch_time / 60)} min</span>
              </div>
              <div className="text-sm text-gray-400">
                Dernière lecture : {new Date(item.last_watched).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>

        {watchHistory.length === 0 && (
          <div className="text-center text-gray-400">
            Aucun historique de visionnage
          </div>
        )}
      </div>
    </div>
  )
}