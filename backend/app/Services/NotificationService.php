<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Service pour gérer les notifications
 */
class NotificationService
{
    /**
     * Créer une notification pour un utilisateur
     *
     * @param int|User $user
     * @param string $type
     * @param string $title
     * @param string $message
     * @param array $data
     * @param string|null $actionUrl
     * @param string|null $actionText
     * @return Notification
     */
    public function create(
        int|User $user,
        string $type,
        string $title,
        string $message,
        array $data = [],
        ?string $actionUrl = null,
        ?string $actionText = null
    ): Notification {
        $userId = $user instanceof User ? $user->id : $user;

        return Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'action_url' => $actionUrl,
            'action_text' => $actionText,
        ]);
    }

    /**
     * Créer des notifications pour plusieurs utilisateurs
     *
     * @param array|Collection $users
     * @param string $type
     * @param string $title
     * @param string $message
     * @param array $data
     * @param string|null $actionUrl
     * @param string|null $actionText
     * @return Collection
     */
    public function createForMany(
        array|Collection $users,
        string $type,
        string $title,
        string $message,
        array $data = [],
        ?string $actionUrl = null,
        ?string $actionText = null
    ): Collection {
        $notifications = collect();

        foreach ($users as $user) {
            $notifications->push(
                $this->create($user, $type, $title, $message, $data, $actionUrl, $actionText)
            );
        }

        return $notifications;
    }

    /**
     * Notification : Contrat créé
     */
    public function notifyContractCreated(User $user, array $contractData): Notification
    {
        return $this->create(
            $user,
            'contract_created',
            'Contrat créé',
            "Votre contrat {$contractData['numero_police']} a été créé avec succès.",
            ['contract_id' => $contractData['id']],
            "/contracts/{$contractData['id']}",
            'Voir le contrat'
        );
    }

    /**
     * Notification : Contrat activé sur la blockchain
     */
    public function notifyContractActivated(User $user, array $contractData): Notification
    {
        return $this->create(
            $user,
            'contract_activated',
            'Contrat activé',
            "Votre contrat {$contractData['numero_police']} a été activé sur la blockchain.",
            [
                'contract_id' => $contractData['id'],
                'transaction_hash' => $contractData['transaction_hash'] ?? null,
            ],
            "/contracts/{$contractData['id']}",
            'Voir le contrat'
        );
    }

    /**
     * Notification : Contrat résilié
     */
    public function notifyContractCancelled(User $user, array $contractData, string $reason = ''): Notification
    {
        $message = "Votre contrat {$contractData['numero_police']} a été résilié.";
        if ($reason) {
            $message .= " Motif : {$reason}";
        }

        return $this->create(
            $user,
            'contract_cancelled',
            'Contrat résilié',
            $message,
            ['contract_id' => $contractData['id'], 'reason' => $reason],
            "/contracts/{$contractData['id']}",
            'Voir le contrat'
        );
    }

    /**
     * Notification : Prime à payer
     */
    public function notifyPremiumDue(User $user, array $contractData, float $amount): Notification
    {
        return $this->create(
            $user,
            'premium_due',
            'Prime à payer',
            "Une prime de {$amount} € est due pour votre contrat {$contractData['numero_police']}.",
            ['contract_id' => $contractData['id'], 'amount' => $amount],
            "/contracts/{$contractData['id']}/pay",
            'Payer maintenant'
        );
    }

    /**
     * Notification : Prime payée
     */
    public function notifyPremiumPaid(User $user, array $contractData, float $amount): Notification
    {
        return $this->create(
            $user,
            'premium_paid',
            'Prime payée',
            "Votre paiement de {$amount} € pour le contrat {$contractData['numero_police']} a été confirmé.",
            ['contract_id' => $contractData['id'], 'amount' => $amount],
            "/contracts/{$contractData['id']}",
            'Voir le contrat'
        );
    }

    /**
     * Notification : Prime en retard
     */
    public function notifyPremiumOverdue(User $user, array $contractData, int $daysOverdue): Notification
    {
        return $this->create(
            $user,
            'premium_overdue',
            'Prime en retard',
            "Votre paiement pour le contrat {$contractData['numero_police']} est en retard de {$daysOverdue} jour(s).",
            ['contract_id' => $contractData['id'], 'days_overdue' => $daysOverdue],
            "/contracts/{$contractData['id']}/pay",
            'Payer maintenant'
        );
    }

    /**
     * Notification : Sinistre déclaré
     */
    public function notifyClaimDeclared(User $user, array $claimData): Notification
    {
        $reference = $claimData['reference'] ?? $claimData['id'];
        return $this->create(
            $user,
            'claim_declared',
            'Sinistre déclaré',
            "Votre sinistre a été déclaré avec succès. Référence : {$reference}",
            ['claim_id' => $claimData['id']],
            "/claims/{$claimData['id']}",
            'Voir le sinistre'
        );
    }

    /**
     * Notification : Sinistre approuvé
     */
    public function notifyClaimApproved(User $user, array $claimData, float $amount): Notification
    {
        return $this->create(
            $user,
            'claim_approved',
            'Sinistre approuvé',
            "Votre sinistre a été approuvé pour un montant de {$amount} €.",
            ['claim_id' => $claimData['id'], 'amount' => $amount],
            "/claims/{$claimData['id']}",
            'Voir le sinistre'
        );
    }

    /**
     * Notification : Sinistre rejeté
     */
    public function notifyClaimRejected(User $user, array $claimData, string $reason = ''): Notification
    {
        $message = "Votre sinistre a été rejeté.";
        if ($reason) {
            $message .= " Motif : {$reason}";
        }

        return $this->create(
            $user,
            'claim_rejected',
            'Sinistre rejeté',
            $message,
            ['claim_id' => $claimData['id'], 'reason' => $reason],
            "/claims/{$claimData['id']}",
            'Voir le sinistre'
        );
    }

    /**
     * Notification : Indemnité payée
     */
    public function notifyClaimPaid(User $user, array $claimData, float $amount): Notification
    {
        return $this->create(
            $user,
            'claim_paid',
            'Indemnité payée',
            "L'indemnité de {$amount} € pour votre sinistre a été versée.",
            ['claim_id' => $claimData['id'], 'amount' => $amount],
            "/claims/{$claimData['id']}",
            'Voir le sinistre'
        );
    }

    /**
     * Notification : Souscription approuvée
     */
    public function notifySubscriptionApproved(User $user, array $subscriptionData): Notification
    {
        return $this->create(
            $user,
            'subscription_approved',
            'Souscription approuvée',
            "Votre demande de souscription a été approuvée.",
            ['subscription_id' => $subscriptionData['id']],
            "/subscriptions/{$subscriptionData['id']}",
            'Voir la souscription'
        );
    }

    /**
     * Notification : Souscription rejetée
     */
    public function notifySubscriptionRejected(User $user, array $subscriptionData, string $reason = ''): Notification
    {
        $message = "Votre demande de souscription a été rejetée.";
        if ($reason) {
            $message .= " Motif : {$reason}";
        }

        return $this->create(
            $user,
            'subscription_rejected',
            'Souscription rejetée',
            $message,
            ['subscription_id' => $subscriptionData['id'], 'reason' => $reason],
            "/subscriptions/{$subscriptionData['id']}",
            'Voir la souscription'
        );
    }

    /**
     * Notifier les admins
     */
    public function notifyAdmins(string $type, string $title, string $message, array $data = []): Collection
    {
        $admins = User::where('role', 'admin')->get();
        return $this->createForMany($admins, $type, $title, $message, $data);
    }

    /**
     * Notifier les experts
     */
    public function notifyExperts(string $type, string $title, string $message, array $data = []): Collection
    {
        $experts = User::where('role', 'expert')->get();
        return $this->createForMany($experts, $type, $title, $message, $data);
    }

    /**
     * Marquer toutes les notifications comme lues pour un utilisateur
     */
    public function markAllAsRead(int|User $user): int
    {
        $userId = $user instanceof User ? $user->id : $user;

        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Supprimer les anciennes notifications (plus de X jours)
     */
    public function deleteOldNotifications(int $days = 30): int
    {
        return Notification::where('created_at', '<', now()->subDays($days))
            ->where('is_read', true)
            ->delete();
    }

    /**
     * Obtenir le nombre de notifications non lues
     */
    public function getUnreadCount(int|User $user): int
    {
        $userId = $user instanceof User ? $user->id : $user;

        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }
}
