<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class NotificationPreference extends Model
{
    public const CATEGORIES = [
        'fees' => 'Fees',
        'attendance' => 'Attendance',
        'timetable' => 'Timetable',
        'academics' => 'Academics',
        'assignments' => 'Assignments',
        'announcements' => 'Announcements',
        'organization_activity' => 'Organization Activity',
        'system' => 'System',
    ];

    /**
     * Categories where critical notifications (e.g. overdue fees, security, account)
     * cannot be suppressed from in-app delivery.
     */
    public const MANDATORY_IN_APP_CATEGORIES = ['fees', 'system'];

    protected $fillable = [
        'user_id',
        'organization_id',
        'scope_key',
        'category',
        'in_app',
        'browser',
        'email',
    ];

    public static function scopeKeyFor(?int $organizationId): string
    {
        return $organizationId !== null ? "org:{$organizationId}" : 'platform';
    }

    protected function casts(): array
    {
        return [
            'in_app' => 'boolean',
            'browser' => 'boolean',
            'email' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    /**
     * Resolve effective channel preferences for a user, organization, and category.
     *
     * @return array{in_app: bool, browser: bool, email: bool}
     */
    public static function resolveFor(int $userId, ?int $organizationId, string $category, bool $isCritical = false): array
    {
        $scopeKey = self::scopeKeyFor($organizationId);

        $pref = static::query()
            ->where('user_id', $userId)
            ->where('scope_key', $scopeKey)
            ->where('category', $category)
            ->first();

        $inApp = $pref ? (bool) $pref->in_app : true;
        $browser = $pref ? (bool) $pref->browser : false;
        $email = $pref ? (bool) $pref->email : false;

        if ($isCritical && in_array($category, self::MANDATORY_IN_APP_CATEGORIES, true)) {
            $inApp = true;
        }

        return [
            'in_app' => $inApp,
            'browser' => $browser,
            'email' => $email,
        ];
    }

    /**
     * Concurrent-safe upsert enforcing one preference row per (user, scope_key, category).
     */
    public static function upsertPreference(
        int $userId,
        ?int $organizationId,
        string $category,
        bool $inApp,
        bool $browser,
        bool $email,
    ): self {
        $scopeKey = self::scopeKeyFor($organizationId);
        $attributes = [
            'user_id' => $userId,
            'scope_key' => $scopeKey,
            'category' => $category,
        ];
        $values = [
            'organization_id' => $organizationId,
            'in_app' => $inApp,
            'browser' => $browser,
            'email' => $email,
        ];

        try {
            return DB::transaction(fn () => static::updateOrCreate($attributes, $values));
        } catch (QueryException) {
            return DB::transaction(fn () => static::updateOrCreate($attributes, $values));
        }
    }

    /**
     * Return full preference matrix for all supported categories.
     */
    public static function matrixFor(int $userId, ?int $organizationId): array
    {
        $scopeKey = self::scopeKeyFor($organizationId);

        $existing = static::query()
            ->where('user_id', $userId)
            ->where('scope_key', $scopeKey)
            ->get()
            ->keyBy('category');

        $matrix = [];
        foreach (self::CATEGORIES as $key => $label) {
            $row = $existing->get($key);
            $matrix[] = [
                'category' => $key,
                'label' => $label,
                'in_app' => $row ? (bool) $row->in_app : true,
                'browser' => $row ? (bool) $row->browser : false,
                'email' => $row ? (bool) $row->email : false,
                'mandatory_critical' => in_array($key, self::MANDATORY_IN_APP_CATEGORIES, true),
            ];
        }

        return $matrix;
    }
}

