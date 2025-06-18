import { useMovies } from '../hooks/use-movies'
import { MovieRow } from '../components/movie-row'
import { Play, Plus } from 'lucide-react'
import { getImageUrl } from '../lib/tmdb'

export function Browse() {
  const { trending, popular, topRated, loading, error } = useMovies()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-red-500">Error: {error.message}</div>
      </div>
    )
  }

  const featuredMovie = trending[0]

  return (
    <div className="relative">
      {/* Hero Section */}
      <div className="relative h-[80vh] w-full">
        <img
          src={getImageUrl(featuredMovie?.backdrop_path, 'original')}
          alt={featuredMovie?.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute bottom-0 left-0 p-8 md:p-16">
          <h1 className="text-4xl font-bold md:text-6xl">
            {featuredMovie?.title}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-gray-200">
            {featuredMovie?.overview}
          </p>
          <div className="mt-6 flex space-x-4">
            <button className="flex items-center space-x-2 rounded-md bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90">
              <Play className="h-5 w-5" />
              <span>Play</span>
            </button>
            <button className="flex items-center space-x-2 rounded-md bg-white/20 px-6 py-3 font-semibold text-white backdrop-blur-sm hover:bg-white/30">
              <Plus className="h-5 w-5" />
              <span>My List</span>
            </button>
          </div>
        </div>
      </div>

      {/* Movie Rows */}
      <div className="relative z-10 -mt-32 bg-background pb-8">
        <MovieRow title="Trending Now" movies={trending} />
        <MovieRow title="Popular Movies" movies={popular} />
        <MovieRow title="Top Rated" movies={topRated} />
      </div>
    </div>
  )
}