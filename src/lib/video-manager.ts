import { searchMovies } from './tmdb'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import gunzip from 'gunzip-file'

const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi']
const TMDB_EXPORT_URL = 'https://files.tmdb.org/p/exports/movie_ids_12_07_2024.json.gz'
const VIDEOS_DIR = path.join(process.cwd(), 'public', 'videos')
const TEMP_DIR = path.join(process.cwd(), 'temp')

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

export async function downloadTMDBExport(): Promise<void> {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR)
  }

  const gzipPath = path.join(TEMP_DIR, 'movie_ids.json.gz')
  const jsonPath = path.join(TEMP_DIR, 'movie_ids.json')

  // Télécharger le fichier GZIP
  const response = await axios({
    url: TMDB_EXPORT_URL,
    method: 'GET',
    responseType: 'stream'
  })

  const writer = fs.createWriteStream(gzipPath)
  response.data.pipe(writer)

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve)
    writer.on('error', reject)
  })

  // Décompresser le fichier
  await new Promise((resolve, reject) => {
    gunzip(gzipPath, jsonPath, (err: Error | null) => {
      if (err) reject(err)
      else resolve(null)
    })
  })

  return jsonPath
}

export async function renameVideoFiles(): Promise<void> {
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true })
  }

  const jsonPath = await downloadTMDBExport()
  const movieData = fs.readFileSync(jsonPath, 'utf-8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line))

  const files = fs.readdirSync(VIDEOS_DIR)

  for (const file of files) {
    const ext = path.extname(file)
    if (VIDEO_EXTENSIONS.includes(ext)) {
      const title = path.basename(file, ext).toLowerCase()
      
      // Chercher le film correspondant dans les données TMDB
      const movie = movieData.find((m: any) => 
        m.original_title.toLowerCase() === title ||
        m.title.toLowerCase() === title
      )

      if (movie) {
        const newPath = path.join(VIDEOS_DIR, `${movie.id}${ext}`)
        fs.renameSync(path.join(VIDEOS_DIR, file), newPath)
        console.log(`Renamed: ${file} -> ${movie.id}${ext}`)
      }
    }
  }

  // Nettoyer les fichiers temporaires
  fs.rmSync(TEMP_DIR, { recursive: true, force: true })
}