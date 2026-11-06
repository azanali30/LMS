<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Paddle Billing Environment
    |--------------------------------------------------------------------------
    | 'sandbox' or 'live'. In sandbox, Paddle Billing uses sandbox.paddle.com
    | and client-side sandbox tokens. In live, it uses paddle.com.
    | Always defaults to 'sandbox' for safety.
    */
    'environment' => env('PADDLE_ENVIRONMENT', 'sandbox'),

    /*
    |--------------------------------------------------------------------------
    | Paddle API Credentials
    |--------------------------------------------------------------------------
    | API Secret Key for server-side operations and Client-Side Token for
    | initializing Paddle.js on the frontend.
    */
    'api_key' => env('PADDLE_API_KEY'),
    'client_side_token' => env('PADDLE_CLIENT_SIDE_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | Paddle Webhook Secret
    |--------------------------------------------------------------------------
    | The secret key used to verify HMAC-SHA256 signatures on incoming
    | Paddle Billing webhooks via the Paddle-Signature header.
    */
    'webhook_secret' => env('PADDLE_WEBHOOK_SECRET'),

    /*
    |--------------------------------------------------------------------------
    | API Base URLs
    |--------------------------------------------------------------------------
    */
    'urls' => [
        'sandbox' => 'https://sandbox-api.paddle.com',
        'live' => 'https://api.paddle.com',
    ],

    /*
    |--------------------------------------------------------------------------
    | Paddle Billing Price IDs
    |--------------------------------------------------------------------------
    | Mappings from InstitutoPropio plan slugs and intervals to Paddle Price IDs.
    | (e.g. pri_01h... created in Paddle Dashboard)
    */
    'prices' => [
        'starter' => [
            'monthly' => env('PADDLE_PRICE_STARTER_MONTHLY'),
            'annual' => env('PADDLE_PRICE_STARTER_ANNUAL'),
        ],
        'bronze' => [
            'monthly' => env('PADDLE_PRICE_STARTER_MONTHLY'),
            'annual' => env('PADDLE_PRICE_STARTER_ANNUAL'),
        ],
        'growth' => [
            'monthly' => env('PADDLE_PRICE_GROWTH_MONTHLY'),
            'annual' => env('PADDLE_PRICE_GROWTH_ANNUAL'),
        ],
        'silver' => [
            'monthly' => env('PADDLE_PRICE_GROWTH_MONTHLY'),
            'annual' => env('PADDLE_PRICE_GROWTH_ANNUAL'),
        ],
        'professional' => [
            'monthly' => env('PADDLE_PRICE_PROFESSIONAL_MONTHLY'),
            'annual' => env('PADDLE_PRICE_PROFESSIONAL_ANNUAL'),
        ],
        'gold' => [
            'monthly' => env('PADDLE_PRICE_PROFESSIONAL_MONTHLY'),
            'annual' => env('PADDLE_PRICE_PROFESSIONAL_ANNUAL'),
        ],
    ],

];

