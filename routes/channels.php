<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function (User $user, int $id): bool {
    return (int) $user->id === $id;
});

Broadcast::channel('org.{organizationId}.user.{userId}', function (User $user, int $organizationId, int $userId): bool {
    if ((int) $user->id !== $userId) {
        return false;
    }

    return $user->organizations()
        ->where('organizations.id', $organizationId)
        ->wherePivot('status', 'active')
        ->exists();
});

Broadcast::channel('org.{organizationId}.role.{role}', function (User $user, int $organizationId, string $role): bool {
    return $user->organizations()
        ->where('organizations.id', $organizationId)
        ->wherePivot('status', 'active')
        ->wherePivot('role', $role)
        ->exists();
});

Broadcast::channel('platform.super-admin', function (User $user): bool {
    return $user->isSuperAdmin();
});

