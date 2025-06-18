import { Search as SearchIcon } from 'lucide-react'
import { useSearch } from '../hooks/use-search'
import { MovieCard } from '../components/movie-card'

export function Search() {
  const { query, setQuery, results, loading } = useSearch()

  return (
    <div className="min-h-screen px-4 pt-24 md:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="relative mb-8">
          <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher des films..."
            className="h-14 w-full rounded-lg bg-white/10 pl-12 pr-4 text-lg text-white placeholder-gray-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {loading ? (
          <div className="text-center text-lg">Chargement...</div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {results.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        ) : query ? (
          <div className="text-center text-lg">Aucun résultat trouvé</div>
        ) : (
          <div className="text-center text-lg text-gray-400">
            Commencez à taper pour rechercher des films
          </div>
        )}
      </div>
    </div>
  )
}