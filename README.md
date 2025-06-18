# Net-Flox - Plateforme de Streaming Personnelle

Une plateforme de streaming moderne construite avec React, Node.js et Supabase pour héberger et regarder vos films personnels.

## 🚀 Fonctionnalités

- **Interface moderne** : Interface utilisateur élégante inspirée des plateformes de streaming populaires
- **Authentification** : Système de connexion sécurisé avec Supabase
- **Streaming vidéo** : Lecteur vidéo intégré avec support des formats MP4, MKV, AVI
- **Suivi de progression** : Historique de visionnage et temps de lecture pour chaque utilisateur
- **Recherche** : Recherche de films via l'API TMDB
- **Responsive** : Compatible mobile et desktop
- **Métadonnées** : Informations détaillées sur les films via TMDB

## 📋 Prérequis

- Node.js 18+ 
- Un compte Supabase
- Un serveur Linux (Ubuntu/Debian recommandé)
- Nginx (pour la production)
- PM2 (pour la gestion des processus)

## 🛠️ Installation sur serveur Linux

### 1. Préparation du serveur

```bash
# Cloner le projet
git clone <votre-repo> /tmp/net-flox
cd /tmp/net-flox

# Rendre le script de déploiement exécutable
chmod +x deploy.sh

# Modifier la configuration
nano nginx.conf  # Remplacer 'your-domain.com' par votre domaine
nano deploy.sh   # Modifier les variables si nécessaire
```

### 2. Configuration Supabase

1. Créez un projet sur [Supabase](https://supabase.com)
2. Créez la table `watch_history` :

```sql
create table watch_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  movie_id integer not null,
  watch_time integer not null,
  last_watched timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, movie_id)
);

alter table watch_history enable row level security;

create policy "Users can view their own watch history"
  on watch_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own watch history"
  on watch_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own watch history"
  on watch_history for update
  using (auth.uid() = user_id);
```

3. Configurez les variables d'environnement :

```bash
# Créer le fichier .env
cat > .env << EOF
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme
EOF
```

### 3. Déploiement automatique

```bash
# Exécuter le script de déploiement
./deploy.sh
```

Le script va automatiquement :
- Installer toutes les dépendances système
- Configurer Nginx
- Créer l'utilisateur système
- Déployer l'application
- Configurer PM2 pour la gestion des processus
- Configurer le firewall et fail2ban

### 4. Ajout des vidéos

```bash
# Copier vos fichiers vidéos
sudo cp /chemin/vers/vos/videos/* /var/www/net-flox/public/videos/
sudo chown netflox:netflox /var/www/net-flox/public/videos/*

# Renommer les vidéos avec les IDs TMDB (optionnel)
cd /var/www/net-flox
sudo -u netflox npm run rename-videos
```

## 🎬 Gestion des vidéos

### Formats supportés
- MP4 (recommandé)
- MKV
- AVI
- MOV
- WMV

### Nommage des fichiers
Pour une meilleure intégration avec TMDB, nommez vos fichiers :
- `123.mp4` (où 123 est l'ID TMDB du film)
- Ou utilisez le script de renommage automatique

### Script de renommage
```bash
# Renommer automatiquement les vidéos
npm run rename-videos
```

## 🔧 Commandes utiles

### Gestion de l'application
```bash
# Voir les logs
sudo -u netflox pm2 logs

# Redémarrer l'application
sudo -u netflox pm2 restart net-flox

# Voir le statut
sudo -u netflox pm2 status

# Arrêter l'application
sudo -u netflox pm2 stop net-flox
```

### Gestion Nginx
```bash
# Recharger la configuration
sudo systemctl reload nginx

# Redémarrer Nginx
sudo systemctl restart nginx

# Voir les logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Monitoring
```bash
# Vérifier la santé de l'application
curl http://localhost:3000/api/health

# Voir l'utilisation des ressources
sudo -u netflox pm2 monit
```

## 🔒 Sécurité

### Firewall
Le script configure automatiquement UFW avec les règles suivantes :
- SSH (port 22)
- HTTP (port 80)
- HTTPS (port 443)

### Fail2ban
Protection automatique contre :
- Les attaques par force brute
- Les bots malveillants
- Les tentatives d'accès non autorisées

### SSL/HTTPS (Recommandé)
Pour activer HTTPS :

1. Obtenez un certificat SSL (Let's Encrypt recommandé) :
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

2. Ou décommentez la section HTTPS dans `nginx.conf`

## 📊 Monitoring et logs

### Logs de l'application
- Logs PM2 : `/var/www/net-flox/logs/`
- Logs Nginx : `/var/log/nginx/`

### Rotation des logs
Configurée automatiquement avec logrotate (rotation quotidienne, conservation 52 semaines)

## 🚨 Dépannage

### L'application ne démarre pas
```bash
# Vérifier les logs
sudo -u netflox pm2 logs

# Vérifier la configuration
sudo nginx -t

# Redémarrer les services
sudo systemctl restart nginx
sudo -u netflox pm2 restart net-flox
```

### Problèmes de lecture vidéo
```bash
# Vérifier les permissions
ls -la /var/www/net-flox/public/videos/

# Corriger les permissions si nécessaire
sudo chown -R netflox:netflox /var/www/net-flox/public/videos/
sudo chmod 644 /var/www/net-flox/public/videos/*
```

### Problèmes de performance
```bash
# Augmenter les ressources PM2
sudo -u netflox pm2 restart net-flox --max-memory-restart 2G

# Optimiser Nginx pour les gros fichiers
# Modifier /etc/nginx/nginx.conf :
# client_max_body_size 1G;
# proxy_buffering off;
```

## 📝 Configuration avancée

### Variables d'environnement
Créez un fichier `.env` dans `/var/www/net-flox/` :

```env
NODE_ENV=production
PORT=3000
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme
```

### Personnalisation Nginx
Modifiez `/etc/nginx/sites-available/net-flox` selon vos besoins.

## 🤝 Support

Pour obtenir de l'aide :
1. Vérifiez les logs d'erreur
2. Consultez la documentation Supabase
3. Vérifiez la configuration Nginx

## 📄 Licence

Ce projet est sous licence MIT.