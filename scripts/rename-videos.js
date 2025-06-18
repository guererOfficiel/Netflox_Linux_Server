import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { fileURLToPath } from 'url'
import { createGunzip } from 'zlib'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos')
const TEMP_DIR = path.join(__dirname, '..', 'temp')
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi']
const TMDB_EXPORT_URL = 'https://files.tmdb.org/p/exports/movie_ids_12_07_2024.json.gz'

async function downloadAndExtractTMDBData() {
  console.log('Downloading TMDB data...')
  
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true })
  }

  const gzipPath = path.join(TEMP_DIR, 'movie_ids.json.gz')
  const jsonPath = path.join(TEMP_DIR, 'movie_ids.json')
  const writer = fs.createWriteStream(gzipPath)

  try {
    const response = await axios({
      url: TMDB_EXPORT_URL,
      method: 'GET',
      responseType: 'stream'
    })

    await new Promise((resolve, reject) => {
      response.data.pipe(writer)
      writer.on('finish', resolve)
      writer.on('error', reject)
    })

    console.log('Extracting data...')
    
    const gunzip = createGunzip()
    const fileContents = []
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(gzipPath)
        .pipe(gunzip)
        .on('data', (chunk) => fileContents.push(chunk))
        .on('end', () => {
          fs.writeFileSync(jsonPath, Buffer.concat(fileContents))
          resolve()
        })
        .on('error', reject)
    })

    return jsonPath
  } catch (error) {
    console.error('Error downloading or extracting TMDB data:', error.message)
    throw error
  }
}

async function renameVideoFiles() {
  console.log('Starting video renaming process...')

  // Create videos directory if it doesn't exist
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true })
    console.log('Created videos directory')
  }

  try {
    // Download and extract TMDB data
    const jsonPath = await downloadAndExtractTMDBData()
    console.log('Successfully downloaded and extracted TMDB data')

    // Read and parse TMDB data
    const movieData = fs.readFileSync(jsonPath, 'utf-8')
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line))

    console.log(`Loaded ${movieData.length} movies from TMDB data`)

    // Get list of video files
    const files = fs.readdirSync(VIDEOS_DIR)
    console.log(`Found ${files.length} files in videos directory`)

    let renamedCount = 0
    let errorCount = 0

    for (const file of files) {
      const ext = path.extname(file).toLowerCase()
      if (VIDEO_EXTENSIONS.includes(ext)) {
        const title = path.basename(file, ext).toLowerCase()
        
        const movie = movieData.find(m => 
          m.original_title.toLowerCase() === title ||
          m.title.toLowerCase() === title
        )

        if (movie) {
          const newPath = path.join(VIDEOS_DIR, `${movie.id}${ext}`)
          try {
            fs.renameSync(path.join(VIDEOS_DIR, file), newPath)
            console.log(`✓ Renamed: ${file} -> ${movie.id}${ext}`)
            renamedCount++
          } catch (error) {
            console.error(`✗ Error renaming ${file}:`, error.message)
            errorCount++
          }
        } else {
          console.log(`! No match found for: ${file}`)
          errorCount++
        }
      }
    }

    console.log('\nRenaming complete!')
    console.log(`Successfully renamed: ${renamedCount} files`)
    if (errorCount > 0) {
      console.log(`Failed to rename: ${errorCount} files`)
    }

    // Clean up temporary files
    if (fs.existsSync(TEMP_DIR)) {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true })
      console.log('Cleaned up temporary files')
    }
  } catch (error) {
    console.error('Error during video renaming process:', error.message)
    process.exit(1)
  }
}

// Run the script
renameVideoFiles()