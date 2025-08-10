import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration CORS plus permissive pour la production
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:3000', 'https://your-domain.com'] // Ajoutez votre domaine
    : true,
  credentials: true
}));

app.use(express.json());

// En production, servir les fichiers statiques du build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
}

// Dossier vidéos - chemin absolu pour la production
const VIDEOS_DIR = process.env.NODE_ENV === 'production' 
  ? '/var/www/net-flox/public/videos'
  : join(__dirname, '../public/videos');

// Créer le dossier vidéos s'il n'existe pas
if (!fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  console.log(`Dossier vidéos créé: ${VIDEOS_DIR}`);
} else {
  console.log(`Dossier vidéos trouvé: ${VIDEOS_DIR}`);
  // Lister les fichiers pour debug
  try {
    const files = fs.readdirSync(VIDEOS_DIR);
    console.log(`Fichiers vidéos disponibles: ${files.length}`);
    files.forEach(file => console.log(`  - ${file}`));
  } catch (error) {
    console.error('Erreur lors de la lecture du dossier vidéos:', error);
  }
}

// Route pour lister les vidéos disponibles
app.get('/api/videos', (req, res) => {
  try {
    if (!fs.existsSync(VIDEOS_DIR)) {
      return res.json([]);
    }
    const files = fs.readdirSync(VIDEOS_DIR);
    const videoFiles = files.filter(file => 
      ['.mp4', '.mkv', '.avi', '.mov', '.wmv'].includes(
        file.toLowerCase().substring(file.lastIndexOf('.'))
      )
    );
    res.json(videoFiles);
  } catch (error) {
    console.error('Erreur lors de la lecture du dossier vidéos:', error);
    res.status(500).json({ error: 'Erreur lors de la lecture du dossier vidéos' });
  }
});

// Route pour streamer les vidéos avec support du range
app.get('/api/videos/:filename', (req, res) => {
  const { filename } = req.params;
  const videoPath = join(VIDEOS_DIR, filename);

  console.log(`Tentative d'accès à la vidéo: ${filename}`);
  console.log(`Chemin complet: ${videoPath}`);
  console.log(`Fichier existe: ${fs.existsSync(videoPath)}`);
  // Vérification de sécurité pour éviter les attaques de traversée de répertoire
  if (!videoPath.startsWith(VIDEOS_DIR)) {
    console.log('Accès interdit - traversée de répertoire détectée');
    return res.status(403).json({ error: 'Accès interdit' });
  }

  if (!fs.existsSync(videoPath)) {
    console.log(`Vidéo non trouvée: ${videoPath}`);
    return res.status(404).json({ error: 'Vidéo non trouvée' });
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Support du streaming par chunks (important pour les gros fichiers)
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': getContentType(filename),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Streaming complet du fichier
    const head = {
      'Content-Length': fileSize,
      'Content-Type': getContentType(filename),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Route pour vérifier l'existence d'une vidéo (HEAD request)
app.head('/api/videos/:filename', (req, res) => {
  const { filename } = req.params;
  const videoPath = join(VIDEOS_DIR, filename);

  if (!videoPath.startsWith(VIDEOS_DIR)) {
    return res.status(403).end();
  }

  if (fs.existsSync(videoPath)) {
    const stat = fs.statSync(videoPath);
    res.set({
      'Content-Length': stat.size,
      'Content-Type': getContentType(filename),
      'Accept-Ranges': 'bytes'
    });
    res.status(200).end();
  } else {
    res.status(404).end();
  }
});

// Route pour obtenir des informations sur une vidéo
app.get('/api/video-info/:filename', (req, res) => {
  const { filename } = req.params;
  const videoPath = join(VIDEOS_DIR, filename);

  if (!videoPath.startsWith(VIDEOS_DIR)) {
    return res.status(403).json({ error: 'Accès interdit' });
  }

  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: 'Vidéo non trouvée' });
  }

  try {
    const stat = fs.statSync(videoPath);
    res.json({
      filename,
      size: stat.size,
      modified: stat.mtime,
      type: getContentType(filename)
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la lecture des informations' });
  }
});

// Route de santé pour le monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    videosDir: VIDEOS_DIR,
    videosCount: fs.existsSync(VIDEOS_DIR) ? fs.readdirSync(VIDEOS_DIR).length : 0
  });
});

// En production, toutes les autres routes renvoient vers l'app React
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

// Fonction utilitaire pour déterminer le type MIME
function getContentType(filename) {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  switch (ext) {
    case '.mp4': return 'video/mp4';
    case '.mkv': return 'video/x-matroska';
    case '.avi': return 'video/x-msvideo';
    case '.mov': return 'video/quicktime';
    case '.wmv': return 'video/x-ms-wmv';
    default: return 'video/mp4';
  }
}

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM reçu, arrêt gracieux du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT reçu, arrêt gracieux du serveur...');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur Net-Flox démarré sur le port ${PORT}`);
  console.log(`📁 Répertoire vidéos: ${VIDEOS_DIR}`);
  console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
});