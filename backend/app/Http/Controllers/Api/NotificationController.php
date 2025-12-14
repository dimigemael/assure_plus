<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Lister les notifications de l'utilisateur connecté
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $query = Notification::where('user_id', $user->id);

            // Filtrer par statut de lecture
            if ($request->has('is_read')) {
                $isRead = filter_var($request->input('is_read'), FILTER_VALIDATE_BOOLEAN);
                $query->where('is_read', $isRead);
            }

            // Filtrer par type
            if ($request->has('type')) {
                $query->where('type', $request->input('type'));
            }

            // Filtrer par période
            if ($request->has('from_date')) {
                $query->where('created_at', '>=', $request->input('from_date'));
            }

            // Trier par date (plus récent en premier)
            $query->orderBy('created_at', 'desc');

            // Pagination
            $perPage = $request->input('per_page', 20);
            $notifications = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $notifications,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des notifications',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir une notification spécifique
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $notification = Notification::where('user_id', $user->id)
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $notification,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Notification non trouvée',
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Marquer une notification comme lue
     *
     * @param int $id
     * @return JsonResponse
     */
    public function markAsRead(int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $notification = Notification::where('user_id', $user->id)
                ->findOrFail($id);

            $notification->markAsRead();

            return response()->json([
                'success' => true,
                'message' => 'Notification marquée comme lue',
                'data' => $notification->fresh(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Marquer une notification comme non lue
     *
     * @param int $id
     * @return JsonResponse
     */
    public function markAsUnread(int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $notification = Notification::where('user_id', $user->id)
                ->findOrFail($id);

            $notification->markAsUnread();

            return response()->json([
                'success' => true,
                'message' => 'Notification marquée comme non lue',
                'data' => $notification->fresh(),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Marquer toutes les notifications comme lues
     *
     * @return JsonResponse
     */
    public function markAllAsRead(): JsonResponse
    {
        try {
            $user = Auth::user();
            $count = $this->notificationService->markAllAsRead($user);

            return response()->json([
                'success' => true,
                'message' => "{$count} notification(s) marquée(s) comme lue(s)",
                'count' => $count,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer une notification
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $user = Auth::user();
            $notification = Notification::where('user_id', $user->id)
                ->findOrFail($id);

            $notification->delete();

            return response()->json([
                'success' => true,
                'message' => 'Notification supprimée',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Supprimer toutes les notifications lues
     *
     * @return JsonResponse
     */
    public function deleteRead(): JsonResponse
    {
        try {
            $user = Auth::user();
            $count = Notification::where('user_id', $user->id)
                ->where('is_read', true)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => "{$count} notification(s) supprimée(s)",
                'count' => $count,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir le nombre de notifications non lues
     *
     * @return JsonResponse
     */
    public function unreadCount(): JsonResponse
    {
        try {
            $user = Auth::user();
            $count = $this->notificationService->getUnreadCount($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'count' => $count,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du comptage',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtenir les notifications récentes (24h)
     *
     * @return JsonResponse
     */
    public function recent(): JsonResponse
    {
        try {
            $user = Auth::user();
            $notifications = Notification::where('user_id', $user->id)
                ->recent()
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $notifications,
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
