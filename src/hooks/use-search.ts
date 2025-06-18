import { useState, useEffect } from 'react'
import { Movie } from '../types/movie'
import { searchMovies } from '../lib/tmdb'
import { useDebounce } from './use-debounce'

export function useSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Movie[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      return
    }

    async function performSearch() {
      setLoading(true)
      try {
        const data = await searchMovies(debouncedQuery)
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to search movies'))
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  return { query, setQuery, results, loading, error }
}