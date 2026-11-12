<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ClassFeeStructure;
use App\Models\ClassSection;
use App\Models\FeeInvoice;
use App\Models\FeeInvoiceItem;
use App\Models\FeePayment;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\StudentFeeStructure;
use App\Services\FeeReminderService;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FeeController extends Controller
{
    /**
     * Display the Organization Fee Management Dashboard (Owners and Institutional Admins).
     */
    public function index(Request $request): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageFees', $organization);

        $academicYears = AcademicYear::where('organization_id', $organization->id)
            ->orderByDesc('is_current')
            ->orderByDesc('start_date')
            ->get();

        $currentAcademicYear = $academicYears->firstWhere('is_current', true) ?? $academicYears->first();

        $classes = SchoolClass::where('organization_id', $organization->id)
            ->with(['sections' => fn ($q) => $q->where('organization_id', $organization->id)->orderBy('name')])
            ->orderBy('name')
            ->get();

        $sections = ClassSection::where('organization_id', $organization->id)
            ->with('schoolClass')
            ->orderBy('name')
            ->get();

        // 1. Invoices Query with Filters
        $query = FeeInvoice::where('organization_id', $organization->id)
            ->with([
                'student.studentProfile',
                'schoolClass',
                'classSection',
                'academicYear',
                'items',
                'payments.receiver',
            ]);

        if ($classId = $request->query('class_id')) {
            $query->where('school_class_id', $classId);
        }

        if ($sectionId = $request->query('section_id')) {
            $query->where('class_section_id', $sectionId);
        }

        if ($yearId = $request->query('academic_year_id')) {
            $query->where('academic_year_id', $yearId);
        } elseif ($currentAcademicYear) {
            $query->where('academic_year_id', $currentAcademicYear->id);
        }

        if ($month = $request->query('billing_month')) {
            // Match Y-m or exact date
            $monthStart = Carbon::parse($month)->startOfMonth()->toDateString();
            $query->whereDate('billing_month', $monthStart);
        }

        if ($status = $request->query('status')) {
            if ($status === 'overdue') {
                $query->where('status', '!=', 'paid')
                    ->where('balance_due', '>', 0)
                    ->whereDate('due_date', '<', now()->toDateString());
            } elseif ($status === 'due_today') {
                $query->where('status', '!=', 'paid')
                    ->where('balance_due', '>', 0)
                    ->whereDate('due_date', '=', now()->toDateString());
            } elseif ($status === 'due_soon') {
                $query->where('status', '!=', 'paid')
                    ->where('balance_due', '>', 0)
                    ->whereDate('due_date', '>', now()->toDateString())
                    ->whereDate('due_date', '<=', now()->addDays(3)->toDateString());
            } else {
                $query->where('status', $status);
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                    ->orWhereHas('student', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('student.studentProfile', function ($pq) use ($search) {
                        $pq->where('admission_number', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('studentEnrollment', function ($eq) use ($search) {
                        $eq->where('roll_number', 'like', "%{$search}%");
                    });
            });
        }

        $invoices = $query->latest('issue_date')->latest('id')->paginate(15)->withQueryString();

        // 2. High-Level Financial Metrics (Scoped to active organization and academic session)
        $metricsBase = FeeInvoice::where('organization_id', $organization->id);
        if ($filterYear = $request->query('academic_year_id', $currentAcademicYear?->id)) {
            $metricsBase->where('academic_year_id', $filterYear);
        }
        if ($filterMonth = $request->query('billing_month')) {
            $metricsBase->whereDate('billing_month', Carbon::parse($filterMonth)->startOfMonth()->toDateString());
        }

        $today = now()->toDateString();
        $metricsAgg = (clone $metricsBase)
            ->selectRaw("
                COALESCE(SUM(total_amount), 0) as total_invoiced,
                COALESCE(SUM(paid_amount), 0) as total_collected,
                COALESCE(SUM(balance_due), 0) as total_outstanding,
                COALESCE(SUM(CASE WHEN status != 'paid' AND balance_due > 0 AND DATE(due_date) < ? THEN balance_due ELSE 0 END), 0) as overdue_balance
            ", [$today])
            ->first();

        $totalInvoiced = (float) ($metricsAgg->total_invoiced ?? 0);
        $totalCollected = (float) ($metricsAgg->total_collected ?? 0);
        $totalOutstanding = (float) ($metricsAgg->total_outstanding ?? 0);
        $overdueBalance = (float) ($metricsAgg->overdue_balance ?? 0);

        $collectionRate = $totalInvoiced > 0
            ? round(($totalCollected / $totalInvoiced) * 100, 1)
            : 0.0;

        $paidCount = (clone $metricsBase)->where('status', 'paid')->count();
        $partiallyPaidCount = (clone $metricsBase)->where('status', 'partially_paid')->count();
        $unpaidCount = (clone $metricsBase)->where('status', 'unpaid')->count();
        $overdueCount = (clone $metricsBase)
            ->where('status', '!=', 'paid')
            ->where('balance_due', '>', 0)
            ->whereDate('due_date', '<', now()->toDateString())
            ->count();
        $dueTodayCount = (clone $metricsBase)
            ->where('status', '!=', 'paid')
            ->where('balance_due', '>', 0)
            ->whereDate('due_date', '=', now()->toDateString())
            ->count();
        $dueSoonCount = (clone $metricsBase)
            ->where('status', '!=', 'paid')
            ->where('balance_due', '>', 0)
            ->whereDate('due_date', '>', now()->toDateString())
            ->whereDate('due_date', '<=', now()->addDays(3)->toDateString())
            ->count();

        // 3. Class Fee Structures list for configuring default fee plans
        $classFeeStructures = ClassFeeStructure::where('organization_id', $organization->id)
            ->with(['schoolClass', 'academicYear'])
            ->get();

        return Inertia::render('school/fees', [
            'invoices' => $invoices,
            'metrics' => [
                'totalInvoiced' => $totalInvoiced,
                'totalCollected' => $totalCollected,
                'totalOutstanding' => $totalOutstanding,
                'overdueBalance' => $overdueBalance,
                'collectionRate' => $collectionRate,
                'counts' => [
                    'paid' => $paidCount,
                    'partiallyPaid' => $partiallyPaidCount,
                    'unpaid' => $unpaidCount,
                    'overdue' => $overdueCount,
                    'dueToday' => $dueTodayCount,
                    'dueSoon' => $dueSoonCount,
                    'total' => $invoices->total(),
                ],
            ],
            'classes' => $classes,
            'sections' => $sections,
            'academicYears' => $academicYears,
            'currentAcademicYear' => $currentAcademicYear,
            'classFeeStructures' => $classFeeStructures,
            'currency' => $organization->currency ?? 'USD',
            'filters' => [
                'class_id' => $request->query('class_id'),
                'section_id' => $request->query('section_id'),
                'academic_year_id' => $request->query('academic_year_id', $currentAcademicYear?->id),
                'billing_month' => $request->query('billing_month'),
                'status' => $request->query('status'),
                'search' => $request->query('search'),
            ],
        ]);
    }

    /**
     * Configure or update default Class Fee Structure for an Academic Session.
     */
    public function storeClassStructure(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageFees', $organization);

        $validated = $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'monthly_tuition_fee' => 'required|numeric|min:0',
            'admission_fee' => 'nullable|numeric|min:0',
            'annual_fee' => 'nullable|numeric|min:0',
            'transport_fee' => 'nullable|numeric|min:0',
            'other_recurring_charges' => 'nullable|numeric|min:0',
            'due_day' => 'required|integer|min:1|max:31',
            'late_fee_enabled' => 'nullable|boolean',
            'late_fee_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Cross-validate tenant ownership
        $class = SchoolClass::where('id', $validated['school_class_id'])
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        $year = AcademicYear::where('id', $validated['academic_year_id'])
            ->where('organization_id', $organization->id)
            ->firstOrFail();

        ClassFeeStructure::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'school_class_id' => $class->id,
                'academic_year_id' => $year->id,
            ],
            [
                'monthly_tuition_fee' => round((float) $validated['monthly_tuition_fee'], 2),
                'admission_fee' => round((float) ($validated['admission_fee'] ?? 0.00), 2),
                'annual_fee' => round((float) ($validated['annual_fee'] ?? 0.00), 2),
                'transport_fee' => round((float) ($validated['transport_fee'] ?? 0.00), 2),
                'other_recurring_charges' => round((float) ($validated['other_recurring_charges'] ?? 0.00), 2),
                'currency' => $organization->currency ?? 'USD',
                'due_day' => (int) $validated['due_day'],
                'late_fee_enabled' => (bool) ($validated['late_fee_enabled'] ?? false),
                'late_fee_amount' => round((float) ($validated['late_fee_amount'] ?? 0.00), 2),
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return back()->with('success', "Default fee plan for {$class->name} ({$year->name}) updated successfully. Existing historical invoices and payments remain untouched.");
    }

    /**
     * Preview bulk invoice generation before executing it.
     */
    public function previewGeneration(Request $request): \Illuminate\Http\JsonResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageFees', $organization);

        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'billing_month' => 'required|date',
            'due_date' => 'required|date',
            'school_class_id' => 'nullable|exists:school_classes,id',
            'class_section_id' => 'nullable|exists:class_sections,id',
            'include_annual_fee' => 'nullable|boolean',
            'include_admission_fee' => 'nullable|boolean',
        ]);

        $billingMonthDate = Carbon::parse($validated['billing_month'])->startOfMonth()->toDateString();

        $query = StudentEnrollment::where('organization_id', $organization->id)
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('status', 'active')
            ->with([
                'student.studentProfile',
                'student.studentFeeStructure',
                'classSection.schoolClass',
            ]);

        if (! empty($validated['school_class_id'])) {
            $query->whereHas('classSection', fn ($q) => $q->where('school_class_id', $validated['school_class_id']));
        }

        if (! empty($validated['class_section_id'])) {
            $query->where('class_section_id', $validated['class_section_id']);
        }

        $enrollments = $query->get();

        // Cache class fee structures
        $classFeeStructures = ClassFeeStructure::where('organization_id', $organization->id)
            ->where('academic_year_id', $validated['academic_year_id'])
            ->get()
            ->keyBy('school_class_id');

        // Check which students already have an invoice for this month
        $existingInvoiceStudentIds = FeeInvoice::where('organization_id', $organization->id)
            ->whereDate('billing_month', $billingMonthDate)
            ->pluck('student_id')
            ->flip()
            ->toArray();

        $previewList = [];
        $projectedTotal = 0.0;
        $newCount = 0;
        $alreadyCount = 0;

        foreach ($enrollments as $enrollment) {
            $student = $enrollment->student;
            if (! $student) {
                continue;
            }

            $alreadyGenerated = isset($existingInvoiceStudentIds[$student->id]);
            $classId = $enrollment->classSection?->school_class_id;

            $customStructure = $student->studentFeeStructure;
            $classStructure = $classId ? ($classFeeStructures[$classId] ?? null) : null;

            $tuition = $customStructure
                ? (float) $customStructure->monthly_tuition_fee
                : ($classStructure ? (float) $classStructure->monthly_tuition_fee : 0.00);

            $transport = $customStructure
                ? (float) ($customStructure->transport_fee ?? 0.00)
                : ($classStructure ? (float) ($classStructure->transport_fee ?? 0.00) : 0.00);

            $other = $customStructure
                ? (float) $customStructure->other_recurring_charges
                : ($classStructure ? (float) $classStructure->other_recurring_charges : 0.00);

            $admissionFee = (! empty($validated['include_admission_fee']))
                ? ($customStructure ? (float) $customStructure->admission_fee : ($classStructure ? (float) $classStructure->admission_fee : 0.00))
                : 0.00;

            $annualFee = (! empty($validated['include_annual_fee']))
                ? ($customStructure ? (float) $customStructure->annual_fee : ($classStructure ? (float) $classStructure->annual_fee : 0.00))
                : 0.00;

            $subtotal = $tuition + $transport + $other + $admissionFee + $annualFee;

            $discountAmount = 0.00;
            $discountReason = null;

            if ($customStructure && $customStructure->discount_type !== 'none' && $customStructure->discount_value > 0) {
                $discountReason = $customStructure->discount_reason;
                if ($customStructure->discount_type === 'percentage') {
                    $discountAmount = round(($subtotal * ((float) $customStructure->discount_value / 100)), 2);
                } else {
                    $discountAmount = min($subtotal, (float) $customStructure->discount_value);
                }
            }

            $total = max(0.00, round($subtotal - $discountAmount, 2));

            if ($alreadyGenerated) {
                $alreadyCount++;
            } else {
                $newCount++;
                $projectedTotal += $total;
            }

            $previewList[] = [
                'student_id' => $student->id,
                'student_name' => $student->name,
                'admission_number' => $student->studentProfile?->admission_number ?? 'N/A',
                'roll_number' => $enrollment->roll_number ?? 'N/A',
                'class_name' => $enrollment->classSection?->schoolClass?->name ?? 'N/A',
                'section_name' => $enrollment->classSection?->name ?? 'N/A',
                'tuition_fee' => $tuition,
                'transport_fee' => $transport,
                'other_charges' => $other,
                'admission_fee' => $admissionFee,
                'annual_fee' => $annualFee,
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'discount_reason' => $discountReason,
                'total_amount' => $total,
                'already_generated' => $alreadyGenerated,
            ];
        }

        return response()->json([
            'summary' => [
                'total_enrolled' => count($previewList),
                'new_to_generate' => $newCount,
                'already_generated' => $alreadyCount,
                'projected_total' => round($projectedTotal, 2),
                'currency' => $organization->currency ?? 'USD',
                'billing_month' => $billingMonthDate,
                'due_date' => $validated['due_date'],
            ],
            'students' => $previewList,
        ]);
    }

    /**
     * Idempotently generate monthly invoices for eligible enrolled students.
     */
    public function generateInvoices(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageFees', $organization);

        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'billing_month' => 'required|date',
            'due_date' => 'required|date',
            'school_class_id' => 'nullable|exists:school_classes,id',
            'class_section_id' => 'nullable|exists:class_sections,id',
            'include_annual_fee' => 'nullable|boolean',
            'include_admission_fee' => 'nullable|boolean',
            'notes' => 'nullable|string|max:500',
        ]);

        $billingMonth = Carbon::parse($validated['billing_month'])->startOfMonth()->toDateString();
        $issueDate = now()->toDateString();
        $dueDate = Carbon::parse($validated['due_date'])->toDateString();

        $query = StudentEnrollment::where('organization_id', $organization->id)
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('status', 'active')
            ->with([
                'student.studentProfile',
                'student.studentFeeStructure',
                'classSection.schoolClass',
            ]);

        if (! empty($validated['school_class_id'])) {
            $query->whereHas('classSection', fn ($q) => $q->where('school_class_id', $validated['school_class_id']));
        }

        if (! empty($validated['class_section_id'])) {
            $query->where('class_section_id', $validated['class_section_id']);
        }

        $enrollments = $query->get();

        if ($enrollments->isEmpty()) {
            return back()->with('error', 'No active enrolled students found for the selected academic class/session.');
        }

        $classFeeStructures = ClassFeeStructure::where('organization_id', $organization->id)
            ->where('academic_year_id', $validated['academic_year_id'])
            ->get()
            ->keyBy('school_class_id');

        $generatedCount = 0;
        $skippedCount = 0;
        $totalBilled = 0.0;

        DB::transaction(function () use (
            $enrollments,
            $organization,
            $billingMonth,
            $issueDate,
            $dueDate,
            $validated,
            $classFeeStructures,
            $request,
            &$generatedCount,
            &$skippedCount,
            &$totalBilled
        ) {
            $monthSlug = Carbon::parse($billingMonth)->format('Ym');
            $yearStr = Carbon::parse($billingMonth)->format('F Y');

            foreach ($enrollments as $enrollment) {
                $student = $enrollment->student;
                if (! $student) {
                    continue;
                }

                // Check idempotency: unique invoice per organization + student + billing_month
                $existing = FeeInvoice::where('organization_id', $organization->id)
                    ->where('student_id', $student->id)
                    ->whereDate('billing_month', $billingMonth)
                    ->first();

                if ($existing) {
                    $skippedCount++;
                    continue;
                }

                $classId = $enrollment->classSection?->school_class_id;
                $customStructure = $student->studentFeeStructure;
                $classStructure = $classId ? ($classFeeStructures[$classId] ?? null) : null;

                $tuition = $customStructure
                    ? (float) $customStructure->monthly_tuition_fee
                    : ($classStructure ? (float) $classStructure->monthly_tuition_fee : 0.00);

                $transport = $customStructure
                    ? (float) ($customStructure->transport_fee ?? 0.00)
                    : ($classStructure ? (float) ($classStructure->transport_fee ?? 0.00) : 0.00);

                $other = $customStructure
                    ? (float) $customStructure->other_recurring_charges
                    : ($classStructure ? (float) $classStructure->other_recurring_charges : 0.00);

                $admissionFee = (! empty($validated['include_admission_fee']))
                    ? ($customStructure ? (float) $customStructure->admission_fee : ($classStructure ? (float) $classStructure->admission_fee : 0.00))
                    : 0.00;

                $annualFee = (! empty($validated['include_annual_fee']))
                    ? ($customStructure ? (float) $customStructure->annual_fee : ($classStructure ? (float) $classStructure->annual_fee : 0.00))
                    : 0.00;

                $subtotal = round($tuition + $transport + $other + $admissionFee + $annualFee, 2);

                $discountAmount = 0.00;
                $discountReason = null;

                if ($customStructure && $customStructure->discount_type !== 'none' && $customStructure->discount_value > 0) {
                    $discountReason = $customStructure->discount_reason;
                    if ($customStructure->discount_type === 'percentage') {
                        $discountAmount = round(($subtotal * ((float) $customStructure->discount_value / 100)), 2);
                    } else {
                        $discountAmount = min($subtotal, (float) $customStructure->discount_value);
                    }
                }

                $lateFee = 0.00;
                $totalAmount = max(0.00, round($subtotal - $discountAmount + $lateFee, 2));

                // Generate collision-safe invoice number
                $invoiceSeq = FeeInvoice::where('organization_id', $organization->id)
                    ->where('invoice_number', 'like', "INV-{$monthSlug}-%")
                    ->count() + 1 + $generatedCount;

                $invoiceNumber = sprintf("INV-%s-%04d", $monthSlug, $invoiceSeq);

                // Create Fee Invoice
                $invoice = FeeInvoice::create([
                    'organization_id' => $organization->id,
                    'student_id' => $student->id,
                    'student_enrollment_id' => $enrollment->id,
                    'school_class_id' => $classId,
                    'class_section_id' => $enrollment->class_section_id,
                    'academic_year_id' => $enrollment->academic_year_id,
                    'invoice_number' => $invoiceNumber,
                    'billing_month' => $billingMonth,
                    'issue_date' => $issueDate,
                    'due_date' => $dueDate,
                    'subtotal' => $subtotal,
                    'discount_amount' => $discountAmount,
                    'discount_reason' => $discountReason,
                    'late_fee' => $lateFee,
                    'total_amount' => $totalAmount,
                    'paid_amount' => 0.00,
                    'balance_due' => $totalAmount,
                    'status' => 'unpaid',
                    'currency' => $organization->currency ?? 'USD',
                    'notes' => $validated['notes'] ?? "Institutional monthly fee voucher for {$yearStr}.",
                    'created_by' => $request->user()->id,
                ]);

                // Create Itemized Line Items
                if ($tuition > 0) {
                    FeeInvoiceItem::create([
                        'fee_invoice_id' => $invoice->id,
                        'fee_type' => 'tuition',
                        'description' => "Monthly Tuition Fee ({$yearStr})",
                        'amount' => $tuition,
                    ]);
                }

                if ($transport > 0) {
                    FeeInvoiceItem::create([
                        'fee_invoice_id' => $invoice->id,
                        'fee_type' => 'transport',
                        'description' => 'Institutional Transport / Bus Services',
                        'amount' => $transport,
                    ]);
                }

                if ($other > 0) {
                    FeeInvoiceItem::create([
                        'fee_invoice_id' => $invoice->id,
                        'fee_type' => 'other',
                        'description' => 'Laboratory, IT, Sports & Campus Amenities',
                        'amount' => $other,
                    ]);
                }

                if ($admissionFee > 0) {
                    FeeInvoiceItem::create([
                        'fee_invoice_id' => $invoice->id,
                        'fee_type' => 'admission',
                        'description' => 'One-time Registration / Admission Fee',
                        'amount' => $admissionFee,
                    ]);
                }

                if ($annualFee > 0) {
                    FeeInvoiceItem::create([
                        'fee_invoice_id' => $invoice->id,
                        'fee_type' => 'annual',
                        'description' => 'Annual Facility & Development Charges',
                        'amount' => $annualFee,
                    ]);
                }

                // If no specific line items were > 0, create default general tuition line item
                if ($subtotal <= 0) {
                    FeeInvoiceItem::create([
                        'fee_invoice_id' => $invoice->id,
                        'fee_type' => 'tuition',
                        'description' => "Tuition Fee ({$yearStr})",
                        'amount' => 0.00,
                    ]);
                }

                $generatedCount++;
                $totalBilled += $totalAmount;
            }
        });

        $currency = $organization->currency ?? 'USD';
        $formattedBilled = number_format($totalBilled, 2) . ' ' . $currency;

        $msg = "Generated {$generatedCount} fee invoices ({$formattedBilled}).";
        if ($skippedCount > 0) {
            $msg .= " {$skippedCount} students already had invoices for this month and were skipped without duplicate creation.";
        }

        return back()->with('success', $msg);
    }

    /**
     * Record a verified offline payment (cash, bank transfer, cheque, card, etc.).
     */
    public function recordPayment(FeeInvoice $invoice, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $invoice->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('recordPayment', $invoice);

        $maxPayable = (float) $invoice->balance_due;

        $validated = $request->validate([
            'amount' => "required|numeric|min:0.01|max:{$maxPayable}",
            'payment_date' => 'required|date',
            'payment_method' => 'required|string|in:cash,bank_transfer,cheque,card,online,other',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string|max:1000',
        ]);

        $amount = round((float) $validated['amount'], 2);

        $payment = DB::transaction(function () use ($invoice, $organization, $validated, $amount, $request) {
            $dateSlug = Carbon::parse($validated['payment_date'])->format('Ym');
            $seq = FeePayment::where('organization_id', $organization->id)
                ->where('payment_number', 'like', "RCP-{$dateSlug}-%")
                ->count() + 1;

            $paymentNumber = sprintf("RCP-%s-%04d", $dateSlug, $seq);

            $p = FeePayment::create([
                'organization_id' => $organization->id,
                'fee_invoice_id' => $invoice->id,
                'student_id' => $invoice->student_id,
                'payment_number' => $paymentNumber,
                'amount' => $amount,
                'payment_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'received_by' => $request->user()->id,
            ]);

            // Recalculate invoice financials
            $invoice->recalculateFinancials();

            return $p;
        });

        $currency = $invoice->currency ?: ($organization->currency ?? 'USD');
        return back()->with('success', "Verified payment of {$amount} {$currency} recorded successfully (Receipt #{$payment->payment_number}). Balance updated.");
    }

    /**
     * Download or view printable Fee Voucher / Invoice.
     */
    public function downloadInvoice(FeeInvoice $invoice, Request $request): HttpResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $invoice->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('view', $invoice);

        $invoice->load([
            'student.studentProfile',
            'student.studentGuardians',
            'schoolClass',
            'classSection',
            'academicYear',
            'items',
            'payments.receiver',
        ]);

        $currency = $invoice->currency ?: ($organization->currency ?? 'USD');
        $html = view('fees.invoice-voucher', [
            'invoice' => $invoice,
            'organization' => $organization,
            'currency' => $currency,
        ])->render();

        return response($html)->header('Content-Type', 'text/html');
    }

    /**
     * Download or view printable Payment Receipt.
     */
    public function downloadReceipt(FeePayment $payment, Request $request): HttpResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $payment->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('view', $payment->invoice);

        $payment->load([
            'invoice.schoolClass',
            'invoice.classSection',
            'student.studentProfile',
            'receiver',
        ]);

        $currency = $payment->invoice?->currency ?: ($organization->currency ?? 'USD');
        $html = view('fees.payment-receipt', [
            'payment' => $payment,
            'invoice' => $payment->invoice,
            'organization' => $organization,
            'currency' => $currency,
        ])->render();

        return response($html)->header('Content-Type', 'text/html');
    }

    /**
     * Stream CSV export of filtered fee invoices ledger.
     */
    public function export(Request $request): StreamedResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageFees', $organization);

        $query = FeeInvoice::where('organization_id', $organization->id)
            ->with(['student.studentProfile', 'schoolClass', 'classSection', 'academicYear']);

        if ($classId = $request->query('class_id')) {
            $query->where('school_class_id', $classId);
        }
        if ($sectionId = $request->query('section_id')) {
            $query->where('class_section_id', $sectionId);
        }
        if ($yearId = $request->query('academic_year_id')) {
            $query->where('academic_year_id', $yearId);
        }
        if ($month = $request->query('billing_month')) {
            $query->whereDate('billing_month', Carbon::parse($month)->startOfMonth()->toDateString());
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $invoices = $query->latest('issue_date')->get();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="fee_invoices_ledger_'.date('Ymd_His').'.csv"',
        ];

        $callback = function () use ($invoices) {
            $file = fopen('php://output', 'w');
            fputcsv($file, [
                'Invoice Number',
                'Student Name',
                'Admission Number',
                'Class',
                'Section',
                'Billing Month',
                'Issue Date',
                'Due Date',
                'Subtotal',
                'Discount Amount',
                'Discount Reason',
                'Late Fee',
                'Total Invoiced',
                'Amount Paid',
                'Balance Due',
                'Payment Status',
                'Currency',
            ]);

            foreach ($invoices as $inv) {
                fputcsv($file, [
                    $inv->invoice_number,
                    $inv->student?->name ?? 'N/A',
                    $inv->student?->studentProfile?->admission_number ?? 'N/A',
                    $inv->schoolClass?->name ?? 'N/A',
                    $inv->classSection?->name ?? 'N/A',
                    $inv->billing_month ? $inv->billing_month->format('F Y') : 'N/A',
                    $inv->issue_date ? $inv->issue_date->format('Y-m-d') : 'N/A',
                    $inv->due_date ? $inv->due_date->format('Y-m-d') : 'N/A',
                    $inv->subtotal,
                    $inv->discount_amount,
                    $inv->discount_reason ?? '',
                    $inv->late_fee,
                    $inv->total_amount,
                    $inv->paid_amount,
                    $inv->balance_due,
                    ucfirst(str_replace('_', ' ', $inv->status)),
                    $inv->currency,
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Manually trigger automated reminder processing for the active organization.
     */
    public function triggerReminders(Request $request, FeeReminderService $service): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageFees', $organization);

        $dryRun = (bool) $request->input('dry_run', false);
        $stats = $service->processForOrganization($organization, $dryRun);

        $msg = "Reminder processing complete: scanned {$stats['invoices_scanned']} invoices, dispatched {$stats['reminders_dispatched']} reminders, skipped {$stats['skipped_already_sent']} (already sent) and {$stats['skipped_fully_paid']} (fully paid).";
        if ($dryRun) {
            $msg = "[Dry Run] " . $msg;
        }

        return back()->with('success', $msg);
    }
}
