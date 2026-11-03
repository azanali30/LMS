<?php

use App\Http\Controllers\Admin\AdminPaymentApprovalController;
use App\Http\Controllers\Auth\RegistrationJourneyController;
use App\Http\Controllers\Auth\SaaSOnboardingController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Learning\CourseController;
use App\Http\Controllers\Learning\LessonController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PublicController;
use App\Http\Controllers\SubscriptionBillingController;
use App\Http\Controllers\School\AttendanceController;
use App\Http\Controllers\School\ClassroomController;
use App\Http\Controllers\School\CurriculumController;
use App\Http\Controllers\School\FeeController;
use App\Http\Controllers\School\GradeController;
use App\Http\Controllers\School\StudentController;
use App\Http\Controllers\School\StudentFeeController;
use App\Http\Controllers\School\SubjectController;
use App\Http\Controllers\School\TimetableController;
use App\Http\Controllers\WorkspaceSetupController;
use Illuminate\Support\Facades\Route;

// Public Website Routes
Route::inertia('/', 'welcome')->name('home');
Route::get('/benefits', [PublicController::class, 'benefits'])->name('benefits');
Route::get('/pricing', [PublicController::class, 'pricing'])->name('pricing');
Route::get('/how-it-works', [PublicController::class, 'howItWorks'])->name('how-it-works');
Route::get('/about', [PublicController::class, 'about'])->name('about');
Route::get('/download', [PublicController::class, 'download'])->name('download');
Route::get('/contact', [PublicController::class, 'contact'])->name('contact');
Route::post('/contact', [PublicController::class, 'storeContact'])->name('contact.store');

Route::get('/courses', [CourseController::class, 'index'])->name('courses.index');
Route::get('/courses/{course:slug}', [CourseController::class, 'show'])->name('courses.show');

// Multi-step SaaS Registration & Manual Payment Approval Onboarding Flow
Route::get('/onboarding/status', [SaaSOnboardingController::class, 'status'])->name('onboarding.status');

Route::middleware('guest')->group(function () {
    Route::get('/register', [SaaSOnboardingController::class, 'show'])->name('register');
    Route::get('/onboarding', [SaaSOnboardingController::class, 'show'])->name('onboarding');
    Route::post('/onboarding/check-email', [SaaSOnboardingController::class, 'checkEmail'])->name('onboarding.check-email');
    Route::post('/onboarding/save-progress', [SaaSOnboardingController::class, 'saveProgress'])->name('onboarding.save-progress');
    Route::post('/onboarding/reset-draft', [SaaSOnboardingController::class, 'resetDraft'])->name('onboarding.reset-draft');
    Route::post('/onboarding/submit-payment', [SaaSOnboardingController::class, 'submitPayment'])->name('onboarding.submit-payment');

    // Post-Approval Account & Institution Setup (single-use token)
    Route::get('/onboarding/complete/{token}', [SaaSOnboardingController::class, 'showComplete'])->name('onboarding.complete.show');
    Route::post('/onboarding/complete/{token}', [SaaSOnboardingController::class, 'storeComplete'])->name('onboarding.complete.store');

    // Preserved alternate journeys (Invitation join & self-paced learner)
    Route::post('/register/school', [RegistrationJourneyController::class, 'registerSchool'])->name('register.school');
    Route::post('/register/join', [RegistrationJourneyController::class, 'registerJoin'])->name('register.join');
    Route::post('/register/learner', [RegistrationJourneyController::class, 'registerLearner'])->name('register.learner');
});

// Public/Guest & Authenticated Invitation Acceptance
Route::get('invitations/{token}', [OrganizationController::class, 'acceptInvite'])->name('invitations.accept');
Route::get('organizations/invitations/{token}/accept', fn (string $token) => redirect()->route('invitations.accept', ['token' => $token]));

