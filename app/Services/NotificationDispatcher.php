<?php

namespace App\Services;

use App\Events\LiveDomainUpdated;
use App\Models\Organization;
use App\Models\ParentStudent;
use App\Models\StudentGuardian;
use App\Models\User;
use App\Notifications\LmsNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;

class NotificationDispatcher
{
    /**
     * Send an organization-scoped notification to specific user(s), deduplicated by user ID.
     *
     * @param  iterable<User>|User  $recipients
     */
    public function toUsers(
        iterable|User $recipients,
        int $organizationId,
        string $category,
        string $title,
        string $message,
        string $url = '/notifications',
        string $icon = 'bell',
        string $severity = 'info',
        bool $isCritical = false,
        array $meta = [],
    ): void {
        $users = $this->normalizeUsers($recipients);
        if ($users->isEmpty()) {
            return;
        }

        $notification = new LmsNotification(
            category: $category,
            title: $title,
            message: $message,
            organizationId: $organizationId,
            scope: 'organization',
            url: $url,
            icon: $icon,
            severity: $severity,
            isCritical: $isCritical,
            meta: $meta,
        );

        Notification::send($users, $notification);
    }

    /**
     * Notify active members of an organization holding any of the specified roles.
     *
     * @param  array<int, string>  $roles
     */
    public function toOrganizationRoles(
        int $organizationId,
        array $roles,
        string $category,
        string $title,
        string $message,
        string $url = '/notifications',
        string $icon = 'bell',
        string $severity = 'info',
        bool $isCritical = false,
        array $meta = [],
        ?int $excludeUserId = null,
    ): void {
        $users = User::query()
            ->whereHas('organizations', function ($query) use ($organizationId, $roles) {
                $query->where('organizations.id', $organizationId)
                    ->where('organization_user.status', 'active')
                    ->whereIn('organization_user.role', $roles);
            })
            ->when($excludeUserId, fn ($q) => $q->where('users.id', '!=', $excludeUserId))
            ->get();

        $this->toUsers(
            recipients: $users,
            organizationId: $organizationId,
            category: $category,
            title: $title,
            message: $message,
            url: $url,
            icon: $icon,
            severity: $severity,
            isCritical: $isCritical,
            meta: $meta,
        );
    }

    /**
     * Notify a student AND their linked parents/guardians in the given organization.
     */
    public function toStudentAndParents(
        int $organizationId,
        int $studentId,
        string $category,
        string $title,
        string $message,
        ?string $parentMessage = null,
        string $url = '/notifications',
        string $icon = 'bell',
        string $severity = 'info',
        bool $isCritical = false,
        array $meta = [],
    ): void {
        $student = User::find($studentId);
        if ($student) {
            $this->toUsers(
                recipients: $student,
                organizationId: $organizationId,
                category: $category,
                title: $title,
                message: $message,
                url: $url,
                icon: $icon,
                severity: $severity,
                isCritical: $isCritical,
                meta: array_merge($meta, ['student_id' => $studentId, 'recipient_role' => 'student']),
            );
        }

        $parents = $this->linkedParentUsers($organizationId, $studentId);
        if ($parents->isNotEmpty()) {
            $this->toUsers(
                recipients: $parents,
                organizationId: $organizationId,
                category: $category,
                title: $title,
                message: $parentMessage ?? $message,
                url: $url,
                icon: $icon,
                severity: $severity,
                isCritical: $isCritical,
                meta: array_merge($meta, ['student_id' => $studentId, 'recipient_role' => 'parent']),
            );
        }
    }

    /**
     * Send a platform-level notification (strictly separate from organization notifications).
     *
     * @param  iterable<User>|User  $recipients
     */
    public function toPlatformUsers(
        iterable|User $recipients,
        string $category,
        string $title,
        string $message,
        string $url = '/notifications',
        string $icon = 'megaphone',
        string $severity = 'info',
        bool $isCritical = false,
        array $meta = [],
    ): void {
        $users = $this->normalizeUsers($recipients);
        if ($users->isEmpty()) {
            return;
        }

        $notification = new LmsNotification(
            category: $category,
            title: $title,
            message: $message,
            organizationId: null,
            scope: 'platform',
            url: $url,
            icon: $icon,
            severity: $severity,
            isCritical: $isCritical,
            meta: $meta,
        );

        Notification::send($users, $notification);
    }

    /**
     * Broadcast a lightweight live-refresh signal to organization roles.
     *
     * @param  array<int, string>  $roles
     */
    public function broadcastDomainUpdate(int $organizationId, string $domain, array $roles = ['owner', 'admin']): void
    {
        event(new LiveDomainUpdated($organizationId, $domain, $roles));
    }

    /**
     * Resolve all active parent/guardian User accounts linked to a student within an organization.
     */
    public function linkedParentUsers(int $organizationId, int $studentId): Collection
    {
        $parentIds = ParentStudent::withoutGlobalScopes()
            ->where('organization_id', $organizationId)
            ->where('student_id', $studentId)
            ->pluck('parent_id');

        $guardianUserIds = StudentGuardian::withoutGlobalScopes()
            ->where('organization_id', $organizationId)
            ->where('student_id', $studentId)
            ->whereNotNull('user_id')
            ->pluck('user_id');

        $allIds = $parentIds->merge($guardianUserIds)->unique()->filter()->values();
        if ($allIds->isEmpty()) {
            return collect();
        }

        return User::query()
            ->whereIn('id', $allIds)
            ->whereHas('organizations', function ($query) use ($organizationId) {
                $query->where('organizations.id', $organizationId)
                    ->where('organization_user.status', 'active');
            })
            ->get();
    }

    /**
     * @param  iterable<User>|User  $recipients
     */
    private function normalizeUsers(iterable|User $recipients): Collection
    {
        if ($recipients instanceof User) {
            return collect([$recipients]);
        }

        return collect($recipients)
            ->filter(fn ($u) => $u instanceof User)
            ->unique('id')
            ->values();
    }
}

