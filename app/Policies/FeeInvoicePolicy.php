<?php

namespace App\Policies;

use App\Models\FeeInvoice;
use App\Models\ParentStudent;
use App\Models\User;

class FeeInvoicePolicy
{
    /**
     * Perform pre-authorization checks for super admin.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        return null;
    }

    /**
     * Determine whether the user can view the invoice.
     * Owners & Admins can view any in their organization.
     * Students can view ONLY their own invoices.
     * Parents can view invoices for their linked children.
     * Teachers are explicitly DENIED access unless authorized.
     */
    public function view(User $user, FeeInvoice $invoice): bool
    {
        $orgId = $invoice->organization_id;

        // Owner or Admin of the organization
        if ($user->hasRoleInOrganization($orgId, ['owner', 'admin'])) {
            return true;
        }

        // Student viewing their own invoice
        if ($user->id === $invoice->student_id && $user->hasRoleInOrganization($orgId, ['student'])) {
            return true;
        }

        // Parent viewing their linked child's invoice
        if ($user->hasRoleInOrganization($orgId, ['parent'])) {
            return ParentStudent::where('organization_id', $orgId)
                ->where('parent_id', $user->id)
                ->where('student_id', $invoice->student_id)
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can manage (create, edit, cancel) invoices.
     */
    public function manage(User $user, FeeInvoice $invoice): bool
    {
        return $user->hasRoleInOrganization($invoice->organization_id, ['owner', 'admin']);
    }

    /**
     * Determine whether the user can record payments against the invoice.
     */
    public function recordPayment(User $user, FeeInvoice $invoice): bool
    {
        return $user->hasRoleInOrganization($invoice->organization_id, ['owner', 'admin']);
    }
}
