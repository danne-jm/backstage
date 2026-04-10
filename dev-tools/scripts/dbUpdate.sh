#!/bin/bash

php artisan migrate:fresh --seed && php artisan migrate:refresh --seed