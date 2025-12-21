# Production Deployment - Azure

## Environment Configuration

The production environment is configured to use Azure MySQL Database with SSL required.

### Database Connection
- **Host**: `laravel-backstage-server.mysql.database.azure.com`
- **Port**: `3306`
- **Username**: `mlixhsbqjq`
- **Database**: `laravel`
- **SSL Mode**: Required

### Application URL
- **Production URL**: `https://laravel-backstage-a8gpb4dcbhdbb3bm.francecentral-01.azurewebsites.net`

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/main_laravel-backstage.yml`) automatically:

1. Installs PHP 8.4 and Node.js 20
2. Installs Composer dependencies (production mode)
3. Installs npm dependencies and builds frontend assets
4. Copies `.env.production` to `.env`
5. Generates application key
6. Runs Pest test suite
7. Deploys to Azure Web App

## Azure Web App Configuration

### Required Application Settings

Set these in the Azure Portal under **Configuration > Application settings**:

```
APP_KEY=<generated-by-artisan-key-generate>
DB_PASSWORD=~h8h9t7Ve"88iZ0XV_H0(/XU!E4,,#KfEb|!,SyoV_|)^x8lM^
```

### Post-Deployment Commands

After first deployment, run these commands via Azure SSH or Kudu console:

```bash
# Run migrations
php artisan migrate --force

# Link storage
php artisan storage:link

# Clear and cache config
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Local Development with Production Database

To test locally with the production database:

```bash
# Copy production env
cp .env.production .env

# Update APP_URL to localhost
# Set APP_DEBUG=true
# Generate new APP_KEY

# Run migrations (if needed)
php artisan migrate

# Start local server
php artisan serve
```

## Security Notes

- `.env.production` contains sensitive credentials and is **NOT** committed to git (in `.gitignore`)
- Database password uses special characters - ensure proper escaping in Azure settings
- SSL/TLS is required for MySQL connections
- Set `APP_DEBUG=false` in production
- Use strong `APP_KEY` generated via `php artisan key:generate`

## Troubleshooting

### Database Connection Issues
If you see "SQLSTATE[HY000] [2002] Connection refused":
1. Verify Azure MySQL firewall rules allow your IP
2. Check SSL certificate path is correct (`/etc/ssl/certs/ca-certificates.crt`)
3. Ensure `MYSQL_ATTR_SSL_CA` is set in environment

### Asset 404 Errors
If CSS/JS assets return 404:
1. Verify `npm run build` ran successfully in CI
2. Check `public/build/manifest.json` exists
3. Run `php artisan config:clear` on server

### Tests Failing in CI
- Registration tests now skip when `Features::registration()` is disabled
- Other auth tests require proper database seeding
- Check test database connection in CI environment
