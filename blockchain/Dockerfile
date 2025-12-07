# Utiliser l'image Node.js Alpine (légère)
FROM node:20-alpine

# Informations du mainteneur
LABEL maintainer="TAHUE TCHOUTCHOUA GEMAEL DIMITRI"
LABEL description="Smart Contracts Truffle pour le système d'assurance blockchain"

# Installer les dépendances système
RUN apk add --no-cache \
    bash \
    git \
    python3 \
    make \
    g++

# Installer Truffle globalement
RUN npm install -g truffle@5.11.5

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et installer les dépendances
COPY package*.json ./
RUN npm install

# Copier les fichiers du projet
COPY . .

# Exposer le port (si besoin pour des tests)
EXPOSE 9545

# Commande par défaut
CMD ["npx", "truffle", "console", "--network", "development"]
