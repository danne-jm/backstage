# ==========================================
# 1. Vendor Stage - Install PHP Dependencies
# ==========================================
FROM --platform=$BUILDPLATFORM composer:2.7 AS vendor
WORKDIR /app

# Copy only composer files to leverage Docker cache
COPY composer.json composer.lock ./

# Install dependencies
RUN composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --ignore-platform-reqs \
    --no-scripts

# ==========================================
# 2. Frontend Stage - Build Vite Assets
# ==========================================
FROM --platform=$BUILDPLATFORM php:8.3-alpine AS frontend
WORKDIR /app

# Install NPM dependencies and Node.js
RUN apk add --no-cache nodejs npm
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the app and vendor folder
COPY . .
COPY --from=vendor /app/vendor/ ./vendor/

# Generate an application key so Artisan can boot without error
# Also clear cached packages from the host environment to avoid missing dev dependencies
RUN rm -f bootstrap/cache/*.php && cp .env.example .env && php artisan key:generate

# Force Node.js to resolve IPv4 first. This fixes the root cause of the "getaddrinfo EAI_AGAIN" DNS error 
# when Node.js attempts to fetch from bunny.net inside an Alpine container under QEMU emulation.
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
RUN npm run build && rm .env

# ==========================================
# 3. Production Stage - PHP-FPM & Nginx
# ==========================================
FROM --platform=linux/arm64 php:8.3-fpm-alpine AS production

# Install system dependencies, Nginx, and Supervisor
RUN apk update && apk add --no-cache \
    nginx \
    supervisor \
    curl \
    zip \
    unzip \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    icu-dev \
    oniguruma-dev \
    libzip-dev \
    postgresql-dev \
    libwebp-dev

# Configure and install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install pdo_mysql pdo_pgsql mbstring exif pcntl bcmath gd intl zip

# Set working directory
WORKDIR /var/www/html

# Copy vendor and built frontend assets from previous stages
COPY --from=vendor /app/vendor/ ./vendor/
COPY --from=frontend /app/public/build/ ./public/build/

# Copy the rest of the application
COPY . .

# Set permissions for Laravel and Nginx to run as non-root
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache \
    && mkdir -p /var/cache/nginx /var/run/nginx /var/log/nginx /var/log/supervisor \
    && chown -R www-data:www-data /var/cache/nginx /var/run/nginx /var/log/nginx /var/log/supervisor /etc/nginx/http.d /var/lib/nginx

# Configure Nginx for unprivileged execution
RUN sed -i '/user nginx;/d' /etc/nginx/nginx.conf \
    && sed -i 's/pid \/run\/nginx\/nginx.pid;/pid \/tmp\/nginx.pid;/' /etc/nginx/nginx.conf

# ------------------------------------------
# Configure Nginx Virtual Host
# ------------------------------------------
RUN cat <<'EOF' > /etc/nginx/http.d/default.conf
server {
    listen 8080;
    server_name _;
    root /var/www/html/public;
    index index.php;
    charset utf-8;
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }
    error_page 404 /index.php;
    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }
    location ~ /\.(?!well-known).* {
        deny all;
    }
}
EOF

# ------------------------------------------
# Configure Supervisord
# ------------------------------------------
RUN cat <<'EOF' > /etc/supervisord.conf
[supervisord]
nodaemon=true
logfile=/tmp/supervisord.log
pidfile=/tmp/supervisord.pid

[program:php-fpm]
command=php-fpm -F
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:nginx]
command=nginx -g "daemon off;"
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
numprocs=1
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
EOF

RUN chown www-data:www-data /etc/supervisord.conf /etc/nginx/http.d/default.conf

# Switch to the restricted user
USER www-data

# Expose unprivileged HTTP port
EXPOSE 8080

# Start Supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
