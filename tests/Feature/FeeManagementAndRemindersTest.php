<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\ClassFeeStructure;
use App\Models\ClassSection;
use App\Models\FeeInvoice;
use App\Models\FeeInvoiceItem;
use App\Models\FeePayment;
use App\Models\FeeReminderLog;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\ParentStudent;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\StudentFeeStructure;
use App\Models\StudentGuardian;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\FeeReminderService;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class FeeManagementAndRemindersTest extends TestCase
{
    use RefreshDatabase;

    private Organization $orgA;
    private Organization $orgB;
    private User $ownerA;
    private User $teacherA;
    private User $studentA;
    private User $studentB;
    private User $parentA;
    private AcademicYear $academicYearA;
    private SchoolClass $classA;
    private ClassSection $sectionA;
    private StudentEnrollment $enrollmentA;
    private SchoolClass $classB;
    private AcademicYear $academicYearB;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create Organization A
        $this->ownerA = User::factory()->create(['name' => 'Owner Alpha', 'email' => 'owner@alpha.test', 'role' => 'student']);
        $this->teacherA = User::factory()->create(['name' => 'Teacher Alpha', 'email' => 'teacher@alpha.test', 'role' => 'student']);
        $this->studentA = User::factory()->create(['name' => 'Student Alice', 'email' => 'alice@alpha.test', 'role' => 'student']);
        $this->parentA = User::factory()->create(['name' => 'Parent Alice', 'email' => 'parent.alice@alpha.test', 'role' => 'parent']);

        $this->orgA = Organization::create([
            'name' => 'Alpha International Academy',
            'slug' => 'alpha-'.Str::random(5),
            'organization_type' => 'school',
            'status' => 'active',
            'currency' => 'USD',
            'created_by' => $this->ownerA->id,
        ]);

        OrganizationUser::create(['organization_id' => $this->orgA->id, 'user_id' => $this->ownerA->id, 'role' => 'owner', 'status' => 'active']);
        OrganizationUser::create(['organization_id' => $this->orgA->id, 'user_id' => $this->teacherA->id, 'role' => 'teacher', 'status' => 'active']);
        OrganizationUser::create(['organization_id' => $this->orgA->id, 'user_id' => $this->studentA->id, 'role' => 'student', 'status' => 'active']);
        OrganizationUser::create(['organization_id' => $this->orgA->id, 'user_id' => $this->parentA->id, 'role' => 'parent', 'status' => 'active']);

        $this->academicYearA = AcademicYear::create([
            'organization_id' => $this->orgA->id,
            'name' => '2026-2027 Academic Session',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'is_current' => true,
        ]);

        $this->classA = SchoolClass::create([
            'organization_id' => $this->orgA->id,
            'name' => 'Grade 10',
            'code' => 'G10',
        ]);

        $this->sectionA = ClassSection::create([
            'organization_id' => $this->orgA->id,
            'school_class_id' => $this->classA->id,
            'name' => 'Section A',
        ]);

        StudentProfile::create([
            'organization_id' => $this->orgA->id,
            'user_id' => $this->studentA->id,
            'admission_number' => 'ADM-2026-0001',
            'admission_date' => '2026-09-01',
        ]);

        $this->enrollmentA = StudentEnrollment::create([
            'organization_id' => $this->orgA->id,
            'student_id' => $this->studentA->id,
            'class_section_id' => $this->sectionA->id,
            'academic_year_id' => $this->academicYearA->id,
            'roll_number' => 'STU-001',
            'status' => 'active',
        ]);

        StudentGuardian::create([
            'organization_id' => $this->orgA->id,
            'student_id' => $this->studentA->id,
            'guardian_user_id' => $this->parentA->id,
            'name' => 'Parent Alice',
            'relationship' => 'mother',
            'email' => 'parent.alice@alpha.test',
            'phone' => '+1234567890',
            'is_primary' => true,
        ]);

        ParentStudent::create([
            'organization_id' => $this->orgA->id,
            'parent_id' => $this->parentA->id,
            'student_id' => $this->studentA->id,
            'relationship' => 'mother',
        ]);

        // 2. Create Organization B for isolation checks
        $ownerB = User::factory()->create(['name' => 'Owner Beta', 'email' => 'owner@beta.test', 'role' => 'student']);
        $this->studentB = User::factory()->create(['name' => 'Student Bob', 'email' => 'bob@beta.test', 'role' => 'student']);

        $this->orgB = Organization::create([
            'name' => 'Beta High School',
            'slug' => 'beta-'.Str::random(5),
            'organization_type' => 'school',
            'status' => 'active',
            'currency' => 'EUR',
            'created_by' => $ownerB->id,
        ]);

        OrganizationUser::create(['organization_id' => $this->orgB->id, 'user_id' => $ownerB->id, 'role' => 'owner', 'status' => 'active']);
        OrganizationUser::create(['organization_id' => $this->orgB->id, 'user_id' => $this->studentB->id, 'role' => 'student', 'status' => 'active']);

        $this->classB = SchoolClass::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Beta Grade 10',
        ]);

        $this->academicYearB = AcademicYear::create([
            'organization_id' => $this->orgB->id,
            'name' => 'Beta Session',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'is_current' => true,
        ]);
    }

    public function test_owner_can_view_fee_dashboard_and_metrics(): void
    {
        $response = $this->actingAs($this->ownerA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->get('/school/fees');

        $response->assertOk();
    }

    public function test_teacher_is_strictly_forbidden_from_financial_routes(): void
    {
        // 1. Dashboard access
        $this->actingAs($this->teacherA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->get('/school/fees')
            ->assertForbidden();

        // 2. Bulk invoice generation
        $this->actingAs($this->teacherA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->post('/school/fees/generate', [
                'academic_year_id' => $this->academicYearA->id,
                'billing_month' => '2026-11-01',
                'due_date' => '2026-11-10',
            ])
            ->assertForbidden();

        // 3. Class fee structure updates
        $this->actingAs($this->teacherA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->post('/school/fees/structures', [
                'school_class_id' => $this->classA->id,
                'academic_year_id' => $this->academicYearA->id,
                'monthly_tuition_fee' => 5000,
                'due_day' => 10,
            ])
            ->assertForbidden();
    }

    public function test_student_can_only_view_their_own_fees_portal_and_vouchers(): void
    {
        // Create invoice for Student A in Org A
        $invoiceA = FeeInvoice::create([
            'organization_id' => $this->orgA->id,
            'student_id' => $this->studentA->id,
            'student_enrollment_id' => $this->enrollmentA->id,
            'school_class_id' => $this->classA->id,
            'class_section_id' => $this->sectionA->id,
            'academic_year_id' => $this->academicYearA->id,
            'invoice_number' => 'INV-2026-0001',
            'billing_month' => '2026-10-01',
            'issue_date' => '2026-10-01',
            'due_date' => '2026-10-10',
            'subtotal' => 6000,
            'discount_amount' => 0,
            'late_fee' => 0,
            'total_amount' => 6000,
            'paid_amount' => 0,
            'balance_due' => 6000,
            'status' => 'unpaid',
            'currency' => 'USD',
        ]);

        // Student A views portal
        $this->actingAs($this->studentA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->get('/school/my-fees')
            ->assertOk();

        // Student A downloads own voucher
        $this->actingAs($this->studentA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->get("/school/fees/invoices/{$invoiceA->id}/download")
            ->assertOk();

        // Student B (different student) cannot download Student A's voucher
        $this->actingAs($this->studentB)
            ->withSession(['current_organization_id' => $this->orgB->id])
            ->get("/school/fees/invoices/{$invoiceA->id}/download")
            ->assertForbidden();
    }

    public function test_parent_can_view_linked_children_fees_and_not_unrelated_students(): void
    {
        // Parent A can view linked Student A
        $this->actingAs($this->parentA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->get("/school/my-fees?student_id={$this->studentA->id}")
            ->assertOk();

        // Parent A cannot view Student B (unrelated)
        $this->actingAs($this->parentA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->get("/school/my-fees?student_id={$this->studentB->id}")
            ->assertForbidden();
    }

    public function test_multi_tenant_isolation_prevents_cross_org_access(): void
    {
        // Invoice in Org B
        $invoiceB = FeeInvoice::create([
            'organization_id' => $this->orgB->id,
            'student_id' => $this->studentB->id,
            'school_class_id' => $this->classB->id,
            'academic_year_id' => $this->academicYearB->id,
            'invoice_number' => 'INV-BETA-001',
            'billing_month' => '2026-10-01',
            'issue_date' => '2026-10-01',
            'due_date' => '2026-10-10',
            'subtotal' => 500,
            'discount_amount' => 0,
            'late_fee' => 0,
            'total_amount' => 500,
            'paid_amount' => 0,
            'balance_due' => 500,
            'status' => 'unpaid',
            'currency' => 'EUR',
        ]);

        // Org A Owner cannot download Org B invoice (forbidden or not found under tenant scope)
        $res = $this->actingAs($this->ownerA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->get("/school/fees/invoices/{$invoiceB->id}/download");
        $this->assertTrue(in_array($res->status(), [403, 404]));

        // Org A Owner cannot record payment on Org B invoice
        $payRes = $this->actingAs($this->ownerA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->post("/school/fees/invoices/{$invoiceB->id}/payments", [
                'amount' => 500,
                'payment_date' => '2026-10-05',
                'payment_method' => 'cash',
            ]);
        $this->assertTrue(in_array($payRes->status(), [403, 404]));
    }

    public function test_owner_can_configure_class_fee_structure(): void
    {
        $response = $this->actingAs($this->ownerA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->post('/school/fees/structures', [
                'school_class_id' => $this->classA->id,
                'academic_year_id' => $this->academicYearA->id,
                'monthly_tuition_fee' => 8000,
                'transport_fee' => 2500,
                'admission_fee' => 5000,
                'annual_fee' => 3000,
                'other_recurring_charges' => 1000,
                'due_day' => 15,
                'late_fee_enabled' => true,
                'late_fee_amount' => 500,
            ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('class_fee_structures', [
            'organization_id' => $this->orgA->id,
            'school_class_id' => $this->classA->id,
            'academic_year_id' => $this->academicYearA->id,
            'monthly_tuition_fee' => 8000,
            'transport_fee' => 2500,
            'due_day' => 15,
            'late_fee_enabled' => true,
        ]);
    }

    public function test_idempotent_bulk_invoice_generation_and_accurate_calculations(): void
    {
        // Setup Student Fee Structure for Student A:
        // Tuition: 10,000 | Transport: 2,000 | Other: 1,000 => Subtotal: 13,000
        // Discount: 10% percentage => Discount: 1,300 => Net Payable: 11,700
        StudentFeeStructure::create([
            'organization_id' => $this->orgA->id,
            'student_id' => $this->studentA->id,
            'fee_category' => 'general',
            'monthly_tuition_fee' => 10000,
            'transport_fee' => 2000,
            'admission_fee' => 0,
            'annual_fee' => 0,
            'other_recurring_charges' => 1000,
            'discount_type' => 'percentage',
            'discount_value' => 10,
            'discount_reason' => '10% Merit Concession',
            'net_monthly_fee' => 11700,
            'currency' => 'USD',
            'payment_frequency' => 'monthly',
            'due_day' => 10,
        ]);

        // 1. Generate Invoices for 2026-11
        $response = $this->actingAs($this->ownerA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->post('/school/fees/generate', [
                'academic_year_id' => $this->academicYearA->id,
                'school_class_id' => $this->classA->id,
                'billing_month' => '2026-11-01',
                'issue_date' => '2026-11-01',
                'due_date' => '2026-11-10',
            ]);

        $response->assertRedirect();

        $invoice = FeeInvoice::where('organization_id', $this->orgA->id)
            ->where('student_id', $this->studentA->id)
            ->whereDate('billing_month', '2026-11-01')
            ->first();

        $this->assertNotNull($invoice);
        $this->assertEquals(13000.00, (float) $invoice->subtotal);
        $this->assertEquals(1300.00, (float) $invoice->discount_amount);
        $this->assertEquals(11700.00, (float) $invoice->total_amount);
        $this->assertEquals(11700.00, (float) $invoice->balance_due);
        $this->assertEquals('unpaid', $invoice->status);

        // Verify items
        $this->assertDatabaseHas('fee_invoice_items', [
            'fee_invoice_id' => $invoice->id,
            'fee_type' => 'tuition',
            'amount' => 10000.00,
        ]);
        $this->assertDatabaseHas('fee_invoice_items', [
            'fee_invoice_id' => $invoice->id,
            'fee_type' => 'transport',
            'amount' => 2000.00,
        ]);

        // 2. IDEMPOTENCY: Run generation again for same month
        $responseSecond = $this->actingAs($this->ownerA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->post('/school/fees/generate', [
                'academic_year_id' => $this->academicYearA->id,
                'school_class_id' => $this->classA->id,
                'billing_month' => '2026-11-01',
                'issue_date' => '2026-11-01',
                'due_date' => '2026-11-10',
            ]);

        $responseSecond->assertRedirect();

        // Exactly one invoice should exist for this month (zero duplicates)
        $invoiceCount = FeeInvoice::where('organization_id', $this->orgA->id)
            ->where('student_id', $this->studentA->id)
            ->whereDate('billing_month', '2026-11-01')
            ->count();

        $this->assertEquals(1, $invoiceCount);
    }

    public function test_recording_verified_offline_payment_updates_balance_and_receipt(): void
    {
        $invoice = FeeInvoice::create([
            'organization_id' => $this->orgA->id,
            'student_id' => $this->studentA->id,
            'student_enrollment_id' => $this->enrollmentA->id,
            'school_class_id' => $this->classA->id,
            'academic_year_id' => $this->academicYearA->id,
            'invoice_number' => 'INV-2026-PAY1',
            'billing_month' => '2026-11-01',
            'issue_date' => '2026-11-01',
            'due_date' => '2026-11-10',
            'subtotal' => 10000,
            'discount_amount' => 0,
            'late_fee' => 0,
            'total_amount' => 10000,
            'paid_amount' => 0,
            'balance_due' => 10000,
            'status' => 'unpaid',
            'currency' => 'USD',
        ]);

        // 1. Partial payment of 4,000
        $response1 = $this->actingAs($this->ownerA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->post("/school/fees/invoices/{$invoice->id}/payments", [
                'amount' => 4000,
                'payment_date' => '2026-11-03',
                'payment_method' => 'bank_transfer',
                'reference_number' => 'TXN-ABC-123',
                'notes' => 'First installment via HBL bank transfer',
            ]);

        $response1->assertRedirect();
        $invoice->refresh();

        $this->assertEquals(4000.00, (float) $invoice->paid_amount);
        $this->assertEquals(6000.00, (float) $invoice->balance_due);
        $this->assertEquals('partially_paid', $invoice->status);

        // 2. Full balance settlement of 6,000
        $response2 = $this->actingAs($this->ownerA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->post("/school/fees/invoices/{$invoice->id}/payments", [
                'amount' => 6000,
                'payment_date' => '2026-11-05',
                'payment_method' => 'cash',
                'reference_number' => 'CASH-REC-002',
                'notes' => 'Final settlement cash payment',
            ]);

        $response2->assertRedirect();
        $invoice->refresh();

        $this->assertEquals(10000.00, (float) $invoice->paid_amount);
        $this->assertEquals(0.00, (float) $invoice->balance_due);
        $this->assertEquals('paid', $invoice->status);

        $latestPayment = FeePayment::where('fee_invoice_id', $invoice->id)->latest()->first();
        $this->assertNotNull($latestPayment);

        // Official printable payment receipt check
        $receiptResponse = $this->actingAs($this->ownerA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->get("/school/fees/payments/{$latestPayment->id}/receipt");

        $receiptResponse->assertOk();
    }

    public function test_automated_reminders_triggering_and_paid_suppression(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-10-15 09:00:00'));

        // Create 4 distinct students to avoid duplicate billing_month constraint
        $stuBefore = User::factory()->create(['name' => 'Stu Before', 'role' => 'student']);
        $stuToday = User::factory()->create(['name' => 'Stu Today', 'role' => 'student']);
        $stuOverdue = User::factory()->create(['name' => 'Stu Overdue', 'role' => 'student']);
        $stuPaid = User::factory()->create(['name' => 'Stu Paid', 'role' => 'student']);

        foreach ([$stuBefore, $stuToday, $stuOverdue, $stuPaid] as $s) {
            OrganizationUser::create(['organization_id' => $this->orgA->id, 'user_id' => $s->id, 'role' => 'student', 'status' => 'active']);
        }

        // Invoice 1: Due in exactly 10 days (2026-10-25) -> triggers before_due_10
        $invBefore = FeeInvoice::create([
            'organization_id' => $this->orgA->id,
            'student_id' => $stuBefore->id,
            'school_class_id' => $this->classA->id,
            'academic_year_id' => $this->academicYearA->id,
            'invoice_number' => 'INV-REM-BEFORE',
            'billing_month' => '2026-10-01',
            'issue_date' => '2026-10-01',
            'due_date' => '2026-10-25',
            'subtotal' => 5000,
            'discount_amount' => 0,
            'late_fee' => 0,
            'total_amount' => 5000,
            'paid_amount' => 0,
            'balance_due' => 5000,
            'status' => 'unpaid',
            'currency' => 'USD',
        ]);

        // Invoice 2: Due today (2026-10-15) -> triggers due_today
        $invToday = FeeInvoice::create([
            'organization_id' => $this->orgA->id,
            'student_id' => $stuToday->id,
            'school_class_id' => $this->classA->id,
            'academic_year_id' => $this->academicYearA->id,
            'invoice_number' => 'INV-REM-TODAY',
            'billing_month' => '2026-10-01',
            'issue_date' => '2026-10-01',
            'due_date' => '2026-10-15',
            'subtotal' => 5000,
            'discount_amount' => 0,
            'late_fee' => 0,
            'total_amount' => 5000,
            'paid_amount' => 0,
            'balance_due' => 5000,
            'status' => 'unpaid',
            'currency' => 'USD',
        ]);

        // Invoice 3: Overdue by 10 days (2026-10-05) -> triggers overdue_10
        $invOverdue = FeeInvoice::create([
            'organization_id' => $this->orgA->id,
            'student_id' => $stuOverdue->id,
            'school_class_id' => $this->classA->id,
            'academic_year_id' => $this->academicYearA->id,
            'invoice_number' => 'INV-REM-OVERDUE',
            'billing_month' => '2026-10-01',
            'issue_date' => '2026-09-25',
            'due_date' => '2026-10-05',
            'subtotal' => 5000,
            'discount_amount' => 0,
            'late_fee' => 0,
            'total_amount' => 5000,
            'paid_amount' => 0,
            'balance_due' => 5000,
            'status' => 'overdue',
            'currency' => 'USD',
        ]);

        // Invoice 4: Due today but already PAID -> must be suppressed!
        $invPaid = FeeInvoice::create([
            'organization_id' => $this->orgA->id,
            'student_id' => $stuPaid->id,
            'school_class_id' => $this->classA->id,
            'academic_year_id' => $this->academicYearA->id,
            'invoice_number' => 'INV-REM-PAID',
            'billing_month' => '2026-10-01',
            'issue_date' => '2026-10-01',
            'due_date' => '2026-10-15',
            'subtotal' => 5000,
            'discount_amount' => 0,
            'late_fee' => 0,
            'total_amount' => 5000,
            'paid_amount' => 5000,
            'balance_due' => 0,
            'status' => 'paid',
            'currency' => 'USD',
        ]);

        $service = new FeeReminderService();
        $stats = $service->processForOrganization($this->orgA);

        $this->assertEquals(3, $stats['reminders_dispatched']);

        // Check reminder logs
        $this->assertDatabaseHas('fee_reminder_logs', [
            'fee_invoice_id' => $invBefore->id,
            'reminder_type' => 'before_due_10',
            'status' => 'sent',
        ]);
        $this->assertDatabaseHas('fee_reminder_logs', [
            'fee_invoice_id' => $invToday->id,
            'reminder_type' => 'due_today',
            'status' => 'sent',
        ]);
        $this->assertDatabaseHas('fee_reminder_logs', [
            'fee_invoice_id' => $invOverdue->id,
            'reminder_type' => 'overdue_10',
            'status' => 'sent',
        ]);

        // Paid invoice should NEVER have a 'sent' reminder
        $this->assertDatabaseMissing('fee_reminder_logs', [
            'fee_invoice_id' => $invPaid->id,
            'status' => 'sent',
        ]);

        // IDEMPOTENCY / ZERO DUPLICATE: Running reminders again immediately should send 0
        $secondStats = $service->processForOrganization($this->orgA);
        $this->assertEquals(0, $secondStats['reminders_dispatched']);
        $this->assertEquals(3, $secondStats['skipped_already_sent']);

        Carbon::setTestNow(); // Reset time
    }

    public function test_in_app_notification_center_endpoints(): void
    {
        // Insert a notification
        $notificationId = Str::uuid()->toString();
        \Illuminate\Support\Facades\DB::table('notifications')->insert([
            'id' => $notificationId,
            'type' => 'App\\Notifications\\FeeReminderNotification',
            'notifiable_type' => User::class,
            'notifiable_id' => $this->studentA->id,
            'data' => json_encode([
                'title' => 'Fee Reminder Test',
                'message' => 'Please clear your upcoming dues.',
                'action_url' => '/school/my-fees',
            ]),
            'read_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // 1. Fetch unread count & notifications list
        $response = $this->actingAs($this->studentA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->get('/notifications');

        $response->assertOk();
        $response->assertJsonFragment(['unread_count' => 1]);

        // 2. Mark single notification as read
        $markResponse = $this->actingAs($this->studentA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->patchJson("/notifications/{$notificationId}/read");

        $markResponse->assertOk();

        $this->assertDatabaseMissing('notifications', [
            'id' => $notificationId,
            'read_at' => null,
        ]);

        // 3. Mark all as read endpoint
        $readAllResponse = $this->actingAs($this->studentA)
            ->withSession(['current_organization_id' => $this->orgA->id])
            ->postJson('/notifications/read-all');

        $readAllResponse->assertOk();
    }
}
