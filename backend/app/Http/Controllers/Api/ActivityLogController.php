<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends Controller
{
    /**
     * Lister les logs d'activité
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = ActivityLog::with('user');

            // Filtrer par utilisateur (admin peut voir tous les logs)
            $user = Auth::user();
            if ($user->role !== 'admin') {
                $query->where('user_id', $user->id);
            } elseif ($request->has('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }

            // Filtrer par action
            if ($request->has('action')) {
                $query->where('action', $request->input('action'));
            }

            // Filtrer par type d'entité
            if ($request->has('subject_type')) {
                $query->where('subject_type', $request->input('subject_type'));
            }

            // Filtrer par période
            if ($request->has('from_date')) {
                $query->where('created_at', '>=', $request->input('from_date'));
            }

            if ($request->has('to_date')) {
                $query->where('created_at', '<=', $request->input('to_date'));
            }

            // Trier par date (plus récent en premier)
            $query->orderBy('created_at', 'desc');

            // Pagination
            $perPage = $request->input('per_page', 20);
            $logs = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $logs,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des logs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir un log spécifique
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $log = ActivityLog::with(['user', 'subject'])->findOrFail($id);

            // Vérifier les permissions
            $user = Auth::user();
            if ($user->role !== 'admin' && $log->user_id !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Accès non autorisé',
                ], 403);
            }

            return response()->json([
                'success' => true,
                'data' => $log,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Log non trouvé',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Obtenir les logs par entité
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function bySubject(Request $request): JsonResponse
    {
        $request->validate([
            'subject_type' => 'required|string',
            'subject_id' => 'required|integer',
        ]);

        try {
            $logs = ActivityLog::with('user')
                ->where('subject_type', $request->input('subject_type'))
                ->where('subject_id', $request->input('subject_id'))
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $logs,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des logs',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques d'activité
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $query = ActivityLog::query();

            // Filtrer par utilisateur si pas admin
            if ($user->role !== 'admin') {
                $query->where('user_id', $user->id);
            } elseif ($request->has('user_id')) {
                $query->where('user_id', $request->input('user_id'));
            }

            // Filtrer par période
            if ($request->has('from_date')) {
                $query->where('created_at', '>=', $request->input('from_date'));
            }

            if ($request->has('to_date')) {
                $query->where('created_at', '<=', $request->input('to_date'));
            }

            // Statistiques globales
            $stats = [
                'total_activities' => $query->clone()->count(),
                'today_activities' => $query->clone()->whereDate('created_at', today())->count(),
                'this_week_activities' => $query->clone()->where('created_at', '>=', now()->startOfWeek())->count(),
            ];

            // Répartition par action
            $byAction = $query->clone()
                ->selectRaw('action, COUNT(*) as count')
                ->groupBy('action')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get();

            // Répartition par jour (7 derniers jours)
            $byDay = ActivityLog::selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->where('created_at', '>=', now()->subDays(7))
                ->groupBy('date')
                ->orderBy('date', 'asc')
                ->get();

            // Utilisateurs les plus actifs (admin seulement)
            $topUsers = null;
            if ($user->role === 'admin') {
                $topUsers = ActivityLog::selectRaw('user_id, COUNT(*) as count')
                    ->with('user')
                    ->groupBy('user_id')
                    ->orderBy('count', 'desc')
                    ->limit(10)
                    ->get();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => $stats,
                    'by_action' => $byAction,
                    'by_day' => $byDay,
                    'top_users' => $topUsers,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les activités récentes (24h)
     *
     * @return JsonResponse
     */
    public function recent(): JsonResponse
    {
        try {
            $user = Auth::user();
            $query = ActivityLog::with('user')->recent();

            // Filtrer par utilisateur si pas admin
            if ($user->role !== 'admin') {
                $query->where('user_id', $user->id);
            }

            $logs = $query->orderBy('created_at', 'desc')->limit(50)->get();

            return response()->json([
                'success' => true,
                'data' => $logs,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer les anciens logs (admin seulement)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function cleanup(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();

            if ($user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Action réservée aux administrateurs',
                ], 403);
            }

            $days = $request->input('days', 90); // 90 jours par défaut

            $count = ActivityLog::where('created_at', '<', now()->subDays($days))
                ->delete();

            return response()->json([
                'success' => true,
                'message' => "{$count} log(s) supprimé(s)",
                'count' => $count,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du nettoyage',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
