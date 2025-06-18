import { useState, useEffect } from 'react'
import { MovieDetails } from '../types/movie'
import { getMovieDetails } from '../lib/tmdb'

export function useMovieDetails(id: string) {
  const [movie, setMovie] = useState<MovieDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchMovie() {
      try {
        const data = await getMovieDetails(id)
        setMovie(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch movie details'))
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [id])

  return { movie, loading, error }
}