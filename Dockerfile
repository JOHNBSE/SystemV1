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
# ponytail: mysql's official image can report the healthcheck "healthy" against its own
# temporary init-time server, right before it restarts for real and briefly refuses
# connections. depends_on+healthcheck alone isn't enough on a fresh volume, so retry here.
CMD ["sh", "-c", "[ -z \"$APP_KEY\" ] && php artisan key:generate --force; i=0; until php artisan migrate --force; do i=$((i+1)); [ $i -ge 10 ] && exit 1; sleep 3; done; php artisan serve --host=0.0.0.0 --port=8000 --no-reload"]
