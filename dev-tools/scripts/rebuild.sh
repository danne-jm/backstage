#!/bin/bash

php artisan route:clear && php artisan view:clear && php artisan cache:clear && php artisan config:clear && npm run build

