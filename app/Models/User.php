<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property string $role
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['name', 'email', 'password', 'role', 'status'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail, PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * Determine if the user is a platform-level Super Admin.
     */
    public function isSuperAdmin(): bool
    {
        return ($this->role ?? '') === 'super_admin';
    }

    /**
     * Determine if the user account is active.
     */
    public function isActive(): bool
    {
        return ($this->status ?? 'active') === 'active';
    }

    /**
     * Determine if the user has the default student role at platform level.
     */
    public function isStudent(): bool
    {
        return in_array($this->role ?? 'student', ['student', 'learner'], true);
    }

    /**
     * Determine if the user is a teacher at platform level.
     */
    public function isTeacher(): bool
    {
        return ($this->role ?? '') === 'teacher';
    }

    /**
     * Determine if the user is an admin at platform level.
     */
    public function isAdmin(): bool
    {
        return ($this->role ?? '') === 'admin';
    }

    /**
     * Organizations the user belongs to.
     */
    public function organizations(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Organization::class, 'organization_user')
            ->withPivot(['role', 'status', 'title'])
            ->withTimestamps();
    }

    /**
     * Organization membership records.
     */
    public function organizationMemberships(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(OrganizationUser::class);
    }

    /**
     * Get user role within a specific organization.
     */
    public function roleInOrganization(int $organizationId): ?string
    {
        if ($this->isSuperAdmin()) {
            return 'super_admin';
        }

        $membership = $this->organizationMemberships()
            ->where('organization_id', $organizationId)
            ->where('status', 'active')
            ->first();

        return $membership?->role;
    }

    /**
     * Check if user has specific role(s) in an organization.
     *
     * @param string|array<int, string> $roles
     */
    public function hasRoleInOrganization(int $organizationId, $roles): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $roles = is_array($roles) ? $roles : [$roles];
        $role = $this->roleInOrganization($organizationId);

        return $role !== null && in_array($role, $roles, true);
    }

    /**
     * Resolve the active or default organization for the user.
     */
    public function currentOrganization(): ?Organization
    {
        if ($sessionOrgId = session('current_organization_id')) {
            $org = $this->organizations()
                ->where('organizations.id', $sessionOrgId)
                ->where('organizations.status', 'active')
                ->wherePivot('status', 'active')
                ->first();
            if ($org) {
                return $org;
            }
            if ($this->isSuperAdmin()) {
                return Organization::where('id', $sessionOrgId)->where('status', 'active')->first();
            }
        }

        return $this->organizations()
            ->where('organizations.status', 'active')
            ->wherePivot('status', 'active')
            ->first();
    }

    protected ?bool $cachedCanCreateOrganization = null;

    /**
     * Determine if the user is authorized to create a new organization.
     * Allowed: Platform Super Admins and Organization Owners who have not reached their plan's organization limit.
     * Denied: Teachers, Students, Parents, and owners at their plan quota limit.
     */
    public function canCreateOrganization(): bool
    {
        if ($this->cachedCanCreateOrganization !== null) {
            return $this->cachedCanCreateOrganization;
        }

        if ($this->isSuperAdmin()) {
            return $this->cachedCanCreateOrganization = true;
        }

        $stats = \Illuminate\Support\Facades\DB::table('organization_user')
            ->join('organizations', 'organizations.id', '=', 'organization_user.organization_id')
            ->where('organization_user.user_id', $this->id)
            ->selectRaw("
                COUNT(*) as total_memberships,
                SUM(CASE WHEN organizations.status = 'active' AND organization_user.status = 'active' AND organization_user.role = 'owner' THEN 1 ELSE 0 END) as active_owner_count,
                SUM(CASE WHEN organization_user.role = 'owner' THEN 1 ELSE 0 END) as owned_count
            ")
            ->first();

        $totalMemberships = (int) ($stats->total_memberships ?? 0);
        $activeOwnerCount = (int) ($stats->active_owner_count ?? 0);
        $ownedCount = (int) ($stats->owned_count ?? 0);

        // If user belongs to organizations but none as an active owner (e.g. teacher/student/parent)
        if ($totalMemberships > 0 && $activeOwnerCount === 0) {
            return $this->cachedCanCreateOrganization = false;
        }

        $limit = $this->maxOrganizationEntitlement();

        // null = unlimited (Premium or initial creation)
        if ($limit === null) {
            return $this->cachedCanCreateOrganization = true;
        }

        return $this->cachedCanCreateOrganization = ($ownedCount < $limit);
    }

    /**
     * Get the maximum organization/institution limit allowed by the user's active/trial subscription.
     * Returns null if unlimited (Enterprise), or an integer count (Starter: 1, Growth: 5, Professional: 10).
     */
    public function maxOrganizationEntitlement(): ?int
    {
        if ($this->isSuperAdmin()) {
            return null; // Unlimited
        }

        $orgIds = $this->organizations()
            ->wherePivot('role', 'owner')
            ->pluck('organizations.id');

        $subscriptions = OrganizationSubscription::with('plan')
            ->where(function ($query) use ($orgIds) {
                $query->whereIn('organization_id', $orgIds)
                    ->orWhere('user_id', $this->id);
            })
            ->get();

        if ($subscriptions->isEmpty()) {
            return null; // Legacy / unmigrated accounts without billing records
        }

        $hasAnyAccess = false;
        $highestLimit = 0;
        foreach ($subscriptions as $sub) {
            if ($sub->hasAccess() && $sub->plan) {
                $hasAnyAccess = true;
                if ($sub->plan->isUnlimitedOrganizations()) {
                    return null; // Unlimited
                }
                $highestLimit = max($highestLimit, (int) $sub->plan->max_organizations);
            }
        }

        if (! $hasAnyAccess) {
            return 0; // Subscriptions expired / cancelled
        }

        return $highestLimit;
    }

    /**
     * Timetable entries where this user is assigned as teacher.
     */
    public function taughtTimetableEntries(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TimetableEntry::class, 'teacher_id');
    }

    /**
     * Subject teaching assignments for this user.
     */
    public function taughtSubjects(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ClassSubjectTeacher::class, 'teacher_id');
    }

    /**
     * Student personal and admission profile.
     */
    public function studentProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(StudentProfile::class, 'user_id');
    }

    /**
     * Guardians associated with this student.
     */
    public function studentGuardians(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(StudentGuardian::class, 'student_id');
    }

    /**
     * Assigned fee structure for this student.
     */
    public function studentFeeStructure(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(StudentFeeStructure::class, 'student_id');
    }

    /**
     * Admission documents uploaded for this student.
     */
    public function studentDocuments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(StudentDocument::class, 'student_id');
    }

    /**
     * Class section enrollments for this student.
     */
    public function studentEnrollments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(StudentEnrollment::class, 'student_id');
    }

    /**
     * Student tuition and fee invoices.
     */
    public function feeInvoices(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(FeeInvoice::class, 'student_id');
    }

    /**
     * Fee payments recorded for this student.
     */
    public function feePayments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(FeePayment::class, 'student_id');
    }
}