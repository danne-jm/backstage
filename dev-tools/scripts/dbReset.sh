#!/bin/bash
# Reset and reseed the database to a clean state.

echo "--- Resetting and Reseeding Database ---"
php artisan migrate:fresh --seed

echo "--- Done ---"
