<?php

namespace App\Http\Controllers;

use App\Services\Web3Service;
use App\Services\InsuranceBlockchainService;
use Illuminate\Http\Request;

class BlockchainTestController extends Controller
{
    private Web3Service $web3;
    private InsuranceBlockchainService $blockchainService;

    public function __construct(Web3Service $web3Service, InsuranceBlockchainService $blockchainService)
    {
        $this->web3 = $web3Service;
        $this->blockchainService = $blockchainService;
    }

    /**
     * Test de connexion à Ganache
     * GET /api/blockchain/test
     */
    public function testConnection()
    {
        try {
            // Test simple RPC call
            $client = new \GuzzleHttp\Client([
                'base_uri' => config('blockchain.rpc_url', 'http://ganache:8545'),
                'timeout' => 5.0,
            ]);

            $response = $client->post('/', [
                'json' => [
                    'jsonrpc' => '2.0',
                    'method' => 'web3_clientVersion',
                    'params' => [],
                    'id' => 1,
                ]
            ]);

            $result = json_decode($response->getBody()->getContents(), true);

            return response()->json([
                'status' => 'success',
                'message' => 'Connexion blockchain réussie',
                'blockchain' => [
                    'connected' => true,
                    'rpc_url' => config('blockchain.rpc_url'),
                    'network_id' => config('blockchain.network_id'),
                    'contract_address' => config('blockchain.contract_address'),
                    'client_version' => $result['result'] ?? 'N/A'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors du test blockchain',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    /**
     * Récupérer les informations du Smart Contract
     * GET /api/blockchain/contract-info
     */
    public function getContractInfo()
    {
        try {
            $contractAddress = $this->blockchainService->getContractAddress();

            return response()->json([
                'status' => 'success',
                'contract' => [
                    'address' => $contractAddress,
                    'network_id' => config('blockchain.network_id'),
                    'abi_path' => base_path('../blockchain/build/contracts/InsuranceContract.json'),
                    'view_on_ganache' => 'http://localhost:7545'
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Erreur lors de la récupération des infos du contrat',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
