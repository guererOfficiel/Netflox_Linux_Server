import fs from 'fs'
import path from 'path'
import axios from 'axios'
import gunzip from 'gunzip-file'
import { VIDEO_EXTENSIONS, TMDB_EXPORT_URL } from '../src/lib/constants.js'

const VIDEOS_DIR = path.join(process.cwd(), 'public', 'videos')
const TEMP_DIR = path.join(process.cwd(), 'temp')

async function downloadTMDBExport() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR)
  }

  const gzipPath = path.join(TEMP_DIR, 'movie_ids.json.gz')
  const jsonPath = path.join(TEMP_DIR, 'movie_ids.json')

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

  await new Promise((resolve, reject) => {
    gunzip(gzipPath, jsonPath, (err) => {
      if (err) reject(err)
      else resolve(null)
    })
  })

  return jsonPath
}

async function renameVideoFiles() {
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
      
      const movie = movieData.find((m) => 
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

  fs.rmSync(TEMP_DIR, { recursive: true, force: true })
}

try {
  await renameVideoFiles()
  console.log('Video files have been successfully renamed!')
} catch (error) {
  console.error('Error renaming video files:', error)
  process.exit(1)
}