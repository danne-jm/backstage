<?php

// Public (no auth required)
require __DIR__ . '/public/backstage.php';

// Authenticated feature routes
require __DIR__ . '/backstage/auth.php';
require __DIR__ . '/backstage/dashboard.php';
require __DIR__ . '/backstage/office.php';
require __DIR__ . '/backstage/sellables.php';
require __DIR__ . '/backstage/ticket-scanner.php';
require __DIR__ . '/backstage/email-distributor.php';
require __DIR__ . '/backstage/inventory.php';
require __DIR__ . '/backstage/store-manager.php';
require __DIR__ . '/backstage/settings.php';
