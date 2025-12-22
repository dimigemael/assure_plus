<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Claim;
use Illuminate\Support\Facades\Log;
use Exception;

class InsuranceBlockchainService
{
    private Web3Service $web3;

    public function __construct(Web3Service $web3Service)
    {
        $this->web3 = $web3Service;
    }

    /**
     * Créer une police d'assurance sur la blockchain
     *
     * @param Contract $contract
     * @param string $userAddress Adresse Ethereum de l'utilisateur
     * @return array ['txHash' => string, 'policyId' => int, 'receipt' => array]
     */
    public function createPolicy(Contract $contract, string $userAddress): array
    {
        try {
            // Convertir les montants XAF en Wei (via conversion XAF → ETH → Wei)
            $coverageAmountWei = $this->web3->xafToWei($contract->montant_couverture);
            $premiumWei = $this->web3->xafToWei($contract->prime);

            // Calculer la durée en secondes
            $startDate = strtotime($contract->date_debut);
            $endDate = strtotime($contract->date_fin);
            $duration = $endDate - $startDate;

            // Préparer les paramètres
            $params = [
                $coverageAmountWei,  // uint256 coverageAmount
                $premiumWei,         // uint256 premium
                $duration            // uint256 duration
            ];

            // Envoyer la transaction avec la prime en value
            $txHash = $this->web3->sendTransaction(
                'createPolicy',
                $params,
                [
                    'from' => $userAddress,
                    'value' => $premiumWei,
                    'gas' => '0x100000'
                ]
            );

            // Attendre le minage de la transaction
            $receipt = $this->web3->waitForTransaction($txHash);

            // Extraire le policyId depuis les logs de l'événement
            $policyId = $this->extractPolicyIdFromReceipt($receipt);

            Log::info('Policy created on blockchain', [
                'contract_id' => $contract->id,
                'tx_hash' => $txHash,
                'policy_id' => $policyId,
                'gas_used' => $receipt['gasUsed'] ?? 'N/A'
            ]);

            return [
                'txHash' => $txHash,
                'policyId' => $policyId,
                'receipt' => $receipt
            ];

        } catch (Exception $e) {
            Log::error('Failed to create policy on blockchain', [
                'contract_id' => $contract->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Payer une prime pour une police existante
     *
     * @param int $policyId ID de la police sur la blockchain
     * @param float $premiumAmount Montant de la prime en ETH
     * @param string $userAddress Adresse de l'utilisateur
     * @return array
     */
    public function payPremium(int $policyId, float $premiumAmount, string $userAddress): array
    {
        try {
            // Convertir XAF en Wei
            $premiumWei = $this->web3->xafToWei($premiumAmount);

            $txHash = $this->web3->sendTransaction(
                'payPremium',
                [$policyId],
                [
                    'from' => $userAddress,
                    'value' => $premiumWei,
                    'gas' => '0x50000'
                ]
            );

            $receipt = $this->web3->waitForTransaction($txHash);

            Log::info('Premium paid on blockchain', [
                'policy_id' => $policyId,
                'amount' => $premiumAmount,
                'tx_hash' => $txHash
            ]);

            return [
                'txHash' => $txHash,
                'receipt' => $receipt
            ];

        } catch (Exception $e) {
            Log::error('Failed to pay premium on blockchain', [
                'policy_id' => $policyId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Déclarer un sinistre sur la blockchain
     *
     * @param Claim $claim
     * @param int $policyId ID de la police sur la blockchain
     * @param string $ipfsHash Hash IPFS des preuves
     * @param string $userAddress Adresse de l'utilisateur
     * @return array
     */
    public function declareClaim(Claim $claim, int $policyId, string $ipfsHash, string $userAddress): array
    {
        try {
            // Convertir XAF en Wei
            $amountWei = $this->web3->xafToWei($claim->montant_reclame);

            $txHash = $this->web3->sendTransaction(
                'declareClaim',
                [
                    $policyId,
                    $amountWei,
                    $ipfsHash
                ],
                [
                    'from' => $userAddress,
                    'gas' => '0x100000'
                ]
            );

            $receipt = $this->web3->waitForTransaction($txHash);
            $claimId = $this->extractClaimIdFromReceipt($receipt);

            Log::info('Claim declared on blockchain', [
                'claim_id' => $claim->id,
                'policy_id' => $policyId,
                'blockchain_claim_id' => $claimId,
                'tx_hash' => $txHash
            ]);

            return [
                'txHash' => $txHash,
                'claimId' => $claimId,
                'receipt' => $receipt
            ];

        } catch (Exception $e) {
            Log::error('Failed to declare claim on blockchain', [
                'claim_id' => $claim->id,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Valider ou rejeter un sinistre sur la blockchain
     *
     * @param int $claimId ID du sinistre sur la blockchain
     * @param bool $approved Approuvé ou rejeté
     * @param string $adminAddress Adresse de l'administrateur/expert
     * @return array
     */
    public function validateClaim(int $claimId, bool $approved, string $adminAddress): array
    {
        try {
            $txHash = $this->web3->sendTransaction(
                'validateClaim',
                [
                    $claimId,
                    $approved
                ],
                [
                    'from' => $adminAddress,
                    'gas' => '0x100000'
                ]
            );

            $receipt = $this->web3->waitForTransaction($txHash);

            Log::info('Claim validated on blockchain', [
                'claim_id' => $claimId,
                'approved' => $approved,
                'tx_hash' => $txHash
            ]);

            return [
                'txHash' => $txHash,
                'receipt' => $receipt
            ];

        } catch (Exception $e) {
            Log::error('Failed to validate claim on blockchain', [
                'claim_id' => $claimId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Récupérer les détails d'une police depuis la blockchain
     *
     * @param int $policyId
     * @return array
     */
    public function getPolicy(int $policyId): array
    {
        try {
            $result = $this->web3->call('getPolicy', [$policyId]);

            // Decoder le résultat (structure de retour du contrat)
            return $this->decodePolicyData($result);

        } catch (Exception $e) {
            Log::error('Failed to get policy from blockchain', [
                'policy_id' => $policyId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Récupérer les détails d'un sinistre depuis la blockchain
     *
     * @param int $claimId
     * @return array
     */
    public function getClaim(int $claimId): array
    {
        try {
            $result = $this->web3->call('getClaim', [$claimId]);

            // Decoder le résultat
            return $this->decodeClaimData($result);

        } catch (Exception $e) {
            Log::error('Failed to get claim from blockchain', [
                'claim_id' => $claimId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Récupérer les événements PolicyCreated
     *
     * @param int|null $fromBlock
     * @param int|null $toBlock
     * @return array
     */
    public function getPolicyCreatedEvents(?int $fromBlock = null, ?int $toBlock = null): array
    {
        try {
            $eventSignature = '0x' . substr($this->web3->keccak256('PolicyCreated(uint256,address,uint256,uint256,uint256)'), 2, 64);

            $filter = [
                'fromBlock' => $fromBlock ? '0x' . dechex($fromBlock) : '0x0',
                'toBlock' => $toBlock ? '0x' . dechex($toBlock) : 'latest',
                'topics' => [$eventSignature]
            ];

            return $this->web3->getLogs($filter);

        } catch (Exception $e) {
            Log::error('Failed to get PolicyCreated events', [
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }

    /**
     * Extraire le policyId depuis le reçu de transaction
     */
    private function extractPolicyIdFromReceipt(array $receipt): ?int
    {
        Log::info('Extracting policyId from receipt', [
            'has_logs' => !empty($receipt['logs']),
            'logs_count' => count($receipt['logs'] ?? [])
        ]);

        if (empty($receipt['logs'])) {
            Log::warning('No logs found in transaction receipt');
            return null;
        }

        foreach ($receipt['logs'] as $index => $log) {
            Log::info('Processing log', [
                'log_index' => $index,
                'topics_count' => count($log['topics'] ?? []),
                'topics' => $log['topics'] ?? []
            ]);

            // Le premier topic après l'event signature est le policyId (indexed)
            if (isset($log['topics'][1])) {
                $policyIdHex = $log['topics'][1];
                $policyId = hexdec($policyIdHex);

                Log::info('PolicyId extracted successfully', [
                    'hex' => $policyIdHex,
                    'decimal' => $policyId
                ]);

                return $policyId;
            }
        }

        Log::warning('No policyId found in logs');
        return null;
    }

    /**
     * Extraire le claimId depuis le reçu de transaction
     */
    private function extractClaimIdFromReceipt(array $receipt): ?int
    {
        if (empty($receipt['logs'])) {
            return null;
        }

        foreach ($receipt['logs'] as $log) {
            if (isset($log['topics'][1])) {
                return hexdec($log['topics'][1]);
            }
        }

        return null;
    }

    /**
     * Décoder les données d'une police
     */
    private function decodePolicyData(string $hexData): array
    {
        // Implémentation simplifiée - à améliorer avec une vraie bibliothèque ABI
        // Pour l'instant on retourne le hex brut
        return [
            'raw' => $hexData
        ];
    }

    /**
     * Décoder les données d'un sinistre
     */
    private function decodeClaimData(string $hexData): array
    {
        // Implémentation simplifiée - à améliorer avec une vraie bibliothèque ABI
        return [
            'raw' => $hexData
        ];
    }

    /**
     * Vérifier la connexion à la blockchain
     */
    public function isConnected(): bool
    {
        return $this->web3->isConnected();
    }

    /**
     * Récupérer l'adresse du contrat
     */
    public function getContractAddress(): string
    {
        return $this->web3->getContractAddress();
    }
}
