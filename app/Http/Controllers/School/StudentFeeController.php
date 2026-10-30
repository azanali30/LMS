<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\ClassFeeStructure;
use App\Models\FeeInvoice;
use App\Models\ParentStudent;
use App\Models\StudentEnrollment;
use App\Models\StudentFeeStructure;
use App\Models\User;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentFeeController extends Controller
{
    /**
     * Display student portal "My Fees & Payments" section.
     * Guaranteed tenant isolation and student authorization.
     */
    public function index(Request $request): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $user = $request->user();
        $role = TenantContext::currentRole($user);
        $isStaff = $user->hasRoleInOrganization($organization->id, ['owner', 'admin']) || $user->isSuperAdmin();
        $isParent = ($role === 'parent');

        // Resolve Target Student ID strictly according to role
        $studentId = null;
        $linkedChildren = collect();

        if ($role === 'student') {
            // Students can NEVER view another student's fees
            $studentId = $user->id;
        } elseif ($isParent) {
            // Parent: load linked children in this organization
            $linkedChildren = ParentStudent::where('organization_id', $organization->id)
                ->where('parent_id', $user->id)
                ->with(['student.studentProfile', 'student.studentEnrollments.classSection.schoolClass'])
                ->get();

            $childIds = $linkedChildren->pluck('student_id')->toArray();
            $requestedStudentId = $request->query('student_id');

            if ($requestedStudentId) {
                if (! in_array((int) $requestedStudentId, $childIds, true)) {
                    abort(403, 'Unauthorized access to student fee ledger.');
                }
                $studentId = (int) $requestedStudentId;
            } else {
                $studentId = $childIds[0] ?? null;
            }
        } elseif ($isStaff) {
            $studentId = $request->query('student_id') ? (int) $request->query('student_id') : null;
        } else {
            // Teachers or unauthorized roles
            abort(403, 'Unauthorized access to student fee ledger.');
        }

        if (! $studentId) {
            return Inertia::render('school/my-fees', [
                'student' => null,
                'activeEnrollment' => null,
                'feeStructure' => null,
                'invoices' => [],
                'payments' => [],
                'metrics' => [
                    'monthlyTuitionFee' => 0.00,
                    'transportFee' => 0.00,
                    'otherRecurringCharges' => 0.00,
                    'discountAmount' => 0.00,
                    'discountType' => 'none',
                    'discountReason' => null,
                    'netMonthlyFee' => 0.00,
                    'totalInvoiced' => 0.00,
                    'totalPaid' => 0.00,
                    'totalOutstanding' => 0.00,
                    'nextDueDate' => null,
                    'currentStatus' => 'paid',
                ],
                'currency' => $organization->currency ?? 'USD',
                'isParent' => $isParent,
                'linkedChildren' => $linkedChildren,
            ]);
        }

        // Load Student
        $student = User::where('id', $studentId)
            ->with(['studentProfile', 'studentGuardians'])
            ->firstOrFail();

        // Active enrollment
        $activeEnrollment = StudentEnrollment::where('organization_id', $organization->id)
            ->where('student_id', $studentId)
            ->with(['classSection.schoolClass', 'academicYear'])
            ->latest()
            ->first();

        // Student Fee Structure
        $feeStructure = StudentFeeStructure::where('organization_id', $organization->id)
            ->where('student_id', $studentId)
            ->first();

        // Fallback to Class default fee structure if student has no customized structure
        if (! $feeStructure && $activeEnrollment && $activeEnrollment->classSection) {
            $classStructure = ClassFeeStructure::where('organization_id', $organization->id)
                ->where('school_class_id', $activeEnrollment->classSection->school_class_id)
                ->where('academic_year_id', $activeEnrollment->academic_year_id)
                ->first();

            if ($classStructure) {
                $feeStructure = (object) [
                    'monthly_tuition_fee' => $classStructure->monthly_tuition_fee,
                    'transport_fee' => $classStructure->transport_fee ?? 0.00,
                    'other_recurring_charges' => $classStructure->other_recurring_charges,
                    'admission_fee' => $classStructure->admission_fee,
                    'annual_fee' => $classStructure->annual_fee,
                    'discount_type' => 'none',
                    'discount_value' => 0.00,
                    'discount_reason' => null,
                    'net_monthly_fee' => round($classStructure->monthly_tuition_fee + ($classStructure->transport_fee ?? 0.00) + $classStructure->other_recurring_charges, 2),
                    'payment_frequency' => 'monthly',
                    'due_day' => $classStructure->due_day,
                    'effective_date' => null,
                    'currency' => $classStructure->currency,
                ];
            }
        }

        // All Invoices for this student in this organization
        $invoices = FeeInvoice::where('organization_id', $organization->id)
            ->where('student_id', $studentId)
            ->with(['items', 'payments.receiver', 'schoolClass', 'classSection'])
            ->orderByDesc('billing_month')
            ->orderByDesc('id')
            ->get();

        // Recalculate each invoice financials to ensure 100% current state
        foreach ($invoices as $inv) {
            $inv->recalculateFinancials();
        }

        // Financial Metrics Computation
        $monthlyTuition = (float) ($feeStructure->monthly_tuition_fee ?? 0.00);
        $transportFee = (float) ($feeStructure->transport_fee ?? 0.00);
        $otherRecurring = (float) ($feeStructure->other_recurring_charges ?? 0.00);
        $discountAmount = 0.00;
        $discountType = $feeStructure->discount_type ?? 'none';
        $discountReason = $feeStructure->discount_reason ?? null;

        $baseMonthly = $monthlyTuition + $transportFee + $otherRecurring;
        if ($discountType === 'percentage' && ! empty($feeStructure->discount_value)) {
            $discountAmount = round(($baseMonthly * ((float) $feeStructure->discount_value / 100)), 2);
        } elseif ($discountType === 'fixed' && ! empty($feeStructure->discount_value)) {
            $discountAmount = min($baseMonthly, (float) $feeStructure->discount_value);
        }

        $netMonthly = max(0.00, round($baseMonthly - $discountAmount, 2));

        $totalInvoiced = (float) $invoices->sum('total_amount');
        $totalPaid = (float) $invoices->sum('paid_amount');
        $totalOutstanding = (float) $invoices->sum('balance_due');

        // Determine Next Due Date (nearest unpaid or partially paid invoice due date)
        $unpaidInvoices = $invoices->filter(fn ($inv) => $inv->balance_due > 0 && $inv->status !== 'paid');
        $nextDueDate = null;
        if ($unpaidInvoices->isNotEmpty()) {
            $nextDueDate = $unpaidInvoices->sortBy('due_date')->first()?->due_date?->format('Y-m-d');
        }

        // Determine Contextual Overall Status
        $today = Carbon::today();
        $overallStatus = 'paid';

        if ($totalOutstanding > 0.0001) {
            $hasOverdue = $unpaidInvoices->contains(function ($inv) use ($today) {
                return $inv->due_date && Carbon::parse($inv->due_date)->lt($today);
            });

            $hasDueToday = $unpaidInvoices->contains(function ($inv) use ($today) {
                return $inv->due_date && Carbon::parse($inv->due_date)->isToday();
            });

            $hasDueSoon = $unpaidInvoices->contains(function ($inv) use ($today) {
                return $inv->due_date
                    && Carbon::parse($inv->due_date)->gt($today)
                    && Carbon::parse($inv->due_date)->lte($today->copy()->addDays(3));
            });

            if ($hasOverdue) {
                $overallStatus = 'overdue';
            } elseif ($hasDueToday) {
                $overallStatus = 'due_today';
            } elseif ($hasDueSoon) {
                $overallStatus = 'due_soon';
            } elseif ($totalPaid > 0) {
                $overallStatus = 'partially_paid';
            } else {
                $overallStatus = 'unpaid';
            }
        } elseif ($invoices->isEmpty()) {
            $overallStatus = 'unpaid';
        }

        // All verified payment receipts for the student
        $allPayments = $invoices->flatMap(fn ($inv) => $inv->payments)->sortByDesc('payment_date')->values();

        return Inertia::render('school/my-fees', [
            'student' => $student,
            'activeEnrollment' => $activeEnrollment,
            'feeStructure' => $feeStructure,
            'invoices' => $invoices,
            'payments' => $allPayments,
            'metrics' => [
                'monthlyTuitionFee' => $monthlyTuition,
                'transportFee' => $transportFee,
                'otherRecurringCharges' => $otherRecurring,
                'discountAmount' => $discountAmount,
                'discountType' => $discountType,
                'discountReason' => $discountReason,
                'netMonthlyFee' => $netMonthly,
                'totalInvoiced' => $totalInvoiced,
                'totalPaid' => $totalPaid,
                'totalOutstanding' => $totalOutstanding,
                'nextDueDate' => $nextDueDate,
                'currentStatus' => $overallStatus,
            ],
            'currency' => $organization->currency ?? 'USD',
            'isParent' => $isParent,
            'linkedChildren' => $linkedChildren,
        ]);
    }
}
