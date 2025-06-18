#!/bin/bash

# Script de déploiement rapide pour mise à jour
set -e

APP_DIR="/var/www/net-flox"
SERVICE_USER="netflox"

echo "🔄 Mise à jour rapide de Net-Flox..."

# Vérifier si l'application existe
if [ ! -d "$APP_DIR" ]; then
    echo "❌ L'application n'est pas encore déployée. Utilisez ./deploy.sh d'abord."
    exit 1
fi

# Arrêter l'application
echo "⏹️  Arrêt de l'application..."
sudo -u $SERVICE_USER pm2 stop net-flox || true

# Sauvegarder les fichiers de configuration
echo "💾 Sauvegarde des configurations..."
sudo cp $APP_DIR/.env /tmp/.env.backup 2>/dev/null || true

# Copier les nouveaux fichiers
echo "📁 Copie des nouveaux fichiers..."
sudo cp -r . $APP_DIR/
sudo chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR

# Restaurer la configuration
sudo cp /tmp/.env.backup $APP_DIR/.env 2>/dev/null || true

# Supprimer l'ancien fichier de config PM2
sudo rm -f $APP_DIR/ecosystem.config.js

# Installer les dépendances et build
echo "📦 Installation des dépendances..."
cd $APP_DIR
sudo -u $SERVICE_USER npm install

echo "🔨 Build de l'application..."
sudo -u $SERVICE_USER npm run build

# Redémarrer l'application
echo "🚀 Redémarrage de l'application..."
sudo -u $SERVICE_USER pm2 start ecosystem.config.cjs || sudo -u $SERVICE_USER pm2 restart net-flox

echo "✅ Mise à jour terminée!"
echo "📊 Statut de l'application:"
sudo -u $SERVICE_USER pm2 status