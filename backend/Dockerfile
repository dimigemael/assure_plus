# Utiliser l'image PHP 8.2 FPM Alpine (légère)
FROM php:8.2-fpm-alpine

# Informations du mainteneur
LABEL maintainer="TAHUE TCHOUTCHOUA GEMAEL DIMITRI"
LABEL description="Backend Laravel pour le système d'assurance blockchain"

# Installer les dépendances système
RUN apk add --no-cache \
    bash \
    curl \
    git \
    unzip \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    oniguruma-dev \
    libxml2-dev \
    zip \
    mysql-client \
    nodejs \
    npm

# Installer les extensions PHP nécessaires
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install \
        pdo_mysql \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        xml \
        soap

# Installer Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Définir le répertoire de travail
WORKDIR /var/www

# Copier les fichiers du projet
COPY . .

# Définir les permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 755 /var/www/storage \
    && chmod -R 755 /var/www/bootstrap/cache

# Exposer le port 8000
EXPOSE 8000

# Commande par défaut (sera écrasée par docker-compose)
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
