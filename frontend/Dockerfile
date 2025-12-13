# ========================================
# Dockerfile - Frontend React + Vite
# ========================================
# Image de base Node.js LTS
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm install

# Copier tous les fichiers du projet
COPY . .

# Exposer le port de développement Vite
EXPOSE 5173

# Variables d'environnement par défaut
ENV VITE_API_URL=http://localhost:8000/api
ENV VITE_GANACHE_URL=http://localhost:7545

# Démarrer le serveur de développement Vite
# --host 0.0.0.0 permet l'accès depuis l'extérieur du conteneur
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
