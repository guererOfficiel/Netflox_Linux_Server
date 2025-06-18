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
sudo apt update && sudo apt upgrade -y

# Installation des dépendances système
print_status "Installation des dépendances système..."
sudo apt install -y curl wget git nginx ufw fail2ban

# Installation de Node.js (version LTS)
print_status "Installation de Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de PM2 globalement
print_status "Installation de PM2..."
sudo npm install -g pm2

# Création de l'utilisateur système
print_status "Création de l'utilisateur système..."
if ! id "$SERVICE_USER" &>/dev/null; then
    sudo useradd -r -s /bin/bash -d $APP_DIR $SERVICE_USER
    print_status "Utilisateur $SERVICE_USER créé"
else
    print_warning "L'utilisateur $SERVICE_USER existe déjà"
fi

# Création du répertoire de l'application
print_status "Création du répertoire de l'application..."
sudo mkdir -p $APP_DIR
sudo mkdir -p $APP_DIR/public/videos
sudo mkdir -p $APP_DIR/logs
sudo chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# Copie des fichiers de l'application
print_status "Copie des fichiers de l'application..."
sudo cp -r . $APP_DIR/
sudo chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# Installation des dépendances Node.js
print_status "Installation des dépendances Node.js..."
cd $APP_DIR
sudo -u $SERVICE_USER npm install

# Build de l'application
print_status "Build de l'application..."
sudo -u $SERVICE_USER npm run build

# Configuration de Nginx
print_status "Configuration de Nginx..."
sudo cp nginx.conf $NGINX_CONF
sudo sed -i "s/your-domain.com/$DOMAIN/g" $NGINX_CONF
sudo ln -sf $NGINX_CONF /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configuration du firewall
print_status "Configuration du firewall..."
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Démarrage de l'application avec PM2
print_status "Démarrage de l'application..."
cd $APP_DIR
sudo -u $SERVICE_USER pm2 start ecosystem.config.js
sudo -u $SERVICE_USER pm2 save
sudo -u $SERVICE_USER pm2 startup

# Configuration des logs
print_status "Configuration de la rotation des logs..."
sudo tee /etc/logrotate.d/net-flox > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
    postrotate
        sudo -u $SERVICE_USER pm2 reloadLogs
    endscript
}
EOF

# Configuration de fail2ban pour Nginx
print_status "Configuration de fail2ban..."
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
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

sudo systemctl restart fail2ban

print_status "✅ Déploiement terminé avec succès!"
print_status "🌐 Votre application est accessible à l'adresse: http://$DOMAIN"
print_status "📁 Répertoire de l'application: $APP_DIR"
print_status "📁 Répertoire des vidéos: $APP_DIR/public/videos"
print_status ""
print_status "Commandes utiles:"
print_status "  - Voir les logs: sudo -u $SERVICE_USER pm2 logs"
print_status "  - Redémarrer l'app: sudo -u $SERVICE_USER pm2 restart net-flox"
print_status "  - Statut de l'app: sudo -u $SERVICE_USER pm2 status"
print_status "  - Recharger Nginx: sudo systemctl reload nginx"
print_status ""
print_warning "N'oubliez pas de:"
print_warning "  1. Configurer votre domaine dans nginx.conf"
print_warning "  2. Ajouter vos fichiers vidéos dans $APP_DIR/public/videos"
print_warning "  3. Configurer SSL/HTTPS si nécessaire"
print_warning "  4. Configurer vos variables d'environnement Supabase dans .env"