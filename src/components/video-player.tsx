import { useState, useRef, useEffect } from 'react'
import ReactPlayer from 'react-player'
import { Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { VIDEO_EXTENSIONS } from '../lib/constants'
import { updateWatchTime } from '../lib/supabase'

interface VideoPlayerProps {
  movieId: number
  className?: string
}

export function VideoPlayer({ movieId, className }: VideoPlayerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const playerRef = useRef<ReactPlayer>(null)
  const lastUpdateRef = useRef<number>(0)

  useEffect(() => {
    const checkVideo = async () => {
      try {
        for (const ext of VIDEO_EXTENSIONS) {
          const url = `${window.location.origin}/api/videos/${movieId}`
          setVideoUrl(url)
          setLoading(false)
          return
        }
      } catch (err) {
        setError('Erreur lors du chargement de la vidéo')
      } finally {
        setLoading(false)
      }
    }

    checkVideo()
  }, [movieId])

  const handleProgress = (state: { playedSeconds: number }) => {
    if (state.playedSeconds - lastUpdateRef.current >= 10) {
      updateWatchTime(movieId, Math.floor(state.playedSeconds))
      lastUpdateRef.current = state.playedSeconds
    }
  }

  const handleError = (error: any) => {
    console.error('Video playback error:', error)
    setError('Erreur lors de la lecture de la vidéo')
  }

  if (loading) {
    return (
      <div className={cn('flex aspect-video items-center justify-center bg-black', className)}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !videoUrl) {
    return (
      <div className={cn('flex aspect-video items-center justify-center bg-black', className)}>
        <div className="text-center">
          <p className="text-lg text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative aspect-video rounded-lg bg-black', className)}>
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={false}
        onProgress={handleProgress}
        onError={handleError}
        progressInterval={1000}
        controls={true}
        config={{
          file: {
            attributes: {
              crossOrigin: "anonymous"
            },
            forceVideo: true
          }
        }}
      />
    </div>
  )
}