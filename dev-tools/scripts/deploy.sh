#!/bin/bash

# Production Deploy Script — runs on the Raspberry Pi
# Usage: ./dev-tools/scripts/deploy.sh [--skip-build] [--skip-migrate]
#
# What it does:
#   1. Pull latest code from git
#   2. Install/update PHP dependencies (no dev)
#   3. Build frontend assets (npm run build)
#   4. Run database migrations
#   5. Clear and rebuild all Laravel caches
#   6. Restart queue workers and Reverb via supervisor
#
# Prerequisites on the Pi:
#   - .env is configured (copy .env.production → .env)
#   - composer, node, npm are installed
#   - supervisor is installed and configured (see bottom of this file)
#   - php artisan schedule:run runs via cron

set -e

SKIP_BUILD=false
SKIP_MIGRATE=false

for arg in "$@"; do
    case $arg in
        --skip-build)   SKIP_BUILD=true ;;
        --skip-migrate) SKIP_MIGRATE=true ;;
    esac
done

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "\n${GREEN}▶ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }

step "Pulling latest code"
git pull origin main

step "Installing PHP dependencies"
composer install --no-dev --optimize-autoloader --no-interaction

if [ "$SKIP_BUILD" = false ]; then
    step "Building frontend assets"
    npm ci --prefer-offline
    npm run build
else
    warn "Skipping frontend build (--skip-build)"
fi

if [ "$SKIP_MIGRATE" = false ]; then
    step "Running database migrations"
    php artisan migrate --force
else
    warn "Skipping migrations (--skip-migrate)"
fi

step "Clearing caches"
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear

step "Rebuilding optimised caches"
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

step "Linking storage"
php artisan storage:link --force 2>/dev/null || true

step "Restarting queue workers and Reverb"
if command -v supervisorctl &>/dev/null; then
    sudo supervisorctl restart backstage-queue:*
    sudo supervisorctl restart backstage-reverb 2>/dev/null || true
    sudo supervisorctl status
else
    warn "supervisorctl not found — restart workers manually"
fi

echo -e "\n${GREEN}✓ Deploy complete${NC}"


################################################################################
# SUPERVISOR CONFIGURATION (save as /etc/supervisor/conf.d/backstage.conf)
################################################################################
#
# [program:backstage-queue]
# process_name=%(program_name)s_%(process_num)02d
# command=php /path/to/backstage/artisan queue:work redis --queue=distributions,confirmations,default --sleep=3 --tries=3 --timeout=90
# autostart=true
# autorestart=true
# stopasgroup=true
# killasgroup=true
# numprocs=2
# user=www-data
# redirect_stderr=true
# stdout_logfile=/var/log/supervisor/backstage-queue.log
# stopwaitsecs=3600
#
# [program:backstage-reverb]
# command=php /path/to/backstage/artisan reverb:start --host=localhost --port=6666
# autostart=true
# autorestart=true
# user=www-data
# redirect_stderr=true
# stdout_logfile=/var/log/supervisor/backstage-reverb.log
#
################################################################################
# CRON (add via: crontab -e -u www-data)
################################################################################
#
# * * * * * cd /path/to/backstage && php artisan schedule:run >> /dev/null 2>&1
#
################################################################################
