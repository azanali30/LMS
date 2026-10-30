<?php

namespace App\Services;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class TenantContext
{
    private static ?Organization $currentOrganization = null;

    private static bool $isBypassed = false;

    /**
     * Get the currently active organization.
     */
    public static function current(): ?Organization
    {
        return self::$currentOrganization;
    }

    /**
     * Get the active organization's ID.
     */
    public static function id(): ?int
    {
        return self::$currentOrganization?->id;
    }

    /**
     * Check if a valid tenant context is currently set.
     */
    public static function check(): bool
    {
        return self::$currentOrganization !== null;
    }

    /**
     * Set the active organization.
     */
    public static function set(?Organization $organization): void
    {
        self::$currentOrganization = $organization;
    }

    /**
     * Check if the tenant scope is currently bypassed.
     */
    public static function isBypassed(): bool
    {
        return self::$isBypassed;
    }

    /**
     * Execute a callback with tenant scoping temporarily disabled.
     *
     * @template T
     * @param callable(): T $callback
     * @return T
     */
    public static function bypass(callable $callback)
    {
        $previous = self::$isBypassed;
        self::$isBypassed = true;

        try {
            return $callback();
        } finally {
            self::$isBypassed = $previous;
        }
    }

    /**
     * Determine if the authenticated user is a platform-level Super Admin.
     */
    public static function isSuperAdmin(?User $user = null): bool
    {
        $user = $user ?? Auth::user();

        return $user !== null && ($user->role === 'super_admin');
    }

    /**
     * Get the current user's role within the active organization.
     */
    public static function currentRole(?User $user = null): ?string
    {
        $user = $user ?? Auth::user();
        if (! $user || ! self::$currentOrganization) {
            return null;
        }

        if (self::isSuperAdmin($user)) {
            return 'super_admin';
        }

        $membership = $user->organizationMemberships()
            ->where('organization_id', self::$currentOrganization->id)
            ->where('status', 'active')
            ->first();

        return $membership?->role;
    }

    /**
     * Check if the current user has one of the specified organization roles.
     *
     * @param string|array<int, string> $roles
     */
    public static function hasRole($roles, ?User $user = null): bool
    {
        $user = $user ?? Auth::user();
        if (! $user) {
            return false;
        }

        if (self::isSuperAdmin($user)) {
            return true;
        }

        $roles = is_array($roles) ? $roles : [$roles];
        $currentRole = self::currentRole($user);

        return $currentRole !== null && in_array($currentRole, $roles, true);
    }
}
