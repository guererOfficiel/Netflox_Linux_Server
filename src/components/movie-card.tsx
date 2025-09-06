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
    const videoUrl = `${window.location.origin}/api/videos/${movie.id}`
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
      
      {/* Overlay toujours visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-semibold text-white mb-2 line-clamp-2">{movie.title}</h3>
        </div>
      </div>
      
      {/* Boutons au centre - toujours visibles */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex space-x-3">
          <button 
            onClick={handlePlayClick}
            className="rounded-full bg-primary p-3 text-white hover:bg-primary/90 shadow-lg transition-all hover:scale-110"
            title="Lecture"
          >
            <Play className="h-5 w-5" />
          </button>
          <button className="rounded-full bg-white/20 p-3 text-white backdrop-blur-sm hover:bg-white/30 shadow-lg transition-all hover:scale-110">
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </Link>
  )
}