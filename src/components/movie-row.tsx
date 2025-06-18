import { Movie } from '../types/movie'
import { MovieCard } from './movie-card'

interface MovieRowProps {
  title: string
  movies: Movie[]
}

export function MovieRow({ title, movies }: MovieRowProps) {
  return (
    <section className="px-4 py-8 md:px-8">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {movies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            className="min-w-[200px] md:min-w-[240px]"
          />
        ))}
      </div>
    </section>
  )
}