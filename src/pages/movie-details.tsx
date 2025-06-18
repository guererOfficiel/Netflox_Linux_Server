import { useParams } from 'react-router-dom'
import { Clock, Calendar, Star } from 'lucide-react'
import { useMovieDetails } from '../hooks/use-movie-details'
import { getImageUrl } from '../lib/tmdb'
import { VideoPlayer } from '../components/video-player'
import { AddToWatchlist } from '../components/add-to-watchlist'

export function MovieDetails() {
  const { id } = useParams<{ id: string }>()
  const { movie, loading, error } = useMovieDetails(id!)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16">
        <div className="text-xl text-red-500">
          {error?.message || 'Movie not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <div className="relative h-[70vh] w-full">
        <VideoPlayer movieId={movie.id} className="h-full w-full" />
      </div>

      <div className="relative z-10 px-4 py-8 md:px-8">
        <div className="grid gap-8 md:grid-cols-[300px,1fr]">
          <div className="hidden md:block">
            <img
              src={getImageUrl(movie.poster_path)}
              alt={movie.title}
              className="rounded-lg shadow-xl"
            />
          </div>
          <div className="space-y-6">
            <h1 className="text-4xl font-bold md:text-5xl">{movie.title}</h1>
            {movie.tagline && (
              <p className="text-xl italic text-gray-300">{movie.tagline}</p>
            )}

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <span>{movie.vote_average.toFixed(1)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5" />
                <span>{movie.runtime} min</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>{new Date(movie.release_date).getFullYear()}</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <AddToWatchlist movieId={movie.id} />
            </div>

            <div>
              <h2 className="mb-2 text-2xl font-semibold">Overview</h2>
              <p className="text-lg text-gray-300">{movie.overview}</p>
            </div>

            <div>
              <h2 className="mb-2 text-2xl font-semibold">Genres</h2>
              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="rounded-full bg-white/10 px-3 py-1 text-sm"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}