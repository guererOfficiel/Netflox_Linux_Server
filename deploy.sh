#!/bin/bash

# Script de déploiement pour serveur Linux
set -e

echo "🚀 Déploiement de Net-Flox sur serveur Linux"

# Variables de configuration
APP_DIR="/var/www/net-flox"
SERVICE_USER="netflox"
NGINX_CONF="/etc/nginx/sites-available/net-flox"
DOMAIN="your-domain.com"  # Remplacez par votre domaine

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérifier si on est root
if [[ $EUID -eq 0 ]]; then
   print_error "Ce script ne doit pas être exécuté en tant que root"
   exit 1
fi

# Mise à jour du système
print_status "Mise à jour du système..."
/usr/bin/sudo apt update && /usr/bin/sudo apt upgrade -y

# Installation des dépendances système
print_status "Installation des dépendances système..."
/usr/bin/sudo apt install -y curl wget git nginx ufw fail2ban

# Installation de Node.js (version LTS)
print_status "Installation de Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    /usr/bin/sudo apt-get install -y nodejs
else
    print_warning "Node.js est déjà installé ($(node --version))"
fi

# Installation de PM2 globalement
print_status "Installation de PM2..."
if ! command -v pm2 &> /dev/null; then
    /usr/bin/sudo npm install -g pm2
else
    print_warning "PM2 est déjà installé ($(pm2 --version))"
fi

# Création de l'utilisateur système
print_status "Création de l'utilisateur système..."
if ! id "$SERVICE_USER" &>/dev/null; then
    /usr/bin/sudo useradd -r -s /bin/bash -d $APP_DIR $SERVICE_USER
    print_status "Utilisateur $SERVICE_USER créé"
else
    print_warning "L'utilisateur $SERVICE_USER existe déjà"
fi

# Création du répertoire de l'application
print_status "Création du répertoire de l'application..."
/usr/bin/sudo mkdir -p $APP_DIR
/usr/bin/sudo mkdir -p $APP_DIR/public/videos
/usr/bin/sudo mkdir -p $APP_DIR/logs
/usr/bin/sudo chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# Arrêter l'application existante si elle tourne
print_status "Arrêt de l'application existante..."
/usr/bin/sudo -u $SERVICE_USER pm2 delete net-flox 2>/dev/null || true

# Copie des fichiers de l'application
print_status "Copie des fichiers de l'application..."
/usr/bin/sudo cp -r . $APP_DIR/
/usr/bin/sudo chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# Supprimer l'ancien fichier de config PM2 s'il existe
/usr/bin/sudo rm -f $APP_DIR/ecosystem.config.js

# Installation des dépendances Node.js
print_status "Installation des dépendances Node.js..."
cd $APP_DIR
/usr/bin/sudo -u $SERVICE_USER npm audit fix || true
/usr/bin/sudo -u $SERVICE_USER npm install

# Build de l'application
print_status "Build de l'application..."
/usr/bin/sudo -u $SERVICE_USER npm run build

# Configuration de Nginx
print_status "Configuration de Nginx..."
/usr/bin/sudo cp nginx.conf $NGINX_CONF
/usr/bin/sudo sed -i "s/your-domain.com/$DOMAIN/g" $NGINX_CONF
/usr/bin/sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
/usr/bin/sudo rm -f /etc/nginx/sites-enabled/default
/usr/bin/sudo nginx -t
/usr/bin/sudo systemctl reload nginx

# Configuration du firewall
print_status "Configuration du firewall..."
/usr/bin/sudo ufw allow ssh
/usr/bin/sudo ufw allow 'Nginx Full'
/usr/bin/sudo ufw --force enable

# Démarrage de l'application avec PM2
print_status "Démarrage de l'application..."
cd $APP_DIR
/usr/bin/sudo -u $SERVICE_USER pm2 start ecosystem.config.cjs
/usr/bin/sudo -u $SERVICE_USER pm2 save

# Configuration du démarrage automatique PM2
print_status "Configuration du démarrage automatique..."
/usr/bin/sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $SERVICE_USER --hp $APP_DIR

# Configuration des logs
print_status "Configuration de la rotation des logs..."
/usr/bin/sudo tee /etc/logrotate.d/net-flox > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        /usr/bin/sudo -u $SERVICE_USER pm2 reloadLogs
    endscript
}
EOF

# Configuration de fail2ban pour Nginx
print_status "Configuration de fail2ban..."
/usr/bin/sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[nginx-http-auth]
enabled = true

[nginx-noscript]
enabled = true

[nginx-badbots]
enabled = true

[nginx-noproxy]
enabled = true
EOF

/usr/bin/sudo systemctl restart fail2ban

# Création du fichier .env si il n'existe pas
if [ ! -f "$APP_DIR/.env" ]; then
    print_status "Création du fichier .env..."
    /usr/bin/sudo -u $SERVICE_USER cp $APP_DIR/.env.example $APP_DIR/.env 2>/dev/null || {
        /usr/bin/sudo -u $SERVICE_USER tee $APP_DIR/.env > /dev/null <<EOF
# Configuration Supabase
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-clé-anonyme-supabase

# Configuration serveur
NODE_ENV=production
PORT=3000
EOF
    }
    print_warning "N'oubliez pas de configurer vos variables Supabase dans $APP_DIR/.env"
fi

print_status "✅ Déploiement terminé avec succès!"
print_status "🌐 Votre application est accessible à l'adresse: http://$DOMAIN"
print_status "📁 Répertoire de l'application: $APP_DIR"
print_status "📁 Répertoire des vidéos: $APP_DIR/public/videos"
print_status ""
print_status "Commandes utiles:"
print_status "  - Voir les logs: sudo -u $SERVICE_USER pm2 logs"
print_status "  - Redémarrer l'app: /usr/bin/sudo -u $SERVICE_USER pm2 restart net-flox"
print_status "  - Statut de l'app: /usr/bin/sudo -u $SERVICE_USER pm2 status"
print_status "  - Recharger Nginx: /usr/bin/sudo systemctl reload nginx"
print_status ""
print_warning "N'oubliez pas de:"
print_warning "  1. Configurer votre domaine dans nginx.conf"
print_warning "  2. Ajouter vos fichiers vidéos dans $APP_DIR/public/videos"
print_warning "  3. Configurer SSL/HTTPS si nécessaire"
print_warning "  4. Configurer vos variables d'environnement Supabase dans $APP_DIR/.env"

# Test de l'application
print_status "Test de l'application..."
sleep 10
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_status "✅ L'application répond correctement!"
    print_status "📊 Statut PM2:"
    /usr/bin/sudo -u $SERVICE_USER pm2 status
else
    print_error "❌ L'application ne répond pas. Vérifiez les logs avec: /usr/bin/sudo -u $SERVICE_USER pm2 logs"
    print_status "📊 Statut PM2:"
    /usr/bin/sudo -u $SERVICE_USER pm2 status
fi