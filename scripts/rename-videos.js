import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const VIDEOS_DIR = path.join(__dirname, '..', 'public', 'videos')
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv']
const TMDB_API_KEY = 'e5e51a3745fc18231f2b073764372e26'

// Configuration de l'API TMDB
const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: {
    api_key: TMDB_API_KEY,
    language: 'fr-FR'
  }
})

async function searchMovieByTitle(title) {
  try {
    console.log(`Recherche du film: "${title}"`)
    const response = await tmdb.get('/search/movie', {
      params: { query: title }
    })
    
    if (response.data.results && response.data.results.length > 0) {
      const movie = response.data.results[0] // Prendre le premier résultat
      console.log(`✓ Trouvé: "${movie.title}" (${movie.release_date?.split('-')[0]}) - ID: ${movie.id}`)
      return movie
    }
    
    console.log(`✗ Aucun résultat trouvé pour: "${title}"`)
    return null
  } catch (error) {
    console.error(`Erreur lors de la recherche de "${title}":`, error.message)
    return null
  }
}

function cleanTitle(filename) {
  // Nettoyer le nom du fichier pour améliorer la recherche
  return filename
    .replace(/\./g, ' ') // Remplacer les points par des espaces
    .replace(/[-_]/g, ' ') // Remplacer les tirets et underscores par des espaces
    .replace(/\s+/g, ' ') // Remplacer les espaces multiples par un seul
    .replace(/\b(720p|1080p|4k|bluray|dvdrip|webrip|hdtv|x264|x265|hevc)\b/gi, '') // Supprimer les termes techniques
    .replace(/\b(french|vf|vostfr|multi|truefrench)\b/gi, '') // Supprimer les termes de langue
    .replace(/\b\d{4}\b/g, '') // Supprimer les années (optionnel)
    .trim()
}

async function renameVideoFiles() {
  console.log('🎬 Démarrage du processus de renommage des vidéos...')

  // Créer le dossier vidéos s'il n'existe pas
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true })
    console.log(`📁 Dossier vidéos créé: ${VIDEOS_DIR}`)
  }

  try {
    // Obtenir la liste des fichiers vidéo
    const files = fs.readdirSync(VIDEOS_DIR)
    const videoFiles = files.filter(file => 
      VIDEO_EXTENSIONS.includes(path.extname(file).toLowerCase())
    )

    console.log(`📹 ${videoFiles.length} fichiers vidéo trouvés`)

    if (videoFiles.length === 0) {
      console.log('Aucun fichier vidéo trouvé dans le dossier.')
      return
    }

    let renamedCount = 0
    let errorCount = 0

    for (const file of videoFiles) {
      const ext = path.extname(file).toLowerCase()
      const originalTitle = path.basename(file, ext)
      
      // Vérifier si le fichier est déjà nommé avec un ID TMDB
      if (/^\d+$/.test(originalTitle)) {
        console.log(`⏭️  Fichier déjà nommé avec un ID: ${file}`)
        continue
      }

      const cleanedTitle = cleanTitle(originalTitle)
      console.log(`\n🔍 Traitement: ${file}`)
      console.log(`📝 Titre nettoyé: "${cleanedTitle}"`)

      const movie = await searchMovieByTitle(cleanedTitle)

      if (movie) {
        const newFilename = `${movie.id}${ext}`
        const oldPath = path.join(VIDEOS_DIR, file)
        const newPath = path.join(VIDEOS_DIR, newFilename)

        // Vérifier si un fichier avec ce nom existe déjà
        if (fs.existsSync(newPath)) {
          console.log(`⚠️  Un fichier avec l'ID ${movie.id} existe déjà`)
          errorCount++
          continue
        }

        try {
          fs.renameSync(oldPath, newPath)
          console.log(`✅ Renommé: ${file} → ${newFilename}`)
          renamedCount++
        } catch (error) {
          console.error(`❌ Erreur lors du renommage de ${file}:`, error.message)
          errorCount++
        }
      } else {
        console.log(`❌ Impossible de trouver le film: ${file}`)
        errorCount++
      }

      // Petite pause pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 250))
    }

    console.log('\n🎉 Processus de renommage terminé!')
    console.log(`✅ Fichiers renommés avec succès: ${renamedCount}`)
    if (errorCount > 0) {
      console.log(`❌ Fichiers non traités: ${errorCount}`)
    }

    // Afficher la liste finale des fichiers
    console.log('\n📋 Fichiers dans le dossier vidéos:')
    const finalFiles = fs.readdirSync(VIDEOS_DIR)
    finalFiles.forEach(file => {
      if (VIDEO_EXTENSIONS.includes(path.extname(file).toLowerCase())) {
        console.log(`   📹 ${file}`)
      }
    })

  } catch (error) {
    console.error('❌ Erreur lors du processus de renommage:', error.message)
    process.exit(1)
  }
}

// Fonction pour afficher l'aide
function showHelp() {
  console.log(`
🎬 Script de renommage des vidéos Net-Flox

Usage: node scripts/rename-videos.js [options]

Options:
  --help, -h     Afficher cette aide
  --dry-run      Simuler le renommage sans modifier les fichiers
  --verbose      Affichage détaillé

Exemples:
  node scripts/rename-videos.js
  node scripts/rename-videos.js --dry-run
  node scripts/rename-videos.js --verbose

Le script recherche automatiquement les films sur TMDB et renomme
les fichiers avec leur ID TMDB correspondant.

Formats supportés: ${VIDEO_EXTENSIONS.join(', ')}
`)
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2)
if (args.includes('--help') || args.includes('-h')) {
  showHelp()
  process.exit(0)
}

// Exécuter le script
console.log('🚀 Net-Flox - Script de renommage des vidéos')
console.log('=' .repeat(50))

renameVideoFiles().catch(error => {
  console.error('💥 Erreur fatale:', error.message)
  process.exit(1)
})