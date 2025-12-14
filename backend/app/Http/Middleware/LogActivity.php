<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class LogActivity
{
    /**
     * Actions à logger (patterns de routes)
     */
    protected array $logActions = [
        'POST' => [
            'contracts' => 'Création de contrat',
            'contracts/*/activate' => 'Activation de contrat',
            'contracts/*/cancel' => 'Résiliation de contrat',
            'claims' => 'Déclaration de sinistre',
            'premiums' => 'Paiement de prime',
            'subscriptions' => 'Souscription',
            'subscriptions/*/approve' => 'Approbation de souscription',
            'subscriptions/*/reject' => 'Rejet de souscription',
            'ipfs/upload' => 'Upload fichier IPFS',
        ],
        'PUT' => [
            'contracts/*' => 'Modification de contrat',
            'products/*' => 'Modification de produit',
            'premiums/*' => 'Mise à jour de prime',
        ],
        'PATCH' => [
            'claims/*' => 'Traitement de sinistre',
        ],
        'DELETE' => [
            'contracts/*' => 'Suppression de contrat',
            'claims/*' => 'Suppression de sinistre',
            'products/*' => 'Suppression de produit',
        ],
    ];

    /**
     * Routes à exclure du logging
     */
    protected array $excludedRoutes = [
        'login',
        'logout',
        'refresh',
        'user',
        'notifications/*',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Logger uniquement après la requête si succès (2xx)
        if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
            $this->logActivity($request, $response);
        }

        return $response;
    }

    /**
     * Logger l'activité
     */
    protected function logActivity(Request $request, Response $response): void
    {
        // Ignorer les routes exclues
        if ($this->shouldExclude($request)) {
            return;
        }

        $method = $request->method();
        $path = $request->path();

        // Vérifier si cette action doit être loggée
        $action = $this->getActionDescription($method, $path);
        if (!$action) {
            return;
        }

        // Extraire les données pertinentes
        $logData = [
            'user_id' => Auth::id(),
            'action' => $action,
            'description' => $this->buildDescription($request, $response),
            'method' => $method,
            'url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'properties' => $this->extractProperties($request, $response),
        ];

        // Ajouter l'entité liée si possible
        $subject = $this->extractSubject($request, $response);
        if ($subject) {
            $logData['subject_type'] = $subject['type'];
            $logData['subject_id'] = $subject['id'];
        }

        // Créer le log de manière asynchrone (non bloquant)
        try {
            ActivityLog::create($logData);
        } catch (\Exception $e) {
            // Ne pas faire échouer la requête si le log échoue
            \Log::error('Erreur lors du logging d\'activité: ' . $e->getMessage());
        }
    }

    /**
     * Vérifier si la route doit être exclue
     */
    protected function shouldExclude(Request $request): bool
    {
        $path = $request->path();

        foreach ($this->excludedRoutes as $excludedRoute) {
            if ($this->matchesPattern($path, $excludedRoute)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Obtenir la description de l'action
     */
    protected function getActionDescription(string $method, string $path): ?string
    {
        if (!isset($this->logActions[$method])) {
            return null;
        }

        foreach ($this->logActions[$method] as $pattern => $description) {
            if ($this->matchesPattern($path, $pattern)) {
                return $description;
            }
        }

        return null;
    }

    /**
     * Vérifier si le chemin correspond au pattern
     */
    protected function matchesPattern(string $path, string $pattern): bool
    {
        // Nettoyer le chemin (enlever "api/" au début)
        $path = preg_replace('#^api/#', '', $path);

        // Remplacer * par un pattern regex
        $pattern = str_replace('*', '[^/]+', $pattern);
        $pattern = '#^' . $pattern . '$#';

        return preg_match($pattern, $path) === 1;
    }

    /**
     * Construire la description détaillée
     */
    protected function buildDescription(Request $request, Response $response): string
    {
        $user = Auth::user();
        $userName = $user ? $user->name : 'Anonyme';

        $action = $this->getActionDescription($request->method(), $request->path());

        return "{$userName} - {$action}";
    }

    /**
     * Extraire les propriétés pertinentes
     */
    protected function extractProperties(Request $request, Response $response): array
    {
        $properties = [];

        // Données de la requête (sauf les sensibles)
        $requestData = $request->except(['password', 'password_confirmation', 'token']);

        if (!empty($requestData)) {
            $properties['request'] = $requestData;
        }

        // Données de la réponse si JSON
        if ($response->headers->get('Content-Type') === 'application/json') {
            $content = $response->getContent();
            $responseData = json_decode($content, true);

            if (isset($responseData['data'])) {
                $properties['response'] = $responseData['data'];
            }
        }

        return $properties;
    }

    /**
     * Extraire l'entité liée (subject)
     */
    protected function extractSubject(Request $request, Response $response): ?array
    {
        $path = $request->path();

        // Patterns pour identifier les entités
        $patterns = [
            '#api/contracts/(\d+)#' => ['type' => 'App\Models\Contract', 'id' => 1],
            '#api/claims/(\d+)#' => ['type' => 'App\Models\Claim', 'id' => 1],
            '#api/premiums/(\d+)#' => ['type' => 'App\Models\Premium', 'id' => 1],
            '#api/products/(\d+)#' => ['type' => 'App\Models\InsuranceProduct', 'id' => 1],
            '#api/subscriptions/(\d+)#' => ['type' => 'App\Models\Subscription', 'id' => 1],
        ];

        foreach ($patterns as $pattern => $config) {
            if (preg_match($pattern, $path, $matches)) {
                return [
                    'type' => $config['type'],
                    'id' => $matches[$config['id']],
                ];
            }
        }

        // Si c'est une création (POST), essayer d'extraire l'ID de la réponse
        if ($request->method() === 'POST') {
            $content = $response->getContent();
            $responseData = json_decode($content, true);

            if (isset($responseData['data']['id'])) {
                $id = $responseData['data']['id'];

                // Déterminer le type selon la route
                if (str_contains($path, 'contracts')) {
                    return ['type' => 'App\Models\Contract', 'id' => $id];
                } elseif (str_contains($path, 'claims')) {
                    return ['type' => 'App\Models\Claim', 'id' => $id];
                } elseif (str_contains($path, 'premiums')) {
                    return ['type' => 'App\Models\Premium', 'id' => $id];
                } elseif (str_contains($path, 'products')) {
                    return ['type' => 'App\Models\InsuranceProduct', 'id' => $id];
                } elseif (str_contains($path, 'subscriptions')) {
                    return ['type' => 'App\Models\Subscription', 'id' => $id];
                }
            }
        }

        return null;
    }
}
