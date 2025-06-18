import { useState, useEffect } from 'react'
import { Movie } from '../types/movie'
import { getTrending, getPopular, getTopRated } from '../lib/tmdb'

export function useMovies() {
  const [trending, setTrending] = useState<Movie[]>([])
  const [popular, setPopular] = useState<Movie[]>([])
  const [topRated, setTopRated] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchMovies() {
      try {
        const [trendingData, popularData, topRatedData] = await Promise.all([
          getTrending(),
          getPopular(),
          getTopRated(),
        ])

        setTrending(trendingData)
        setPopular(popularData)
        setTopRated(topRatedData)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch movies'))
      } finally {
        setLoading(false)
      }
    }

    fetchMovies()
  }, [])

  return { trending, popular, topRated, loading, error }
}