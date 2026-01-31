<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
    ],

    'sumup' => [
        'api_key' => env('SUMUP_API_KEY'),
        'merchant_code' => env('SUMUP_MERCHANT_CODE'),
        'api_url' => env('SUMUP_API_URL', 'https://api.sumup.com'),
        'return_url' => env('SUMUP_RETURN_URL', env('APP_URL').'/payment/callback'),
        'webhook_secret' => env('SUMUP_WEBHOOK_SECRET'),
        'processing_fee_rate' => env('SUMUP_PROCESSING_FEE_RATE', 0.02), // 2% default (update if SumUp changes their fees)
    ],

];
