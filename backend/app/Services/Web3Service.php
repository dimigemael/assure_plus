<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Exception;
use kornrunner\Keccak;

class Web3Service
{
    private Client $client;
    private string $rpcUrl;
    private string $contractAddress;
    private array $contractAbi;
    private string $defaultAccount;

    public function __construct()
    {
        $this->rpcUrl = config('blockchain.rpc_url', 'http://ganache:8545');
        $this->contractAddress = config('blockchain.contract_address');

        $this->client = new Client([
            'base_uri' => $this->rpcUrl,
            'timeout' => 30.0,
        ]);

        // Charger l'ABI du contrat
        $this->loadContractAbi();

        // Récupérer le compte par défaut
        $this->defaultAccount = $this->getDefaultAccount();
    }

    /**
     * Charge l'ABI du Smart Contract depuis le fichier build de Truffle
     */
    private function loadContractAbi(): void
    {
        $abiPath = storage_path('app/contracts/InsuranceContract.json');

        if (!file_exists($abiPath)) {
            throw new Exception("ABI file not found at: {$abiPath}");
        }

        $abiJson = json_decode(file_get_contents($abiPath), true);
        $this->contractAbi = $abiJson['abi'] ?? [];

        // Si l'adresse du contrat n'est pas configurée, la récupérer du fichier build
        if (empty($this->contractAddress) && isset($abiJson['networks']['5777']['address'])) {
            $this->contractAddress = $abiJson['networks']['5777']['address'];
        }
    }

    /**
     * Effectue un appel RPC vers Ganache
     */
    private function rpcCall(string $method, array $params = []): mixed
    {
        try {
            $response = $this->client->post('/', [
                'json' => [
                    'jsonrpc' => '2.0',
                    'method' => $method,
                    'params' => $params,
                    'id' => 1,
                ]
            ]);

            $result = json_decode($response->getBody()->getContents(), true);

            if (isset($result['error'])) {
                throw new Exception("RPC Error: " . json_encode($result['error']));
            }

            return $result['result'] ?? null;

        } catch (Exception $e) {
            Log::error("RPC Call failed", [
                'method' => $method,
                'params' => $params,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Récupère le compte par défaut (premier compte Ganache)
     */
    private function getDefaultAccount(): string
    {
        $accounts = $this->rpcCall('eth_accounts');
        return $accounts[0] ?? throw new Exception("No accounts found");
    }

    /**
     * Récupère tous les comptes disponibles
     */
    public function getAccounts(): array
    {
        return $this->rpcCall('eth_accounts');
    }

    /**
     * Récupère le solde d'un compte en Wei
     */
    public function getBalance(string $address): string
    {
        return $this->rpcCall('eth_getBalance', [$address, 'latest']);
    }

    /**
     * Convertit Wei en Ether
     */
    public function weiToEther(string $wei): float
    {
        return (float) bcdiv($wei, '1000000000000000000', 18);
    }

    /**
     * Convertit Ether en Wei
     */
    public function etherToWei(float $ether): string
    {
        return bcmul((string) $ether, '1000000000000000000', 0);
    }

    /**
     * Convertit XAF en Wei (via ETH)
     * 1 ETH = 2,500,000 XAF (taux de conversion fixe)
     */
    public function xafToWei(float $xaf): string
    {
        $ethToXafRate = 2500000; // 1 ETH = 2,500,000 XAF
        $ethAmount = $xaf / $ethToXafRate;
        return $this->etherToWei($ethAmount);
    }

    /**
     * Encode les paramètres d'une fonction pour l'appel au contrat
     */
    private function encodeFunction(string $functionName, array $params): string
    {
        // Trouve la fonction dans l'ABI
        $functionAbi = collect($this->contractAbi)->firstWhere('name', $functionName);

        if (!$functionAbi) {
            throw new Exception("Function {$functionName} not found in ABI");
        }

        // Calcule le function selector (4 premiers bytes du hash keccak256)
        $signature = $functionName . '(' . $this->buildSignature($functionAbi['inputs']) . ')';
        $selector = substr($this->keccak256($signature), 0, 10);

        // Encode les paramètres
        $encodedParams = $this->encodeParameters($functionAbi['inputs'], $params);

        return $selector . $encodedParams;
    }

    /**
     * Construit la signature de la fonction
     */
    private function buildSignature(array $inputs): string
    {
        return implode(',', array_map(fn($input) => $input['type'], $inputs));
    }

    /**
     * Hash keccak256
     */
    public function keccak256(string $data): string
    {
        return '0x' . Keccak::hash($data, 256);
    }

    /**
     * Encode les paramètres (implémentation simplifiée)
     */
    private function encodeParameters(array $types, array $params): string
    {
        $encoded = '';

        foreach ($types as $i => $type) {
            $value = $params[$i] ?? null;

            if ($type['type'] === 'uint256') {
                // Convertir en int si c'est une string
                $intValue = is_string($value) ? intval($value) : $value;
                $encoded .= str_pad(dechex($intValue), 64, '0', STR_PAD_LEFT);
            } elseif ($type['type'] === 'address') {
                $encoded .= str_pad(str_replace('0x', '', $value), 64, '0', STR_PAD_LEFT);
            } elseif ($type['type'] === 'string') {
                // Encoding simplifié pour les strings
                $hexString = bin2hex($value);
                $encoded .= str_pad($hexString, 64, '0', STR_PAD_RIGHT);
            }
        }

        return $encoded;
    }

    /**
     * Envoie une transaction vers le Smart Contract
     */
    public function sendTransaction(string $functionName, array $params, array $options = []): string
    {
        $data = $this->encodeFunction($functionName, $params);

        $transaction = [
            'from' => $options['from'] ?? $this->defaultAccount,
            'to' => $this->contractAddress,
            'data' => $data,
            'gas' => $options['gas'] ?? '0x100000',
        ];

        if (isset($options['value'])) {
            $intValue = is_string($options['value']) ? intval($options['value']) : $options['value'];
            $transaction['value'] = '0x' . dechex($intValue);
        }

        return $this->rpcCall('eth_sendTransaction', [$transaction]);
    }

    /**
     * Effectue un appel (lecture seule) au Smart Contract
     */
    public function call(string $functionName, array $params): mixed
    {
        $data = $this->encodeFunction($functionName, $params);

        $transaction = [
            'to' => $this->contractAddress,
            'data' => $data,
        ];

        return $this->rpcCall('eth_call', [$transaction, 'latest']);
    }

    /**
     * Récupère le reçu d'une transaction
     */
    public function getTransactionReceipt(string $txHash): ?array
    {
        return $this->rpcCall('eth_getTransactionReceipt', [$txHash]);
    }

    /**
     * Attend qu'une transaction soit minée
     */
    public function waitForTransaction(string $txHash, int $maxAttempts = 30): array
    {
        for ($i = 0; $i < $maxAttempts; $i++) {
            $receipt = $this->getTransactionReceipt($txHash);

            if ($receipt !== null) {
                return $receipt;
            }

            sleep(1);
        }

        throw new Exception("Transaction {$txHash} not mined after {$maxAttempts} attempts");
    }

    /**
     * Récupère les logs/événements du contrat
     */
    public function getLogs(array $filter): array
    {
        $filter['address'] = $this->contractAddress;
        return $this->rpcCall('eth_getLogs', [$filter]);
    }

    /**
     * Teste la connexion à Ganache
     */
    public function isConnected(): bool
    {
        try {
            $this->rpcCall('web3_clientVersion');
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Récupère l'adresse du contrat
     */
    public function getContractAddress(): string
    {
        return $this->contractAddress;
    }
}
