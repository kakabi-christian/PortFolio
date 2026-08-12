FROM php:8.4-fpm-alpine

# 1. Mise à jour et installation des dépendances système
RUN apk update && apk add --no-cache \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    oniguruma-dev \
    zip \
    unzip \
    git

# 2. Installation des extensions PHP et nettoyage des outils de build
RUN apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring zip exif pcntl bcmath gd \
    && apk del .build-deps

# 3. Installation de Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 4. Dossier de travail
WORKDIR /var/www

# 5. Copie du code source
COPY . .

# 6. Installation des dépendances Laravel (simplifié)
RUN composer install --no-interaction --optimize-autoloader --no-dev --prefer-dist

# 7. Configuration des permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache

# 8. Exposition du port
EXPOSE 8000

# 9. Commande de lancement
CMD php artisan serve --host=0.0.0.0 --port=${PORT:-8000}