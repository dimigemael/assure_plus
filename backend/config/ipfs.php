<?php

return [

    /*
    |--------------------------------------------------------------------------
    | IPFS Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour la connexion au nœud IPFS local ou distant
    |
    */

    'host' => env('IPFS_HOST', '127.0.0.1'),

    'port' => env('IPFS_PORT', 5001),

    'gateway_url' => env('IPFS_GATEWAY_URL', 'http://127.0.0.1:8080/ipfs'),

    /*
    |--------------------------------------------------------------------------
    | Upload Settings
    |--------------------------------------------------------------------------
    */

    'max_file_size' => env('IPFS_MAX_FILE_SIZE', 10240), // KB (10MB par défaut)

    'allowed_mime_types' => [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'video/mp4',
        'video/webm',
        'application/json',
        'text/plain',
    ],

    /*
    |--------------------------------------------------------------------------
    | Timeout Settings
    |--------------------------------------------------------------------------
    */

    'timeout' => env('IPFS_TIMEOUT', 30), // secondes

];
