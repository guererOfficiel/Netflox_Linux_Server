import { Link } from 'react-router-dom'
import { Play, Plus } from 'lucide-react'
import { Movie } from '../types/movie'
import { getImageUrl } from '../lib/tmdb'
import { cn } from '../lib/utils'

interface MovieCardProps {
  movie: Movie
  className?: string
}

export function MovieCard({ movie, className }: MovieCardProps) {
  const handlePlayClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const videoUrl = `${window.location.origin}/api/videos/${movie.id}.mp4`
    window.open(videoUrl, '_blank')
  }

  return (
    <Link
      to={`/movie/${movie.id}`}
      className={cn(
        'group relative aspect-[2/3] overflow-hidden rounded-md bg-gray-900',
        className
      )}
    >
      {movie.poster_path && (
        <img
          src={getImageUrl(movie.poster_path)}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-lg font-semibold text-white">{movie.title}</h3>
          <div className="mt-2 flex space-x-2">
            <button 
              onClick={handlePlayClick}
              className="rounded-full bg-primary p-2 text-white hover:bg-primary/90"
              title="Lecture"
            >
              <Play className="h-4 w-4" />
            </button>
            <button className="rounded-full bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}