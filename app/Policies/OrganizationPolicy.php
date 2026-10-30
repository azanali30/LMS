<?php

namespace App\Policies;

use App\Models\Organization;
use App\Models\User;

class OrganizationPolicy
{
    /**
     * Perform pre-authorization checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    /**
     * Determine whether the user can view the organization.
     */
    public function view(User $user, Organization $organization): bool
    {
        return $user->hasRoleInOrganization($organization->id, ['owner', 'admin', 'teacher', 'student', 'parent']);
    }

    /**
     * Determine whether the user can update the organization settings.
     */
    public function update(User $user, Organization $organization): bool
    {
        return $user->hasRoleInOrganization($organization->id, ['owner', 'admin']);
    }

    /**
     * Determine whether the user can delete the organization.
     */
    public function delete(User $user, Organization $organization): bool
    {
        return $user->hasRoleInOrganization($organization->id, ['owner']);
    }

    /**
     * Determine whether the user can manage organization members and invitations.
     */
    public function manageMembers(User $user, Organization $organization): bool
    {
        return $user->hasRoleInOrganization($organization->id, ['owner', 'admin']);
    }

    /**
     * Determine whether the user can manage academic sessions, classes, and subjects.
     */
    public function manageAcademics(User $user, Organization $organization): bool
    {
        return $user->hasRoleInOrganization($organization->id, ['owner', 'admin']);
    }

    /**
     * Determine whether the user can manage courses and lessons.
     */
    public function manageCourses(User $user, Organization $organization): bool
    {
        return $user->hasRoleInOrganization($organization->id, ['owner', 'admin', 'teacher']);
    }

    /**
     * Determine whether the user can take attendance or grade assessments.
     */
    public function gradeAndAttendance(User $user, Organization $organization): bool
    {
        return $user->hasRoleInOrganization($organization->id, ['owner', 'admin', 'teacher']);
    }

    /**
     * Determine whether the user can update curriculum lesson progress.
     */
    public function updateCurriculumProgress(User $user, Organization $organization): bool
    {
        return $user->hasRoleInOrganization($organization->id, ['owner', 'admin', 'teacher']);
    }

    /**
     * Determine whether the user can manage student fee structures, invoices, and payment records.
     * Strictly restricted to Owner and Institutional Admin; Teachers are denied access.
     */
    public function manageFees(User $user, Organization $organization): bool
    {
        return $user->hasRoleInOrganization($organization->id, ['owner', 'admin']);
    }
}

