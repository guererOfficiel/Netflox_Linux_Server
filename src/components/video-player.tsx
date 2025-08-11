import { useState, useRef, useEffect } from 'react'
import ReactPlayer from 'react-player'
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react'
import { cn } from '../lib/utils'
import { VIDEO_EXTENSIONS } from '../lib/constants'
import { updateWatchTime } from '../lib/supabase'

interface VideoPlayerProps {
  movieId: number
  className?: string
}

export function VideoPlayer({ movieId, className }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [muted, setMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const playerRef = useRef<ReactPlayer>(null)
  const lastUpdateRef = useRef<number>(0)

  useEffect(() => {
    const checkVideo = async () => {
      try {
        console.log(`Checking video for movie ID: ${movieId}`)
        for (const ext of VIDEO_EXTENSIONS) {
          const url = `/api/videos/${movieId}${ext}`
          console.log(`Trying URL: ${url}`)
          try {
            const response = await fetch(url, { method: 'HEAD' })
            console.log(`Response for ${url}:`, response.status, response.ok)
            if (response.ok) {
              console.log(`Video found: ${url}`)
              setVideoUrl(url)
              setLoading(false)
              return
            }
          } catch (err) {
            console.log(`Error checking ${url}:`, err)
          }
        }
        console.log('No video file found for any extension')
        setError('Vidéo non disponible')
      } catch (err) {
        console.error('Error checking video:', err)
        setError('Erreur lors du chargement de la vidéo')
      } finally {
        setLoading(false)
      }
    }

    checkVideo()
  }, [movieId])

  const handlePlayPause = () => {
    setPlaying(!playing)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setMuted(newVolume === 0)
  }

  const handleMuteToggle = () => {
    setMuted(!muted)
  }

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setProgress(state.played * 100)
    
    // Update watch time every 10 seconds
    if (state.playedSeconds - lastUpdateRef.current >= 10) {
      updateWatchTime(movieId, Math.floor(state.playedSeconds))
      lastUpdateRef.current = state.playedSeconds
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setProgress(time)
    playerRef.current?.seekTo(time / 100)
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
          <p className="mt-2 text-sm text-gray-500">
            Pour regarder ce film, placez le fichier vidéo dans le dossier /var/www/net-flox/public/videos avec le nom : {movieId}[.mp4|.mkv|.avi]
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('group relative aspect-video rounded-lg bg-black', className)}>
      <ReactPlayer
        ref={playerRef}
        url={videoUrl}
        width="100%"
        height="100%"
        playing={playing}
        volume={volume}
        muted={muted}
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

      <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <button
          onClick={handlePlayPause}
          className="rounded-full bg-white/20 p-4 backdrop-blur-sm transition-transform hover:scale-110 hover:bg-white/30"
        >
          {playing ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8" />
          )}
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex items-center space-x-4">
          <button
            onClick={handlePlayPause}
            className="rounded-full bg-white/20 p-2 hover:bg-white/30"
          >
            {playing ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            className="flex-1 cursor-pointer accent-primary"
          />

          <div className="flex items-center space-x-2">
            <button
              onClick={handleMuteToggle}
              className="rounded-full bg-white/20 p-2 hover:bg-white/30"
            >
              {muted ? (
                <VolumeX className="h-6 w-6" />
              ) : (
                <Volume2 className="h-6 w-6" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 cursor-pointer accent-primary"
            />
          </div>
        </div>
      </div>
    </div>
  )
}