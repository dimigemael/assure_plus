<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\IPFSService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class IPFSController extends Controller
{
    protected IPFSService $ipfsService;

    public function __construct(IPFSService $ipfsService)
    {
        $this->ipfsService = $ipfsService;
    }

    /**
     * Upload un ou plusieurs fichiers vers IPFS
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function upload(Request $request): JsonResponse
    {
        // Validation
        $validator = Validator::make($request->all(), [
            'files' => 'required',
            'files.*' => 'file|max:' . config('ipfs.max_file_size', 10240),
        ], [
            'files.required' => 'Aucun fichier fourni',
            'files.*.file' => 'Le fichier doit être valide',
            'files.*.max' => 'Le fichier ne doit pas dépasser ' . (config('ipfs.max_file_size', 10240) / 1024) . 'MB',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation échouée',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Vérifier si IPFS est disponible
            if (!$this->ipfsService->isAvailable()) {
                return response()->json([
                    'success' => false,
                    'message' => 'IPFS n\'est pas disponible. Vérifiez que le nœud IPFS est démarré.',
                ], 503);
            }

            $files = $request->file('files');
            $results = [];

            // Si c'est un seul fichier
            if (!is_array($files)) {
                $files = [$files];
            }

            // Vérifier les types MIME
            $allowedMimes = config('ipfs.allowed_mime_types', []);
            foreach ($files as $file) {
                if (!empty($allowedMimes) && !in_array($file->getMimeType(), $allowedMimes)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Type de fichier non autorisé: ' . $file->getMimeType(),
                        'allowed_types' => $allowedMimes,
                    ], 422);
                }
            }

            // Upload vers IPFS
            foreach ($files as $file) {
                $result = $this->ipfsService->uploadFile($file);
                $results[] = $result;
            }

            return response()->json([
                'success' => true,
                'message' => count($results) > 1
                    ? count($results) . ' fichiers uploadés avec succès'
                    : 'Fichier uploadé avec succès',
                'data' => count($results) === 1 ? $results[0] : $results,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload vers IPFS',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Récupérer un fichier depuis IPFS
     *
     * @param string $hash
     * @return JsonResponse|\Illuminate\Http\Response
     */
    public function get(string $hash)
    {
        // Valider le hash
        if (!$this->ipfsService->isValidHash($hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Hash IPFS invalide',
            ], 400);
        }

        try {
            // Vérifier si IPFS est disponible
            if (!$this->ipfsService->isAvailable()) {
                return response()->json([
                    'success' => false,
                    'message' => 'IPFS n\'est pas disponible',
                ], 503);
            }

            $content = $this->ipfsService->getFile($hash);

            // Retourner le contenu du fichier
            return response($content)
                ->header('Content-Type', 'application/octet-stream')
                ->header('Content-Disposition', 'inline; filename="' . $hash . '"');

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du fichier',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Obtenir l'URL du gateway IPFS pour un hash
     *
     * @param string $hash
     * @return JsonResponse
     */
    public function getUrl(string $hash): JsonResponse
    {
        if (!$this->ipfsService->isValidHash($hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Hash IPFS invalide',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'hash' => $hash,
                'gateway_url' => $this->ipfsService->getGatewayUrl($hash),
            ],
        ]);
    }

    /**
     * Pin un fichier IPFS
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function pin(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'hash' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $hash = $request->input('hash');

        if (!$this->ipfsService->isValidHash($hash)) {
            return response()->json([
                'success' => false,
                'message' => 'Hash IPFS invalide',
            ], 400);
        }

        try {
            $success = $this->ipfsService->pinFile($hash);

            if ($success) {
                return response()->json([
                    'success' => true,
                    'message' => 'Fichier pinné avec succès',
                    'data' => ['hash' => $hash],
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Échec du pinning',
            ], 500);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du pinning',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Vérifier le statut d'IPFS
     *
     * @return JsonResponse
     */
    public function status(): JsonResponse
    {
        $isAvailable = $this->ipfsService->isAvailable();
        $version = $isAvailable ? $this->ipfsService->getVersion() : null;

        return response()->json([
            'success' => true,
            'data' => [
                'available' => $isAvailable,
                'version' => $version,
                'gateway_url' => config('ipfs.gateway_url'),
            ],
        ]);
    }
}
