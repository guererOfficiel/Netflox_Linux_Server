import { useState } from 'react'
import { Plus, Check, Loader2 } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { addToList, createRequestToken } from '../lib/tmdb'
import { cn } from '../lib/utils'

interface AddToWatchlistProps {
  movieId: number
  className?: string
}

export function AddToWatchlist({ movieId, className }: AddToWatchlistProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isAdded, setIsAdded] = useState(false)
  const { sessionId, accountId, isAuthenticated } = useAuthStore()

  const handleClick = async () => {
    if (!isAuthenticated) {
      try {
        // Obtenir un nouveau request token
        const requestToken = await createRequestToken()
        // Rediriger vers la page d'authentification TMDB
        window.location.href = `https://www.themoviedb.org/authenticate/${requestToken}?redirect_to=${window.location.origin}/callback`
      } catch (error) {
        console.error('Erreur lors de la création du request token:', error)
      }
      return
    }

    setIsLoading(true)
    try {
      await addToList(movieId, sessionId!, accountId!)
      setIsAdded(true)
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la liste:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isAdded}
      className={cn(
        'flex items-center space-x-2 rounded-md bg-white/20 px-6 py-3 font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : isAdded ? (
        <Check className="h-5 w-5" />
      ) : (
        <Plus className="h-5 w-5" />
      )}
      <span>{isAdded ? 'Ajouté à la liste' : 'Ajouter à ma liste'}</span>
    </button>
  )
}