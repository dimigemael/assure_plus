<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Blockchain RPC URL
    |--------------------------------------------------------------------------
    |
    | URL du nœud Ethereum (Ganache en local)
    |
    */
    'rpc_url' => env('BLOCKCHAIN_RPC_URL', 'http://ganache:8545'),

    /*
    |--------------------------------------------------------------------------
    | Smart Contract Address
    |--------------------------------------------------------------------------
    |
    | Adresse du contrat InsuranceContract déployé sur Ganache
    | Récupérée automatiquement depuis le fichier build de Truffle
    |
    */
    'contract_address' => env('BLOCKCHAIN_CONTRACT_ADDRESS', '0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab'),

    /*
    |--------------------------------------------------------------------------
    | Network ID
    |--------------------------------------------------------------------------
    |
    | ID du réseau blockchain (5777 pour Ganache par défaut)
    |
    */
    'network_id' => env('BLOCKCHAIN_NETWORK_ID', '5777'),

    /*
    |--------------------------------------------------------------------------
    | Gas Limit
    |--------------------------------------------------------------------------
    |
    | Limite de gas par défaut pour les transactions
    |
    */
    'gas_limit' => env('BLOCKCHAIN_GAS_LIMIT', 6721975),

    /*
    |--------------------------------------------------------------------------
    | Gas Price
    |--------------------------------------------------------------------------
    |
    | Prix du gas en Wei (20 Gwei par défaut)
    |
    */
    'gas_price' => env('BLOCKCHAIN_GAS_PRICE', 20000000000),
];