// Authenticated Routes
Route::middleware(['auth'])->group(function () {
    // Instant Email Verification Shortcut
    Route::match(['GET', 'POST'], 'email/verify-instant', function (\Illuminate\Http\Request $request) {
        $request->user()?->markEmailAsVerified();
        return redirect()->route('dashboard')->with('success', 'Email verified successfully! Welcome to your dashboard.');
    })->name('verification.instant');

    // Role-tailored Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Post-Registration Workspace Setup Wizard
    Route::get('workspace/setup', [WorkspaceSetupController::class, 'index'])->name('workspace.setup');
    Route::post('workspace/setup', [WorkspaceSetupController::class, 'store'])->name('workspace.setup.store');
    Route::get('workspace/setup/check-slug', [WorkspaceSetupController::class, 'checkSlug'])->name('workspace.setup.check-slug');

    // Organization Management & Onboarding
    Route::prefix('organizations')->name('organizations.')->group(function () {
        Route::get('create', [WorkspaceSetupController::class, 'index'])->name('create');
        Route::post('/', [WorkspaceSetupController::class, 'store'])->name('store');
        Route::post('{organization}/switch', [OrganizationController::class, 'switch'])->name('switch');
        Route::get('settings', [OrganizationController::class, 'settings'])->name('settings');
        Route::put('settings', [OrganizationController::class, 'updateSettings'])->name('settings.update');
        Route::get('members', [OrganizationController::class, 'members'])->name('members');
        Route::post('members/invite', [OrganizationController::class, 'invite'])->name('invite');
        Route::post('members/direct', [OrganizationController::class, 'storeMemberDirect'])->name('members.direct');
        Route::put('members/{member}', [OrganizationController::class, 'updateMember'])->name('members.update');
        Route::delete('members/{member}', [OrganizationController::class, 'destroyMember'])->name('members.destroy');
        Route::delete('invitations/{invitation}', [OrganizationController::class, 'destroyInvitation'])->name('invitations.destroy');
    });

    // SaaS Subscription & Billing (Owner / Platform Admin)
    Route::prefix('organizations/billing')->name('organizations.billing.')->group(function () {
        Route::get('/', [SubscriptionBillingController::class, 'index'])->name('index');
        Route::post('invoice', [SubscriptionBillingController::class, 'requestManualInvoice'])->name('invoice.request');
        Route::post('plan', [SubscriptionBillingController::class, 'changePlan'])->name('plan.change');
        Route::post('cancel', [SubscriptionBillingController::class, 'cancel'])->name('cancel');
        Route::post('dev-trial-activate', [SubscriptionBillingController::class, 'devTrialActivate'])->name('dev-trial-activate');
    });
    Route::prefix('billing')->name('billing.')->group(function () {
        Route::get('/', [SubscriptionBillingController::class, 'index'])->name('index');
        Route::post('change-plan', [SubscriptionBillingController::class, 'changePlan'])->name('change-plan');
        Route::post('cancel', [SubscriptionBillingController::class, 'cancel'])->name('cancel');
        Route::post('dev-trial-activate', [SubscriptionBillingController::class, 'devTrialActivate'])->name('dev-trial-activate');
    });

    // Platform Super Admin Routes
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('dashboard', [DashboardController::class, 'superAdminDashboardRoute'])->name('dashboard');
        Route::get('payment-approvals', [AdminPaymentApprovalController::class, 'index'])->name('payment-approvals.index');
        Route::get('payment-approvals/{id}/receipt', [AdminPaymentApprovalController::class, 'downloadReceipt'])->name('payment-approvals.receipt');
        Route::post('payment-approvals/{id}/approve', [AdminPaymentApprovalController::class, 'approve'])->name('payment-approvals.approve');
        Route::post('payment-approvals/{id}/reject', [AdminPaymentApprovalController::class, 'reject'])->name('payment-approvals.reject');
        Route::post('subscriptions/invoices/{invoice}/verify', [SubscriptionBillingController::class, 'adminVerifyPayment'])->name('subscriptions.invoices.verify');
    });

    // School Management Module (Tenant-scoped)
    Route::prefix('school')->name('school.')->group(function () {
        // Classes & Sections
        Route::get('classes', [ClassroomController::class, 'index'])->name('classes.index');
        Route::post('classes', [ClassroomController::class, 'store'])->name('classes.store');
        Route::put('classes/{class}', [ClassroomController::class, 'update'])->name('classes.update');
        Route::delete('classes/{class}', [ClassroomController::class, 'destroy'])->name('classes.destroy');
        Route::post('classes/{class}/sections', [ClassroomController::class, 'storeSection'])->name('classes.sections.store');
        Route::get('sections', [ClassroomController::class, 'sectionsIndex'])->name('sections.index');
        Route::post('sections', [ClassroomController::class, 'storeDirectSection'])->name('sections.store');
        Route::put('sections/{section}', [ClassroomController::class, 'updateSection'])->name('sections.update');
        Route::delete('sections/{section}', [ClassroomController::class, 'destroySection'])->name('sections.destroy');

        // Subjects & Teacher Assignments
        Route::get('subjects', [SubjectController::class, 'index'])->name('subjects.index');
        Route::post('subjects', [SubjectController::class, 'store'])->name('subjects.store');
        Route::put('subjects/{subject}', [SubjectController::class, 'update'])->name('subjects.update');
        Route::delete('subjects/{subject}', [SubjectController::class, 'destroy'])->name('subjects.destroy');
        Route::post('subjects/assign', [SubjectController::class, 'assignTeacher'])->name('subjects.assign');
        Route::post('subjects/assign-teacher', [SubjectController::class, 'assignTeacher'])->name('subjects.assign-teacher');
        Route::delete('subjects/assignments/{assignment}', [SubjectController::class, 'destroyAssignment'])->name('subjects.assignments.destroy');

        // Curriculum / Syllabus Builder
        Route::get('subjects/{subject}/curriculum', [CurriculumController::class, 'show'])->name('subjects.curriculum.show');
        Route::post('subjects/{subject}/curriculum', [CurriculumController::class, 'store'])->name('subjects.curriculum.store');
        Route::put('curriculums/{curriculum}', [CurriculumController::class, 'update'])->name('curriculums.update');
        Route::post('curriculums/{curriculum}/units', [CurriculumController::class, 'storeUnit'])->name('curriculums.units.store');
        Route::put('curriculums/units/{unit}', [CurriculumController::class, 'updateUnit'])->name('curriculums.units.update');
        Route::delete('curriculums/units/{unit}', [CurriculumController::class, 'destroyUnit'])->name('curriculums.units.destroy');
        Route::post('curriculums/units/{unit}/topics', [CurriculumController::class, 'storeTopic'])->name('curriculums.topics.store');
        Route::put('curriculums/topics/{topic}', [CurriculumController::class, 'updateTopic'])->name('curriculums.topics.update');
        Route::delete('curriculums/topics/{topic}', [CurriculumController::class, 'destroyTopic'])->name('curriculums.topics.destroy');
        Route::post('curriculums/topics/{topic}/progress', [CurriculumController::class, 'updateProgress'])->name('curriculums.topics.progress');

        // Timetable & Weekly Schedules
        Route::get('timetable', [TimetableController::class, 'index'])->name('timetable.index');
        Route::post('timetable', [TimetableController::class, 'store'])->name('timetable.store');
        Route::put('timetable/{entry}', [TimetableController::class, 'update'])->name('timetable.update');
        Route::delete('timetable/{entry}', [TimetableController::class, 'destroy'])->name('timetable.destroy');
        Route::post('timetable/publish', [TimetableController::class, 'publishSectionTimetable'])->name('timetable.publish');

        // Students & Admission Management
        Route::get('students', [StudentController::class, 'index'])->name('students.index');
        Route::get('students/create', [StudentController::class, 'create'])->name('students.create');
        Route::post('students', [StudentController::class, 'store'])->name('students.store');
        Route::get('students/{student}', [StudentController::class, 'show'])->name('students.show');
        Route::put('students/{enrollment}', [StudentController::class, 'update'])->name('students.update');
        Route::delete('students/{enrollment}', [StudentController::class, 'destroy'])->name('students.destroy');
        Route::get('students/{student}/documents/{document}/download', [StudentController::class, 'downloadDocument'])->name('students.documents.download');

        // Attendance
        Route::get('attendance', [AttendanceController::class, 'index'])->name('attendance.index');
        Route::post('attendance', [AttendanceController::class, 'store'])->name('attendance.store');
        Route::post('attendance/substitutes', [AttendanceController::class, 'storeSubstitute'])->name('attendance.substitutes.store');

        // Assessments & Grading
        Route::get('grades', [GradeController::class, 'index'])->name('grades.index');
        Route::post('grades/assessments', [GradeController::class, 'storeAssessment'])->name('grades.assessments.store');
        Route::post('grades/{assessment}', [GradeController::class, 'storeGrades'])->name('grades.store');
        Route::post('grades/assessments/{assessment}', [GradeController::class, 'storeGrades']);

        // Student Fee Portal
        Route::get('my-fees', [StudentFeeController::class, 'index'])->name('my-fees');

        // Institutional Fee Management & Billing (Owner/Admin)
        Route::get('fees', [FeeController::class, 'index'])->name('fees.index');
        Route::post('fees/class-structure', [FeeController::class, 'storeClassStructure'])->name('fees.class-structure.store');
        Route::post('fees/structures', [FeeController::class, 'storeClassStructure']);
        Route::post('fees/preview', [FeeController::class, 'previewGeneration'])->name('fees.preview');
        Route::post('fees/generate', [FeeController::class, 'generateInvoices'])->name('fees.generate');
        Route::post('fees/invoices/{invoice}/payments', [FeeController::class, 'recordPayment'])->name('fees.payments.store');
        Route::get('fees/export', [FeeController::class, 'export'])->name('fees.export');
        Route::post('fees/reminders/trigger', [FeeController::class, 'triggerReminders'])->name('fees.reminders.trigger');

        // Printable / Downloadable Fee Documents
        Route::get('fees/invoices/{invoice}/download', [FeeController::class, 'downloadInvoice'])->name('fees.invoices.download');
        Route::get('fees/payments/{payment}/download', [FeeController::class, 'downloadReceipt'])->name('fees.payments.download');
        Route::get('fees/payments/{payment}/receipt', [FeeController::class, 'downloadReceipt'])->name('fees.payments.receipt');
    });

    // In-App Notification Center
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    // Online Learning Actions & LMS Routes
    Route::prefix('learning')->group(function () {
        Route::get('courses', [CourseController::class, 'dashboardIndex'])->name('learning.courses.index');
        Route::get('courses/{course:slug}', [CourseController::class, 'show'])->name('learning.courses.show');
        Route::post('courses', [CourseController::class, 'store'])->name('learning.courses.store');
        Route::put('courses/{course}', [CourseController::class, 'update'])->name('learning.courses.update');
        Route::delete('courses/{course}', [CourseController::class, 'destroy'])->name('learning.courses.destroy');
        Route::post('courses/{course}/enroll', [CourseController::class, 'enroll'])->name('learning.courses.enroll');
        Route::get('courses/{course:slug}/lessons/{lesson:slug}', [LessonController::class, 'show'])->name('learning.lessons.show');
        Route::post('courses/{course}/lessons/{lesson}/complete', [LessonController::class, 'complete'])->name('learning.lessons.complete');
        Route::post('courses/{course}/modules', [CourseController::class, 'storeModule'])->name('learning.courses.modules.store');
        Route::delete('modules/{module}', [CourseController::class, 'destroyModule'])->name('learning.modules.destroy');
        Route::post('modules/{module}/lessons', [CourseController::class, 'storeLesson'])->name('learning.modules.lessons.store');
        Route::delete('lessons/{lesson}', [CourseController::class, 'destroyLesson'])->name('learning.lessons.destroy');
    });

    Route::post('courses', [CourseController::class, 'store'])->name('courses.store');
    Route::put('courses/{course}', [CourseController::class, 'update'])->name('courses.update');
    Route::delete('courses/{course}', [CourseController::class, 'destroy'])->name('courses.destroy');
    Route::post('courses/{course}/enroll', [CourseController::class, 'enroll'])->name('courses.enroll');
    Route::get('courses/{course:slug}/lessons/{lesson:slug}', [LessonController::class, 'show'])->name('lessons.show');
    Route::post('courses/{course}/lessons/{lesson}/complete', [LessonController::class, 'complete'])->name('lessons.complete');
});

require __DIR__.'/settings.php';
