import { VIDEO_EXTENSIONS } from './constants'

export async function checkVideoAvailability(movieId: number): Promise<boolean> {
  for (const ext of VIDEO_EXTENSIONS) {
    try {
      const response = await fetch(`/videos/${movieId}${ext}`, { method: 'HEAD' })
      if (response.ok) {
        return true
      }
    } catch {
      continue
    }
  }
  return false
}

export async function getVideoPath(movieId: number): Promise<string | null> {
  for (const ext of VIDEO_EXTENSIONS) {
    try {
      const response = await fetch(`/videos/${movieId}${ext}`, { method: 'HEAD' })
      if (response.ok) {
        return `/videos/${movieId}${ext}`
      }
    } catch {
      continue
    }
  }
  return null
}