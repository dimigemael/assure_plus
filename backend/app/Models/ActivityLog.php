<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    public const UPDATED_AT = null; // Pas de updated_at, seulement created_at

    protected $fillable = [
        'user_id',
        'action',
        'description',
        'method',
        'url',
        'ip_address',
        'user_agent',
        'properties',
        'subject_type',
        'subject_id',
    ];

    protected $casts = [
        'properties' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation polymorphique avec l'entité liée
     */
    public function subject()
    {
        return $this->morphTo();
    }

    /**
     * Scope pour filtrer par action
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope pour filtrer par utilisateur
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope pour filtrer par type d'entité
     */
    public function scopeBySubjectType($query, string $type)
    {
        return $query->where('subject_type', $type);
    }

    /**
     * Scope pour les logs récents (dernières 24h)
     */
    public function scopeRecent($query)
    {
        return $query->where('created_at', '>=', now()->subDay());
    }

    /**
     * Scope pour les logs d'aujourd'hui
     */
    public function scopeToday($query)
    {
        return $query->whereDate('created_at', today());
    }
}