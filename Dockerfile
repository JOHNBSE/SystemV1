FROM php:8.2-cli

RUN apt-get update && apt-get install -y libzip-dev unzip git \
    && docker-php-ext-install pdo_mysql zip bcmath \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
COPY . .
RUN cp -n .env.example .env \
    && composer install --no-interaction --prefer-dist

EXPOSE 8000
CMD ["sh", "-c", "[ -z \"$APP_KEY\" ] && php artisan key:generate --force; php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000 --no-reload"]
