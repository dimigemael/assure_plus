<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Exception;

/**
 * Service pour interagir avec IPFS
 * Permet l'upload et la récupération de fichiers sur IPFS
 */
class IPFSService
{
    protected string $host;
    protected int $port;
    protected string $baseUrl;
    protected string $gatewayUrl;

    public function __construct()
    {
        $this->host = config('ipfs.host', '127.0.0.1');
        $this->port = config('ipfs.port', 5001);
        $this->baseUrl = "http://{$this->host}:{$this->port}/api/v0";
        $this->gatewayUrl = config('ipfs.gateway_url', "http://{$this->host}:8080/ipfs");
    }

    /**
     * Upload un fichier vers IPFS
     *
     * @param \Illuminate\Http\UploadedFile $file
     * @return array ['hash' => string, 'name' => string, 'size' => int]
     * @throws Exception
     */
    public function uploadFile($file): array
    {
        try {
            // Vérifier que le fichier est valide
            if (!$file->isValid()) {
                throw new Exception('Fichier invalide');
            }

            Log::info('IPFS Upload attempt', [
                'filename' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType(),
            ]);

            // Préparer la requête multipart
            $response = Http::timeout(30)
                ->attach(
                    'file',
                    file_get_contents($file->getRealPath()),
                    $file->getClientOriginalName()
                )
                ->post("{$this->baseUrl}/add?pin=true");

            Log::info('IPFS Upload response', [
                'status' => $response->status(),
                'body' => $response->body(),
                'successful' => $response->successful(),
            ]);

            if (!$response->successful()) {
                Log::error('IPFS Upload failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new Exception('Erreur lors de l\'upload vers IPFS: ' . $response->body());
            }

            $result = $response->json();

            if (!$result || !isset($result['Hash'])) {
                Log::error('IPFS Upload response invalid', [
                    'result' => $result,
                    'body' => $response->body(),
                ]);
                throw new Exception('Réponse IPFS invalide: ' . $response->body());
            }

            Log::info('IPFS Upload successful', [
                'hash' => $result['Hash'],
                'size' => $result['Size'],
            ]);

            return [
                'hash' => $result['Hash'],
                'name' => $result['Name'] ?? $file->getClientOriginalName(),
                'size' => (int) $result['Size'],
                'gateway_url' => "{$this->gatewayUrl}/{$result['Hash']}",
            ];

        } catch (Exception $e) {
            Log::error('IPFS Upload exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Upload plusieurs fichiers vers IPFS
     *
     * @param array $files Array de UploadedFile
     * @return array Array de résultats d'upload
     */
    public function uploadMultipleFiles(array $files): array
    {
        $results = [];

        foreach ($files as $file) {
            try {
                $results[] = $this->uploadFile($file);
            } catch (Exception $e) {
                Log::error('Error uploading file to IPFS', [
                    'filename' => $file->getClientOriginalName(),
                    'error' => $e->getMessage(),
                ]);
                // Continue avec les autres fichiers
                $results[] = [
                    'error' => $e->getMessage(),
                    'filename' => $file->getClientOriginalName(),
                ];
            }
        }

        return $results;
    }

    /**
     * Récupérer un fichier depuis IPFS par son hash
     *
     * @param string $hash Hash IPFS
     * @return string Contenu du fichier
     * @throws Exception
     */
    public function getFile(string $hash): string
    {
        try {
            Log::info('IPFS Get file', ['hash' => $hash]);

            $response = Http::timeout(30)
                ->get("{$this->baseUrl}/cat", [
                    'arg' => $hash,
                ]);

            if (!$response->successful()) {
                Log::error('IPFS Get file failed', [
                    'hash' => $hash,
                    'status' => $response->status(),
                ]);
                throw new Exception('Fichier introuvable sur IPFS');
            }

            return $response->body();

        } catch (Exception $e) {
            Log::error('IPFS Get file exception', [
                'hash' => $hash,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Récupérer l'URL du gateway IPFS pour un hash donné
     *
     * @param string $hash
     * @return string
     */
    public function getGatewayUrl(string $hash): string
    {
        return "{$this->gatewayUrl}/{$hash}";
    }

    /**
     * Vérifier si IPFS est accessible
     *
     * @return bool
     */
    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(5)->post("{$this->baseUrl}/version");
            return $response->successful();
        } catch (Exception $e) {
            Log::warning('IPFS not available', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Obtenir la version d'IPFS
     *
     * @return array|null
     */
    public function getVersion(): ?array
    {
        try {
            $response = Http::timeout(5)->post("{$this->baseUrl}/version");

            if ($response->successful()) {
                return $response->json();
            }

            return null;
        } catch (Exception $e) {
            Log::error('IPFS version check failed', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Pin un fichier IPFS (le garder disponible)
     *
     * @param string $hash
     * @return bool
     */
    public function pinFile(string $hash): bool
    {
        try {
            $response = Http::timeout(10)->post("{$this->baseUrl}/pin/add", [
                'arg' => $hash,
            ]);

            return $response->successful();
        } catch (Exception $e) {
            Log::error('IPFS pin failed', [
                'hash' => $hash,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Unpin un fichier IPFS
     *
     * @param string $hash
     * @return bool
     */
    public function unpinFile(string $hash): bool
    {
        try {
            $response = Http::timeout(10)->post("{$this->baseUrl}/pin/rm", [
                'arg' => $hash,
            ]);

            return $response->successful();
        } catch (Exception $e) {
            Log::error('IPFS unpin failed', [
                'hash' => $hash,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Vérifier si un hash IPFS est valide
     *
     * @param string $hash
     * @return bool
     */
    public function isValidHash(string $hash): bool
    {
        // Un hash IPFS CIDv0 commence par "Qm" et fait 46 caractères
        // Un hash CIDv1 peut avoir différents formats
        return preg_match('/^Qm[a-zA-Z0-9]{44}$/', $hash) ||
               preg_match('/^[a-z2-7]{59}$/', $hash) ||
               preg_match('/^bafy[a-z0-9]{55}$/', $hash);
    }
}
