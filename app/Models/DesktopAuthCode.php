<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DesktopAuthCode extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'user_id',
        'code_challenge',
        'state',
        'client_ip',
        'expires_at',
        'used_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return Carbon::now()->isAfter($this->expires_at);
    }

    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }

    public function isValid(): bool
    {
        return ! $this->isUsed() && ! $this->isExpired();
    }

    /**
     * Verify PKCE code_verifier against stored code_challenge using RFC 7636 (S256).
     */
    public function verifyChallenge(string $codeVerifier): bool
    {
        $computedChallenge = rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
        return hash_equals($this->code_challenge, $computedChallenge);
    }

    /**
     * Atomically consume the authorization code.
     */
    public function consume(): bool
    {
        if (! $this->isValid()) {
            return false;
        }

        $this->update(['used_at' => now()]);
        return true;
    }

    /**
     * Create a new secure authorization code bound to user and PKCE challenge.
     */
    public static function issue(
        User $user,
        string $codeChallenge,
        string $state,
        ?string $clientIp = null,
        int $ttlMinutes = 5
    ): self {
        return self::create([
            'code' => Str::random(64),
            'user_id' => $user->id,
            'code_challenge' => $codeChallenge,
            'state' => $state,
            'client_ip' => $clientIp,
            'expires_at' => Carbon::now()->addMinutes($ttlMinutes),
        ]);
    }
}
