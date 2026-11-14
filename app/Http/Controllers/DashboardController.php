<?php

namespace App\Http\Controllers;

use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\Attendance;
use App\Models\ClassSection;
use App\Models\ClassSubjectTeacher;
use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\Grade;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\ParentStudent;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\SubscriptionPlan;
use App\Models\TimetableEntry;
use App\Models\User;
use App\Services\AttendanceAuthorizationService;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the appropriate role-based dashboard.
     */
    public function index(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        // Check if there is a pending invitation acceptance awaiting after login
        if ($pendingToken = $request->session()->pull('pending_invitation_token')) {
            return redirect()->route('invitations.accept', ['token' => $pendingToken]);
        }

        // 1. Super Admin Platform Dashboard -> Redirect to dedicated Platform Admin Portal when not in a tenant context
        if ($user->isSuperAdmin() && !TenantContext::check()) {
            return redirect()->route('platform-admin.dashboard');
        }

        $organization = TenantContext::current();

        // 2. User has no active organizations yet
        if (! $organization) {
            $hasActiveOrg = $user->organizations()
                ->where('organizations.status', 'active')
                ->wherePivot('status', 'active')
                ->exists();

            if (! $hasActiveOrg) {
                // If explicitly navigating as individual learner or registered via learner journey
                if ($user->role === 'learner' || $request->session()->get('is_learner') || $request->query('view') === 'learner') {
                    return $this->individualLearnerDashboard($user);
                }

                // If user already has active course enrollments as a self-paced learner
                if (CourseEnrollment::where('user_id', $user->id)->exists()) {
                    return $this->individualLearnerDashboard($user);
                }

                // Otherwise, guide newly registered user to create their school/academy workspace
                return redirect()->route('workspace.setup');
            }

            // User belongs to an active org but session was unset, try setting first active
            $firstOrg = $user->organizations()
                ->where('organizations.status', 'active')
                ->wherePivot('status', 'active')
                ->first();

            if ($firstOrg) {
                TenantContext::set($firstOrg);
                $request->session()->put('current_organization_id', $firstOrg->id);
                $organization = $firstOrg;
            } else {
                return redirect()->route('workspace.setup');
            }
        }

        $role = TenantContext::currentRole($user);

        // 3. Render appropriate tenant dashboard based on organization membership role
        return match ($role) {
            'owner', 'admin' => $this->adminDashboard($organization),
            'teacher' => $this->teacherDashboard($organization, $user),
            'student' => $this->studentDashboard($organization, $user),
            'parent' => $this->parentDashboard($organization, $user),
            default => $this->studentDashboard($organization, $user),
        };
    }

    /**
     * Platform-level Super Admin Dashboard.
     */
    public function superAdminDashboardRoute(Request $request): \Illuminate\Http\RedirectResponse
    {
        abort_unless($request->user()?->isSuperAdmin(), 403, 'Unauthorized. Platform administrator privileges required.');
        return redirect()->route('platform-admin.dashboard');
    }

    /**
     * Platform-level Super Admin Dashboard.
     */
    private function superAdminDashboard(): Response
    {
        return TenantContext::bypass(function () {
            $totalOrganizations = Organization::count();
            $activeOrganizations = Organization::where('status', 'active')->count();
            $totalUsers = User::count();
            $totalCourses = Course::count();
            $totalEnrollments = CourseEnrollment::count();
            $pendingApprovals = \App\Models\PaymentApprovalRequest::where('status', \App\Models\PaymentApprovalRequest::STATUS_PENDING)->count();

            $organizations = Organization::withCount(['members', 'courses'])
                ->latest()
                ->take(10)
                ->get();

            $plans = SubscriptionPlan::withCount('subscriptions')->get();

            return Inertia::render('admin/dashboard-super', [
                'metrics' => [
                    'totalOrganizations' => $totalOrganizations,
                    'activeOrganizations' => $activeOrganizations,
                    'totalUsers' => $totalUsers,
                    'totalCourses' => $totalCourses,
                    'totalEnrollments' => $totalEnrollments,
                    'pendingApprovals' => $pendingApprovals,
                ],
                'organizations' => $organizations,
                'plans' => $plans,
            ]);
        });
    }

    /**
     * Organization Owner / Admin Dashboard.
     */
    private function adminDashboard(Organization $organization): Response
    {
        $memberCounts = rescue(fn () => OrganizationUser::where('organization_id', $organization->id)
            ->selectRaw("
                SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as students_count,
                SUM(CASE WHEN role = 'teacher' THEN 1 ELSE 0 END) as teachers_count
            ")
            ->first(), null, false);

        $totalStudents = (int) ($memberCounts->students_count ?? 0);
        $totalTeachers = (int) ($memberCounts->teachers_count ?? 0);

        $totalClasses = rescue(fn () => SchoolClass::where('organization_id', $organization->id)->count(), 0, false);
        $totalSections = rescue(fn () => ClassSection::where('organization_id', $organization->id)->count(), 0, false);
        $totalCourses = rescue(fn () => Course::where('organization_id', $organization->id)->count(), 0, false);

        $attendanceRate = rescue(function () use ($organization) {
            $stats = Attendance::where('organization_id', $organization->id)
                ->whereDate('date', now()->toDateString())
                ->selectRaw("
                    COUNT(*) as total_marked,
                    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present_count
                ")
                ->first();

            $totalMarked = (int) ($stats->total_marked ?? 0);
            $presentCount = (int) ($stats->present_count ?? 0);

            return $totalMarked > 0 ? round(($presentCount / $totalMarked) * 100, 1) : 100.0;
        }, 100.0, false);

        $recentMembers = rescue(fn () => OrganizationUser::with('user:id,name,email')
            ->where('organization_id', $organization->id)
            ->latest()
            ->take(6)
            ->get(), collect(), false);

        $recentCourses = rescue(fn () => Course::with('category')
            ->where('organization_id', $organization->id)
            ->latest()
            ->take(4)
            ->get(), collect(), false);

        $currentAcademicYear = rescue(fn () => AcademicYear::where('organization_id', $organization->id)
            ->where('is_current', true)
            ->first(), null, false);

        return Inertia::render('tenant/dashboard-admin', [
            'metrics' => [
                'totalStudents' => $totalStudents,
                'totalTeachers' => $totalTeachers,
                'totalClasses' => $totalClasses,
                'totalSections' => $totalSections,
                'totalCourses' => $totalCourses,
                'attendanceRate' => $attendanceRate,
            ],
            'recentMembers' => $recentMembers,
            'recentCourses' => $recentCourses,
            'currentAcademicYear' => $currentAcademicYear,
        ]);
    }

    /**
     * Teacher Dashboard with real database-backed metrics, timetable schedule, and action items.
     */
    private function teacherDashboard(Organization $organization, User $user): Response
    {
        $authService = app(AttendanceAuthorizationService::class);
        $todayDate = now()->toDateString();
        $dayOfWeek = strtolower(now()->format('l'));
        $currentTime = now()->format('H:i:s');

        // 1. Assigned cohorts (Classes and Sections)
        $assignedSectionIds = ClassSubjectTeacher::where('organization_id', $organization->id)
            ->where('teacher_id', $user->id)
            ->pluck('class_section_id')
            ->merge(
                TimetableEntry::where('organization_id', $organization->id)
                    ->where('teacher_id', $user->id)
                    ->pluck('class_section_id')
            )
            ->unique()
            ->filter()
            ->values();

        $assignedClasses = ClassSection::with(['schoolClass', 'studentEnrollments' => fn ($q) => $q->where('status', 'active')])
            ->where('organization_id', $organization->id)
            ->whereIn('id', $assignedSectionIds)
            ->get()
            ->map(fn ($sec) => [
                'id' => $sec->id,
                'name' => $sec->name,
                'room' => $sec->room,
                'capacity' => $sec->capacity,
                'enrolled_count' => $sec->studentEnrollments->count(),
                'school_class' => [
                    'id' => $sec->schoolClass?->id,
                    'name' => $sec->schoolClass?->name ?? 'Class',
                    'code' => $sec->schoolClass?->code,
                ],
            ]);

        // 2. Today's assigned periods / timetable schedule
        $todayPeriods = TimetableEntry::with(['schoolClass', 'classSection', 'subject'])
            ->where('organization_id', $organization->id)
            ->where('teacher_id', $user->id)
            ->where('day_of_week', $dayOfWeek)
            ->where('is_published', true)
            ->orderBy('start_time', 'asc')
            ->get();

        $isPeriodWise = ($organization->attendance_mode ?? 'daily_first_period') === 'period_wise';

        $todaySchedule = $todayPeriods->map(function ($period) use ($organization, $user, $todayDate, $currentTime, $authService, $isPeriodWise) {
            $status = 'scheduled';
            if ($currentTime > $period->end_time) {
                $status = 'completed';
            } elseif ($currentTime >= $period->start_time && $currentTime <= $period->end_time) {
                $status = 'current';
            } else {
                $status = 'upcoming';
            }

            $isAttendanceMarked = Attendance::where('organization_id', $organization->id)
                ->where('class_section_id', $period->class_section_id)
                ->whereDate('date', $todayDate)
                ->when($isPeriodWise, fn ($q) => $q->where('timetable_entry_id', $period->id))
                ->exists();

            $canMarkAttendance = $authService->isAuthorized(
                $user,
                $organization,
                $period->class_section_id,
                $todayDate,
                $isPeriodWise ? $period->id : null
            );

            return [
                'id' => $period->id,
                'start_time' => substr($period->start_time, 0, 5),
                'end_time' => substr($period->end_time, 0, 5),
                'subject' => $period->subject?->name ?? 'Subject',
                'class_name' => $period->schoolClass?->name ?? 'Class',
                'section_name' => $period->classSection?->name ?? 'Section',
                'class_section_id' => $period->class_section_id,
                'room' => $period->room ?: $period->classSection?->room,
                'period_name' => $period->period_name ?: 'Period',
                'status' => $status,
                'attendance_marked' => $isAttendanceMarked,
                'can_mark_attendance' => $canMarkAttendance,
            ];
        });

        // 3. Upcoming / Next Class
        $nextClass = $todaySchedule->first(fn ($item) => in_array($item['status'], ['current', 'upcoming'], true));

        // 4. Attendance Tasks requiring action
        $allAttendanceTasks = $authService->getAuthorizedAttendanceTasks($user, $organization, $todayDate);
        $pendingAttendanceTasks = $allAttendanceTasks->where('is_submitted', false)->values();

        // 5. Pending Grading Tasks
        $teacherAssessments = Assessment::with(['classSection.schoolClass', 'subject', 'grades'])
            ->where('organization_id', $organization->id)
            ->whereIn('class_section_id', $assignedSectionIds)
            ->latest()
            ->take(8)
            ->get();

        $pendingGradingTasks = $teacherAssessments->map(function ($assessment) use ($organization) {
            $totalStudents = StudentEnrollment::where('organization_id', $organization->id)
                ->where('class_section_id', $assessment->class_section_id)
                ->where('status', 'active')
                ->count();

            $gradedCount = $assessment->grades->count();
            $ungradedCount = max(0, $totalStudents - $gradedCount);

            return [
                'id' => $assessment->id,
                'title' => $assessment->title,
                'type' => $assessment->type,
                'due_date' => $assessment->due_date ? Carbon::parse($assessment->due_date)->format('M d, Y') : null,
                'class_name' => $assessment->classSection?->schoolClass?->name ?? 'Class',
                'section_name' => $assessment->classSection?->name ?? 'Section',
                'subject_name' => $assessment->subject?->name ?? 'Subject',
                'total_students' => $totalStudents,
                'graded_count' => $gradedCount,
                'ungraded_count' => $ungradedCount,
                'is_pending' => $ungradedCount > 0,
            ];
        })->filter(fn ($t) => $t['is_pending'])->values();

        // 6. Recent Grades recorded by this teacher
        $recentGradesGiven = Grade::where('organization_id', $organization->id)
            ->where('graded_by', $user->id)
            ->with(['student', 'assessment.subject', 'assessment.classSection.schoolClass'])
            ->latest()
            ->take(6)
            ->get();

        // 7. Teacher Courses
        $teacherCourses = Course::where('organization_id', $organization->id)
            ->where('instructor_id', $user->id)
            ->withCount('enrollments')
            ->get();

        // 8. Unique students across teacher's assigned classes (avoid duplicate counts)
        $uniqueStudentsCount = StudentEnrollment::where('organization_id', $organization->id)
            ->whereIn('class_section_id', $assignedSectionIds)
            ->where('status', 'active')
            ->distinct('student_id')
            ->count('student_id');

        // 9. Real Attendance Rate Today
        $todayAttendanceQuery = Attendance::where('organization_id', $organization->id)
            ->whereIn('class_section_id', $assignedSectionIds)
            ->whereDate('date', $todayDate);

        $totalRecordsToday = (clone $todayAttendanceQuery)->count();
        $presentRecordsToday = (clone $todayAttendanceQuery)->whereIn('status', ['present', 'late'])->count();
        $attendanceTodayRate = $totalRecordsToday > 0 ? (int) round(($presentRecordsToday / $totalRecordsToday) * 100) : null;

        // 10. Weekly Attendance Breakdown (Mon - Sun)
        $startOfWeek = now()->startOfWeek(Carbon::MONDAY);
        $weeklyAttendance = [];
        $daysOfWeekNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        for ($i = 0; $i < 7; $i++) {
            $loopDate = $startOfWeek->copy()->addDays($i)->toDateString();
            $dayAttendanceQuery = Attendance::where('organization_id', $organization->id)
                ->whereIn('class_section_id', $assignedSectionIds)
                ->whereDate('date', $loopDate);

            $dayTotal = (clone $dayAttendanceQuery)->count();
            $dayPresent = (clone $dayAttendanceQuery)->whereIn('status', ['present', 'late'])->count();
            $dayRate = $dayTotal > 0 ? (int) round(($dayPresent / $dayTotal) * 100) : 0;

            $weeklyAttendance[] = [
                'day' => $daysOfWeekNames[$i],
                'date' => $loopDate,
                'rate' => $dayRate,
                'total' => $dayTotal,
            ];
        }

        // 11. Real Recent Activity
        $recentActivities = collect();
        $recentAttendances = Attendance::where('organization_id', $organization->id)
            ->whereIn('class_section_id', $assignedSectionIds)
            ->with(['classSection.schoolClass'])
            ->latest()
            ->take(3)
            ->get();

        foreach ($recentAttendances as $att) {
            $recentActivities->push([
                'id' => 'att_' . $att->id,
                'title' => 'Marked attendance for ' . ($att->classSection?->schoolClass?->name ?? 'Class') . ' ' . ($att->classSection?->name ?? ''),
                'time' => $att->created_at ? $att->created_at->diffForHumans() : 'Recently',
                'created_at_ts' => $att->created_at?->timestamp ?? 0,
                'type' => 'attendance',
            ]);
        }

        foreach ($recentGradesGiven->take(3) as $rg) {
            $recentActivities->push([
                'id' => 'grd_' . $rg->id,
                'title' => 'Added grades for ' . ($rg->assessment?->subject?->name ?? 'Assessment'),
                'time' => $rg->created_at ? $rg->created_at->diffForHumans() : 'Recently',
                'created_at_ts' => $rg->created_at?->timestamp ?? 0,
                'type' => 'grade',
            ]);
        }

        $recentActivities = $recentActivities->sortByDesc('created_at_ts')->values()->take(5);

        return Inertia::render('tenant/dashboard-teacher', [
            'metrics' => [
                'assignedClassesCount' => $assignedClasses->count(),
                'todayPeriodsCount' => $todaySchedule->count(),
                'totalStudentsCount' => $uniqueStudentsCount,
                'attendanceTodayRate' => $attendanceTodayRate,
                'pendingAttendanceCount' => $pendingAttendanceTasks->count(),
                'pendingGradingCount' => $pendingGradingTasks->count(),
                'pendingTasksCount' => $pendingAttendanceTasks->count() + $pendingGradingTasks->count(),
            ],
            'assignedClasses' => $assignedClasses,
            'todaySchedule' => $todaySchedule,
            'nextClass' => $nextClass,
            'attendanceTasks' => $allAttendanceTasks,
            'pendingAttendanceTasks' => $pendingAttendanceTasks,
            'pendingGradingTasks' => $pendingGradingTasks,
            'weeklyAttendance' => $weeklyAttendance,
            'recentActivities' => $recentActivities,
            'teacherCourses' => $teacherCourses,
            'recentGradesGiven' => $recentGradesGiven,
            'currentAcademicYear' => $organization->academicYears()->where('is_current', true)->first(),
        ]);
    }

    /**
     * Student Dashboard.
     */
    private function studentDashboard(Organization $organization, User $user): Response
    {
        $classEnrollment = StudentEnrollment::with(['classSection.schoolClass', 'academicYear'])
            ->where('organization_id', $organization->id)
            ->where('student_id', $user->id)
            ->where('status', 'active')
            ->first();

        $courseEnrollments = CourseEnrollment::with(['course.category', 'course.instructor'])
            ->where('organization_id', $organization->id)
            ->where('user_id', $user->id)
            ->latest()
            ->get();

        $myGrades = Grade::with('assessment.subject')
            ->where('organization_id', $organization->id)
            ->where('student_id', $user->id)
            ->latest()
            ->take(8)
            ->get();

        $attendanceCount = Attendance::where('organization_id', $organization->id)
            ->where('student_id', $user->id)
            ->count();
        $presentCount = Attendance::where('organization_id', $organization->id)
            ->where('student_id', $user->id)
            ->where('status', 'present')
            ->count();
        $attendanceRate = $attendanceCount > 0 ? round(($presentCount / $attendanceCount) * 100, 1) : 100;

        $mySubjects = collect();
        $todayTimetable = collect();

        if ($classEnrollment && $classEnrollment->classSection) {
            $enrolledClassId = $classEnrollment->classSection->school_class_id;
            $currentDay = strtolower(now()->format('l'));

            $mySubjects = Subject::where('organization_id', $organization->id)
                ->where(function ($q) use ($enrolledClassId) {
                    $q->where('school_class_id', $enrolledClassId)
                      ->orWhereHas('classes', function ($sub) use ($enrolledClassId) {
                          $sub->where('school_classes.id', $enrolledClassId);
                      });
                })
                ->with([
                    'schoolClass',
                    'currentCurriculum.units.topics',
                    'subjectTeachers' => function ($q) use ($classEnrollment) {
                        $q->where('class_section_id', $classEnrollment->class_section_id);
                    },
                    'subjectTeachers.teacher',
                ])
                ->take(6)
                ->get()
                ->map(function ($subject) {
                    $curr = $subject->currentCurriculum;
                    $subject->curriculum_status = $curr ? ucfirst($curr->status) : 'No Syllabus';
                    $subject->units_count = $curr ? $curr->units->count() : 0;
                    $subject->topics_count = $curr ? $curr->units->sum(fn ($u) => $u->topics->count()) : 0;
                    return $subject;
                });

            $todayTimetable = TimetableEntry::where('organization_id', $organization->id)
                ->where('class_section_id', $classEnrollment->class_section_id)
                ->where('day_of_week', $currentDay)
                ->where('is_published', true)
                ->with(['subject', 'teacher'])
                ->orderBy('start_time')
                ->get();
        }

        // Student Institutional Fee Dues & Balance Summary
        $myInvoices = \App\Models\FeeInvoice::where('organization_id', $organization->id)
            ->where('student_id', $user->id)
            ->with(['items', 'payments'])
            ->orderByDesc('billing_month')
            ->orderByDesc('id')
            ->take(5)
            ->get();

        foreach ($myInvoices as $inv) {
            $inv->recalculateFinancials();
        }

        $totalInvoiced = (float) $myInvoices->sum('total_amount');
        $totalPaid = (float) $myInvoices->sum('paid_amount');
        $totalOutstanding = (float) $myInvoices->sum('balance_due');

        $unpaidInvoices = $myInvoices->filter(fn ($inv) => $inv->balance_due > 0 && $inv->status !== 'paid');
        $nextDueDate = $unpaidInvoices->sortBy('due_date')->first()?->due_date?->format('Y-m-d');

        $currentFeeStatus = 'paid';
        $today = \Carbon\Carbon::today();
        if ($totalOutstanding > 0.0001) {
            if ($unpaidInvoices->contains(fn ($inv) => $inv->due_date && \Carbon\Carbon::parse($inv->due_date)->lt($today))) {
                $currentFeeStatus = 'overdue';
            } elseif ($unpaidInvoices->contains(fn ($inv) => $inv->due_date && \Carbon\Carbon::parse($inv->due_date)->isToday())) {
                $currentFeeStatus = 'due_today';
            } elseif ($unpaidInvoices->contains(fn ($inv) => $inv->due_date && \Carbon\Carbon::parse($inv->due_date)->gt($today) && \Carbon\Carbon::parse($inv->due_date)->lte($today->copy()->addDays(3)))) {
                $currentFeeStatus = 'due_soon';
            } elseif ($totalPaid > 0) {
                $currentFeeStatus = 'partially_paid';
            } else {
                $currentFeeStatus = 'unpaid';
            }
        } elseif ($myInvoices->isEmpty()) {
            $currentFeeStatus = 'unpaid';
        }

        $studentFeeStructure = \App\Models\StudentFeeStructure::where('organization_id', $organization->id)
            ->where('student_id', $user->id)
            ->first();

        $feeSummary = [
            'monthlyTuition' => (float) ($studentFeeStructure?->monthly_tuition_fee ?? 0.00),
            'transportFee' => (float) ($studentFeeStructure?->transport_fee ?? 0.00),
            'otherRecurring' => (float) ($studentFeeStructure?->other_recurring_charges ?? 0.00),
            'discountAmount' => (float) ($studentFeeStructure?->discount_value ?? 0.00),
            'discountType' => $studentFeeStructure?->discount_type ?? 'none',
            'netMonthlyFee' => (float) ($studentFeeStructure?->net_monthly_fee ?? 0.00),
            'totalInvoiced' => $totalInvoiced,
            'total_invoiced' => $totalInvoiced,
            'totalPaid' => $totalPaid,
            'total_paid' => $totalPaid,
            'totalOutstanding' => $totalOutstanding,
            'total_outstanding' => $totalOutstanding,
            'nextDueDate' => $nextDueDate,
            'next_due_date' => $nextDueDate,
            'currentStatus' => $currentFeeStatus,
            'current_status' => $currentFeeStatus,
            'unpaidCount' => $unpaidInvoices->count(),
            'unpaid_count' => $unpaidInvoices->count(),
            'recentInvoices' => $myInvoices,
            'recent_invoices' => $myInvoices,
            'currency' => $organization->currency ?? 'USD',
        ];

        return Inertia::render('tenant/dashboard-student', [
            'classEnrollment' => $classEnrollment,
            'mySubjects' => $mySubjects,
            'todayTimetable' => $todayTimetable,
            'courseEnrollments' => $courseEnrollments,
            'myGrades' => $myGrades,
            'attendanceRate' => $attendanceRate,
            'feeSummary' => $feeSummary,
        ]);
    }

    /**
     * Parent / Guardian Dashboard.
     */
    private function parentDashboard(Organization $organization, User $user): Response
    {
        $linkedStudents = ParentStudent::with(['student'])
            ->where('organization_id', $organization->id)
            ->where('parent_id', $user->id)
            ->get();

        $studentIds = $linkedStudents->pluck('student_id');

        $childrenEnrollments = StudentEnrollment::with(['student', 'classSection.schoolClass'])
            ->where('organization_id', $organization->id)
            ->whereIn('student_id', $studentIds)
            ->get();

        $childrenGrades = Grade::with(['student', 'assessment.subject'])
            ->where('organization_id', $organization->id)
            ->whereIn('student_id', $studentIds)
            ->latest()
            ->take(10)
            ->get();

        $childrenFeeSummaries = \App\Models\FeeInvoice::where('organization_id', $organization->id)
            ->whereIn('student_id', $studentIds)
            ->with(['student', 'items'])
            ->latest('billing_month')
            ->get()
            ->groupBy('student_id')
            ->map(function ($invoices, $sId) {
                $totalOutstanding = (float) $invoices->sum('balance_due');
                $unpaid = $invoices->filter(fn ($i) => $i->balance_due > 0 && $i->status !== 'paid');
                $nextDue = $unpaid->sortBy('due_date')->first()?->due_date?->format('Y-m-d');
                return [
                    'student_id' => $sId,
                    'total_invoices' => $invoices->count(),
                    'total_outstanding' => $totalOutstanding,
                    'next_due_date' => $nextDue,
                    'latest_invoice' => $invoices->first(),
                ];
            });

        return Inertia::render('tenant/dashboard-parent', [
            'linkedStudents' => $linkedStudents,
            'childrenEnrollments' => $childrenEnrollments,
            'childrenGrades' => $childrenGrades,
            'childrenFees' => $childrenFeeSummaries,
            'currency' => $organization->currency ?? 'USD',
        ]);
    }

    /**
     * Individual Online Learner Dashboard (no organization membership).
     */
    private function individualLearnerDashboard(User $user): Response
    {
        return TenantContext::bypass(function () use ($user) {
            $enrolledCourses = CourseEnrollment::with(['course.category', 'course.instructor'])
                ->where('user_id', $user->id)
                ->latest()
                ->get();

            $featuredCourses = Course::with(['category', 'instructor'])
                ->where('is_public', true)
                ->where('is_published', true)
                ->latest()
                ->take(6)
                ->get();

            $certificates = \App\Models\CourseCertificate::with('course')
                ->where('user_id', $user->id)
                ->latest()
                ->get();

            return Inertia::render('tenant/dashboard-learner', [
                'enrolledCourses' => $enrolledCourses,
                'featuredCourses' => $featuredCourses,
                'certificates' => $certificates,
            ]);
        });
    }
}
