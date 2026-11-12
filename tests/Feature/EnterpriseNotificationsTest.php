<?php

namespace Tests\Feature;

use App\Events\LiveDomainUpdated;
use App\Events\NotificationCreated;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\ClassSection;
use App\Models\ClassSubjectTeacher;
use App\Models\FeeInvoice;
use App\Models\NotificationPreference;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\ParentStudent;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\Timetable;
use App\Models\TimetableEntry;
use App\Models\User;
use App\Notifications\LmsNotification;
use App\Services\FeeReminderService;
use App\Services\NotificationDispatcher;
use App\Services\TimetableReminderService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EnterpriseNotificationsTest extends TestCase
{
    use RefreshDatabase;

    private function createOrgWithMembers(string $timezone = 'UTC'): array
    {
        $owner = User::factory()->create(['role' => 'admin']);
        $admin = User::factory()->create(['role' => 'admin']);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $student = User::factory()->create(['role' => 'student']);
        $parent = User::factory()->create(['role' => 'student']);
        $otherParent = User::factory()->create(['role' => 'student']);

        $org = Organization::create([
            'name' => 'Alpha Academy',
            'slug' => 'alpha-'.uniqid(),
            'organization_type' => 'school',
            'status' => 'active',
            'timezone' => $timezone,
            'currency' => 'USD',
            'owner_id' => $owner->id,
        ]);

        foreach ([
            [$owner, 'owner'],
            [$admin, 'admin'],
            [$teacher, 'teacher'],
            [$student, 'student'],
            [$parent, 'parent'],
            [$otherParent, 'parent'],
        ] as [$user, $role]) {
            OrganizationUser::create([
                'organization_id' => $org->id,
                'user_id' => $user->id,
                'role' => $role,
                'status' => 'active',
            ]);
        }

        ParentStudent::create([
            'organization_id' => $org->id,
            'parent_id' => $parent->id,
            'student_id' => $student->id,
            'relationship_type' => 'mother',
        ]);

        $year = AcademicYear::create([
            'organization_id' => $org->id,
            'name' => '2026-2027',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'is_current' => true,
        ]);

        $term = AcademicTerm::create([
            'organization_id' => $org->id,
            'academic_year_id' => $year->id,
            'name' => 'Term 1',
            'start_date' => '2026-01-01',
            'end_date' => '2026-06-30',
            'is_current' => true,
        ]);

        $class = SchoolClass::create([
            'organization_id' => $org->id,
            'academic_year_id' => $year->id,
            'name' => 'Grade 10',
        ]);

        $section = ClassSection::create([
            'organization_id' => $org->id,
            'school_class_id' => $class->id,
            'name' => 'Section A',
        ]);

        $subject = Subject::create([
            'organization_id' => $org->id,
            'name' => 'Physics',
            'code' => 'PHY-101',
        ]);

        StudentEnrollment::create([
            'organization_id' => $org->id,
            'academic_year_id' => $year->id,
            'school_class_id' => $class->id,
            'class_section_id' => $section->id,
            'student_id' => $student->id,
            'roll_number' => '10A-01',
            'status' => 'active',
        ]);

        ClassSubjectTeacher::create([
            'organization_id' => $org->id,
            'academic_year_id' => $year->id,
            'class_section_id' => $section->id,
            'subject_id' => $subject->id,
            'teacher_id' => $teacher->id,
        ]);

        return compact('org', 'owner', 'admin', 'teacher', 'student', 'parent', 'otherParent', 'year', 'term', 'class', 'section', 'subject');
    }

    public function test_student_and_linked_parent_receive_fee_reminders_and_overdue_stops_after_payment(): void
    {
        $ctx = $this->createOrgWithMembers('UTC');
        $service = app(FeeReminderService::class);

        $upcomingInvoice = FeeInvoice::create([
            'organization_id' => $ctx['org']->id,
            'academic_year_id' => $ctx['year']->id,
            'school_class_id' => $ctx['class']->id,
            'class_section_id' => $ctx['section']->id,
            'student_id' => $ctx['student']->id,
            'invoice_number' => 'INV-UP-001',
            'billing_month' => now()->startOfMonth()->toDateString(),
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(10)->toDateString(),
            'total_amount' => 500,
            'paid_amount' => 0,
            'balance_due' => 500,
            'status' => 'unpaid',
            'currency' => 'USD',
        ]);

        $overdueInvoice = FeeInvoice::create([
            'organization_id' => $ctx['org']->id,
            'academic_year_id' => $ctx['year']->id,
            'school_class_id' => $ctx['class']->id,
            'class_section_id' => $ctx['section']->id,
            'student_id' => $ctx['student']->id,
            'invoice_number' => 'INV-OV-002',
            'billing_month' => now()->subMonth()->startOfMonth()->toDateString(),
            'issue_date' => now()->subDays(10)->toDateString(),
            'due_date' => now()->subDays(3)->toDateString(),
            'total_amount' => 300,
            'paid_amount' => 0,
            'balance_due' => 300,
            'status' => 'unpaid',
            'currency' => 'USD',
        ]);

        $result = $service->processReminders($ctx['org']->id);
        $this->assertSame(4, $result['reminders_dispatched']); // 2 invoices x (student + parent)

        $this->assertSame(2, $ctx['student']->notifications()->where('category', 'fees')->count());
        $this->assertSame(2, $ctx['parent']->notifications()->where('category', 'fees')->count());
        $this->assertSame(0, $ctx['otherParent']->notifications()->count());

        // Duplicate run must not send again
        $second = $service->processReminders($ctx['org']->id);
        $this->assertSame(0, $second['reminders_dispatched']);
        $this->assertSame(4, $second['skipped_already_sent']);

        // Verified payment stops reminders and notifies student, parent, and owner/admin
        $this->actingAs($ctx['owner'])
            ->post(route('school.fees.payments.store', $overdueInvoice->id), [
                'amount' => 300,
                'payment_date' => now()->toDateString(),
                'payment_method' => 'cash',
            ])
            ->assertRedirect();

        $this->assertTrue(
            $ctx['student']->notifications()->where('data->type', 'fee_payment_confirmed')->exists()
        );
        $this->assertTrue(
            $ctx['parent']->notifications()->where('data->type', 'fee_payment_confirmed')->exists()
        );
        $this->assertTrue(
            $ctx['admin']->notifications()->where('data->type', 'fee_payment_received')->exists()
        );
    }

    public function test_teacher_five_minute_timetable_reminder_respects_timezone_cancellations_and_deduplication(): void
    {
        Carbon::setTestNow(Carbon::create(2026, 11, 16, 10, 0, 0, 'UTC')); // Monday 10:00 UTC = 15:00 Asia/Karachi
        $ctx = $this->createOrgWithMembers('Asia/Karachi');

        $timetable = Timetable::create([
            'organization_id' => $ctx['org']->id,
            'academic_year_id' => $ctx['year']->id,
            'school_class_id' => $ctx['class']->id,
            'class_section_id' => $ctx['section']->id,
            'title' => 'Fall Schedule',
            'is_published' => true,
        ]);

        // Starts at 15:05 Asia/Karachi (exactly 5 minutes from 15:00 local time)
        TimetableEntry::create([
            'organization_id' => $ctx['org']->id,
            'timetable_id' => $timetable->id,
            'academic_year_id' => $ctx['year']->id,
            'school_class_id' => $ctx['class']->id,
            'class_section_id' => $ctx['section']->id,
            'subject_id' => $ctx['subject']->id,
            'teacher_id' => $ctx['teacher']->id,
            'day_of_week' => 'monday',
            'period_name' => 'Period 1',
            'start_time' => '15:05:00',
            'end_time' => '15:50:00',
            'room' => 'Lab-204',
            'is_published' => true,
            'is_cancelled' => false,
        ]);

        // Cancelled period at same time should be ignored
        TimetableEntry::create([
            'organization_id' => $ctx['org']->id,
            'timetable_id' => $timetable->id,
            'academic_year_id' => $ctx['year']->id,
            'school_class_id' => $ctx['class']->id,
            'class_section_id' => $ctx['section']->id,
            'subject_id' => $ctx['subject']->id,
            'teacher_id' => $ctx['teacher']->id,
            'day_of_week' => 'monday',
            'period_name' => 'Period 2',
            'start_time' => '15:05:00',
            'end_time' => '15:50:00',
            'room' => 'Lab-999',
            'is_published' => true,
            'is_cancelled' => true,
        ]);

        $service = app(TimetableReminderService::class);

        // 10 minutes before (14:55 Asia/Karachi = 09:55 UTC): no premature notification
        Carbon::setTestNow(Carbon::create(2026, 11, 16, 9, 55, 0, 'UTC'));
        $premature = $service->processReminders($ctx['org']->id);
        $this->assertSame(0, $premature['reminders_dispatched']);

        // 5 minutes before (15:00 Asia/Karachi = 10:00 UTC): reminder dispatched
        Carbon::setTestNow(Carbon::create(2026, 11, 16, 10, 0, 0, 'UTC'));
        $first = $service->processReminders($ctx['org']->id);
        $this->assertSame(1, $first['reminders_dispatched']);

        // Teacher receives it via JSON polling endpoint without full page refresh
        $this->actingAs($ctx['teacher'])
            ->withSession(['current_organization_id' => $ctx['org']->id])
            ->getJson('/notifications?limit=15')
            ->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonPath('notifications.0.data.url', '/school/timetable');

        $notif = $ctx['teacher']->notifications()->where('category', 'timetable')->first();
        $this->assertNotNull($notif);
        $this->assertStringContainsString('Physics', $notif->data['message']);
        $this->assertStringContainsString('Lab-204', $notif->data['message']);
        $this->assertStringContainsString('Grade 10 (Section A)', $notif->data['message']);
        $this->assertStringContainsString('3:05 PM', $notif->data['message']);

        // 4 minutes before (15:01 Asia/Karachi = 10:01 UTC): must NOT duplicate
        Carbon::setTestNow(Carbon::create(2026, 11, 16, 10, 1, 0, 'UTC'));
        $second = $service->processReminders($ctx['org']->id);
        $this->assertSame(0, $second['reminders_dispatched']);
        $this->assertSame(1, $second['skipped_duplicate']);
        Carbon::setTestNow();
    }

    public function test_attendance_and_assignment_and_owner_activity_notifications(): void
    {
        $ctx = $this->createOrgWithMembers();

        // 1. Attendance absent + submission + correction
        $this->actingAs($ctx['teacher'])
            ->post(route('school.attendance.store'), [
                'class_section_id' => $ctx['section']->id,
                'date' => '2026-11-12',
                'attendances' => [
                    ['student_id' => $ctx['student']->id, 'status' => 'absent'],
                ],
            ])
            ->assertRedirect();

        $this->assertTrue($ctx['student']->notifications()->where('category', 'attendance')->where('data->type', 'attendance_absent')->exists());
        $this->assertTrue($ctx['parent']->notifications()->where('category', 'attendance')->where('data->type', 'attendance_absent')->exists());
        $this->assertTrue($ctx['owner']->notifications()->where('category', 'attendance')->exists());

        // Attendance correction
        $this->actingAs($ctx['owner'])
            ->post(route('school.attendance.store'), [
                'class_section_id' => $ctx['section']->id,
                'date' => '2026-11-12',
                'attendances' => [
                    ['student_id' => $ctx['student']->id, 'status' => 'present'],
                ],
            ])
            ->assertRedirect();

        $this->assertTrue($ctx['student']->notifications()->where('data->type', 'attendance_corrected')->exists());
        $this->assertTrue($ctx['parent']->notifications()->where('data->type', 'attendance_corrected')->exists());

        // 2. Assignment published + grade published
        $this->actingAs($ctx['owner'])
            ->post(route('school.grades.assessments.store'), [
                'title' => 'Kinematics Homework',
                'type' => 'assignment',
                'class_section_id' => $ctx['section']->id,
                'subject_id' => $ctx['subject']->id,
                'academic_term_id' => $ctx['term']->id,
                'max_score' => 100,
                'due_date' => '2026-11-20',
            ])
            ->assertRedirect();

        $this->assertTrue($ctx['student']->notifications()->where('category', 'assignments')->exists());

        // 3. Organization settings updated + new member added
        $this->actingAs($ctx['owner'])
            ->put(route('organizations.settings.update'), [
                'name' => 'Alpha Academy Updated',
                'organization_type' => 'school',
                'timezone' => 'UTC',
                'currency' => 'USD',
            ])
            ->assertRedirect();

        $this->assertTrue($ctx['admin']->notifications()->where('category', 'organization_activity')->exists());

        $this->actingAs($ctx['owner'])
            ->post(route('organizations.members.direct'), [
                'name' => 'New Physics Teacher',
                'email' => 'newteacher@alpha.test',
                'role' => 'teacher',
                'password' => 'Password123!',
            ])
            ->assertRedirect();

        $this->assertTrue(
            $ctx['admin']->notifications()
                ->where('category', 'organization_activity')
                ->where('data->title', 'New Teacher Added: New Physics Teacher')
                ->exists()
        );
    }

    public function test_tenant_isolation_and_platform_separation_and_mark_as_read(): void
    {
        $ctxA = $this->createOrgWithMembers();
        $ctxB = $this->createOrgWithMembers();

        // Give student A membership in Org B too, to verify org scoping isolates notifications per org
        OrganizationUser::create([
            'organization_id' => $ctxB['org']->id,
            'user_id' => $ctxA['student']->id,
            'role' => 'student',
            'status' => 'active',
        ]);

        $dispatcher = app(NotificationDispatcher::class);
        $dispatcher->toUsers($ctxA['student'], $ctxA['org']->id, 'academics', 'Org A Notice', 'Only in Org A');
        $dispatcher->toUsers($ctxA['student'], $ctxB['org']->id, 'academics', 'Org B Notice', 'Only in Org B');
        $dispatcher->toPlatformUsers($ctxA['student'], 'announcements', 'Platform Notice', 'Only platform');

        // Request in Org A context via session
        $responseA = $this->actingAs($ctxA['student'])
            ->withSession(['current_organization_id' => $ctxA['org']->id])
            ->getJson('/notifications');

        $responseA->assertOk()
            ->assertJsonPath('unread_count', 1)
            ->assertJsonPath('notifications.0.data.title', 'Org A Notice');

        $notifId = $responseA->json('notifications.0.id');

        // Other user cannot mark Student A's notification as read
        $this->actingAs($ctxB['student'])
            ->withSession(['current_organization_id' => $ctxA['org']->id])
            ->postJson("/notifications/{$notifId}/read")
            ->assertNotFound();

        // Student A marks it as read
        $this->actingAs($ctxA['student'])
            ->withSession(['current_organization_id' => $ctxA['org']->id])
            ->postJson("/notifications/{$notifId}/read")
            ->assertOk();

        $this->actingAs($ctxA['student'])
            ->withSession(['current_organization_id' => $ctxA['org']->id])
            ->getJson('/notifications')
            ->assertJsonPath('unread_count', 0);
    }

    public function test_private_channel_authorization_and_realtime_events(): void
    {
        $ctxA = $this->createOrgWithMembers();
        $ctxB = $this->createOrgWithMembers();
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $channels = Broadcast::getChannels();

        $userChannel = $channels['App.Models.User.{id}'];
        $this->assertTrue($userChannel($ctxA['student'], $ctxA['student']->id));
        $this->assertFalse($userChannel($ctxA['student'], $ctxB['student']->id));

        $orgUserChannel = $channels['org.{organizationId}.user.{userId}'];
        $this->assertTrue($orgUserChannel($ctxA['student'], $ctxA['org']->id, $ctxA['student']->id));
        $this->assertFalse($orgUserChannel($ctxA['student'], $ctxB['org']->id, $ctxA['student']->id));
        $this->assertFalse($orgUserChannel($ctxB['student'], $ctxA['org']->id, $ctxA['student']->id));

        $orgRoleChannel = $channels['org.{organizationId}.role.{role}'];
        $this->assertTrue($orgRoleChannel($ctxA['owner'], $ctxA['org']->id, 'owner'));
        $this->assertFalse($orgRoleChannel($ctxA['student'], $ctxA['org']->id, 'owner'));

        $platformChannel = $channels['platform.super-admin'];
        $this->assertTrue($platformChannel($superAdmin));
        $this->assertFalse($platformChannel($ctxA['owner']));

        Event::fake([NotificationCreated::class, LiveDomainUpdated::class]);
        $dispatcher = app(NotificationDispatcher::class);
        $dispatcher->toUsers($ctxA['student'], $ctxA['org']->id, 'academics', 'Live Test', 'Instant delivery');
        $dispatcher->broadcastDomainUpdate($ctxA['org']->id, 'academics', ['owner']);

        Event::assertDispatched(NotificationCreated::class, function (NotificationCreated $event) use ($ctxA) {
            return $event->userId === $ctxA['student']->id
                && $event->organizationId === $ctxA['org']->id
                && $event->broadcastWith()['title'] === 'Live Test';
        });
        Event::assertDispatched(LiveDomainUpdated::class);
    }

    public function test_notification_preferences_enforcement(): void
    {
        $ctx = $this->createOrgWithMembers();

        $this->actingAs($ctx['student'])
            ->withSession(['current_organization_id' => $ctx['org']->id])
            ->put('/notifications/preferences', [
                'preferences' => [
                    ['category' => 'announcements', 'in_app' => false, 'browser' => false, 'email' => false],
                    ['category' => 'fees', 'in_app' => false, 'browser' => true, 'email' => false],
                ],
            ])
            ->assertRedirect();

        $dispatcher = app(NotificationDispatcher::class);

        // Non-critical announcement should be suppressed when in_app = false
        $dispatcher->toUsers($ctx['student'], $ctx['org']->id, 'announcements', 'Suppressed', 'Should not save', isCritical: false);
        $this->assertSame(0, $ctx['student']->notifications()->where('category', 'announcements')->count());

        // Critical fee notification MUST still be delivered in-app
        $dispatcher->toUsers($ctx['student'], $ctx['org']->id, 'fees', 'Critical Overdue', 'Must deliver', isCritical: true);
        $this->assertSame(1, $ctx['student']->notifications()->where('category', 'fees')->count());
    }

    public function test_delete_read_all_and_category_status_filters_and_scope_key_uniqueness(): void
    {
        $ctxA = $this->createOrgWithMembers();
        $ctxB = $this->createOrgWithMembers();

        OrganizationUser::create([
            'organization_id' => $ctxB['org']->id,
            'user_id' => $ctxA['student']->id,
            'role' => 'student',
            'status' => 'active',
        ]);

        $dispatcher = app(NotificationDispatcher::class);
        $dispatcher->toUsers($ctxA['student'], $ctxA['org']->id, 'fees', 'Fee Item', 'Fee msg');
        $dispatcher->toUsers($ctxA['student'], $ctxA['org']->id, 'attendance', 'Att Item', 'Att msg');
        $dispatcher->toUsers($ctxA['student'], $ctxB['org']->id, 'fees', 'Org B Fee', 'Should stay unread');

        // Filter by category=fees and status=unread
        $this->actingAs($ctxA['student'])
            ->withSession(['current_organization_id' => $ctxA['org']->id])
            ->get('/notifications?category=fees&status=unread')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('notifications/index')
                ->has('notificationsList.data', 1)
                ->where('notificationsList.data.0.category', 'fees')
                ->where('unreadCount', 2)
            );

        // Mark all as read in Org A only
        $this->actingAs($ctxA['student'])
            ->withSession(['current_organization_id' => $ctxA['org']->id])
            ->postJson('/notifications/read-all')
            ->assertOk();

        $this->assertSame(0, $ctxA['student']->unreadNotifications()->where('organization_id', $ctxA['org']->id)->count());
        $this->assertSame(1, $ctxA['student']->unreadNotifications()->where('organization_id', $ctxB['org']->id)->count());

        // Filter status=read
        $this->actingAs($ctxA['student'])
            ->withSession(['current_organization_id' => $ctxA['org']->id])
            ->get('/notifications?status=read')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('notificationsList.data', 2));

        // Delete notification (cross-user blocked with 404, owner succeeds)
        $notifId = $ctxA['student']->notifications()->where('organization_id', $ctxA['org']->id)->first()->id;
        $this->actingAs($ctxB['student'])
            ->withSession(['current_organization_id' => $ctxA['org']->id])
            ->deleteJson("/notifications/{$notifId}")
            ->assertNotFound();

        $this->actingAs($ctxA['student'])
            ->withSession(['current_organization_id' => $ctxA['org']->id])
            ->deleteJson("/notifications/{$notifId}")
            ->assertOk();

        $this->assertSame(1, $ctxA['student']->notifications()->where('organization_id', $ctxA['org']->id)->count());

        // Nullable organization_id (platform scope) preference uniqueness
        NotificationPreference::upsertPreference($ctxA['student']->id, null, 'announcements', true, false, false);
        NotificationPreference::upsertPreference($ctxA['student']->id, null, 'announcements', false, true, false);
        $this->assertSame(
            1,
            NotificationPreference::where('user_id', $ctxA['student']->id)
                ->whereNull('organization_id')
                ->where('scope_key', 'platform')
                ->where('category', 'announcements')
                ->count()
        );
    }

    public function test_platform_announcement_and_timetable_cancel_delete_and_mail_config(): void
    {
        $ctx = $this->createOrgWithMembers();
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        // 1. Platform announcement publish -> platform scope only
        $announcement = \App\Models\PlatformAnnouncement::create([
            'title' => 'Scheduled Maintenance',
            'content' => 'System upgrade tonight at 11 PM UTC.',
            'type' => 'info',
            'target_audience' => 'all',
            'is_published' => false,
            'created_by' => $superAdmin->id,
        ]);

        $this->actingAs($superAdmin)
            ->post(route('platform-admin.announcements.publish', $announcement->id))
            ->assertRedirect();

        $this->assertSame(1, $superAdmin->notifications()->where('scope', 'platform')->count());
        // Must NOT leak into org-scoped notifications
        $this->actingAs($ctx['student'])
            ->withSession(['current_organization_id' => $ctx['org']->id])
            ->getJson('/notifications')
            ->assertJsonPath('unread_count', 0);

        // Super admin platform notification center works
        $this->actingAs($superAdmin)
            ->get('/platform-admin/notifications')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('notifications/index')
                ->where('isPlatformScope', true)
                ->has('notificationsList.data', 1)
            );

        // 2. Timetable cancellation & deletion notifications
        $timetable = Timetable::create([
            'organization_id' => $ctx['org']->id,
            'academic_year_id' => $ctx['year']->id,
            'school_class_id' => $ctx['class']->id,
            'class_section_id' => $ctx['section']->id,
            'title' => 'Main Schedule',
            'is_published' => true,
        ]);

        $entry = TimetableEntry::create([
            'organization_id' => $ctx['org']->id,
            'timetable_id' => $timetable->id,
            'academic_year_id' => $ctx['year']->id,
            'school_class_id' => $ctx['class']->id,
            'class_section_id' => $ctx['section']->id,
            'subject_id' => $ctx['subject']->id,
            'teacher_id' => $ctx['teacher']->id,
            'day_of_week' => 'tuesday',
            'period_name' => 'Period 1',
            'start_time' => '09:00:00',
            'end_time' => '09:45:00',
            'is_published' => true,
            'is_cancelled' => false,
        ]);

        $this->actingAs($ctx['owner'])
            ->put(route('school.timetable.update', $entry->id), [
                'academic_year_id' => $ctx['year']->id,
                'school_class_id' => $ctx['class']->id,
                'class_section_id' => $ctx['section']->id,
                'subject_id' => $ctx['subject']->id,
                'teacher_id' => $ctx['teacher']->id,
                'day_of_week' => 'tuesday',
                'start_time' => '09:00',
                'end_time' => '09:45',
                'is_published' => true,
                'is_cancelled' => true,
            ])
            ->assertRedirect();

        $this->assertTrue(
            $ctx['teacher']->notifications()->where('category', 'timetable')->where('data->title', 'like', 'Period Cancelled%')->exists()
        );

        $this->actingAs($ctx['owner'])
            ->delete(route('school.timetable.destroy', $entry->id))
            ->assertRedirect();

        $this->assertSame(2, $ctx['teacher']->notifications()->where('category', 'timetable')->count());

        // 3. Mail channel only dispatches when non-log mailer is configured and user enables email
        NotificationPreference::upsertPreference($ctx['student']->id, $ctx['org']->id, 'fees', true, false, true);
        Notification::fake();
        config(['mail.default' => 'log']);
        $notif = new LmsNotification('fees', 'Fee Notice', 'Msg', $ctx['org']->id, 'organization', '/school/my-fees');
        $this->assertNotContains('mail', $notif->via($ctx['student']));

        config(['mail.default' => 'array']);
        $this->assertContains('mail', $notif->via($ctx['student']));
    }

    public function test_broadcasting_auth_http_endpoint_and_csrf_meta_and_timezone_local_hour(): void
    {
        $ctx = $this->createOrgWithMembers('America/New_York');

        // Login page includes CSRF meta tag for Echo
        $this->get('/login')->assertOk()->assertSee('<meta name="csrf-token"', false);

        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'test-key',
            'broadcasting.connections.reverb.secret' => 'test-secret',
            'broadcasting.connections.reverb.app_id' => '123',
        ]);
        app(\Illuminate\Contracts\Broadcasting\Factory::class)->forgetDrivers();
        require base_path('routes/channels.php');

        // Unauthenticated /broadcasting/auth is rejected (403)
        $this->postJson('/broadcasting/auth', [
            'socket_id' => '1234.5678',
            'channel_name' => "private-org.{$ctx['org']->id}.user.{$ctx['student']->id}",
        ])->assertStatus(403);

        // Authenticated user on own org channel succeeds (200)
        $this->actingAs($ctx['student'])
            ->postJson('/broadcasting/auth', [
                'socket_id' => '1234.5678',
                'channel_name' => "private-org.{$ctx['org']->id}.user.{$ctx['student']->id}",
            ])
            ->assertOk();

        // Cross-user private channel is forbidden (403)
        $this->actingAs($ctx['otherParent'])
            ->postJson('/broadcasting/auth', [
                'socket_id' => '1234.5678',
                'channel_name' => "private-org.{$ctx['org']->id}.user.{$ctx['student']->id}",
            ])
            ->assertForbidden();

        // FeeReminderService local-hour check respects organization timezone
        Carbon::setTestNow(Carbon::create(2026, 11, 12, 10, 0, 0, 'UTC')); // 05:00 in America/New_York
        FeeInvoice::create([
            'organization_id' => $ctx['org']->id,
            'academic_year_id' => $ctx['year']->id,
            'school_class_id' => $ctx['class']->id,
            'class_section_id' => $ctx['section']->id,
            'student_id' => $ctx['student']->id,
            'invoice_number' => 'INV-TZ-001',
            'billing_month' => '2026-11-01',
            'issue_date' => '2026-11-01',
            'due_date' => '2026-11-12',
            'total_amount' => 100,
            'paid_amount' => 0,
            'balance_due' => 100,
            'status' => 'unpaid',
            'currency' => 'USD',
        ]);

        $service = app(FeeReminderService::class);
        $beforeEight = $service->processReminders($ctx['org']->id, false, 8);
        $this->assertSame(0, $beforeEight['invoices_scanned']);

        Carbon::setTestNow(Carbon::create(2026, 11, 12, 13, 5, 0, 'UTC')); // 08:05 in America/New_York
        $atEight = $service->processReminders($ctx['org']->id, false, 8);
        $this->assertSame(1, $atEight['invoices_scanned']);
        Carbon::setTestNow();
    }
}
