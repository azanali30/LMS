<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AttendanceSubstitute;
use App\Models\ClassSection;
use App\Models\OrganizationUser;
use App\Models\StudentEnrollment;
use App\Services\AttendanceAuthorizationService;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function __construct(
        protected AttendanceAuthorizationService $authService
    ) {}

    /**
     * Display the attendance register for a section and date.
     */
    public function index(Request $request): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $user = $request->user();
        if (! $user || (! $user->isSuperAdmin() && ! $user->hasRoleInOrganization($organization->id, ['owner', 'admin', 'teacher', 'student', 'parent']))) {
            abort(403, 'Unauthorized access to attendance.');
        }

        $userRole = TenantContext::currentRole($user);

        // 1. STUDENT VIEW
        if ($userRole === 'student') {
            $enrollment = StudentEnrollment::with(['classSection.schoolClass'])
                ->where('organization_id', $organization->id)
                ->where('student_id', $user->id)
                ->where('status', 'active')
                ->first();

            $studentAttendances = Attendance::where('organization_id', $organization->id)
                ->where('student_id', $user->id)
                ->orderBy('date', 'desc')
                ->paginate(30);

            $stats = [
                'total' => Attendance::where('organization_id', $organization->id)->where('student_id', $user->id)->count(),
                'present' => Attendance::where('organization_id', $organization->id)->where('student_id', $user->id)->where('status', 'present')->count(),
                'absent' => Attendance::where('organization_id', $organization->id)->where('student_id', $user->id)->where('status', 'absent')->count(),
                'late' => Attendance::where('organization_id', $organization->id)->where('student_id', $user->id)->where('status', 'late')->count(),
                'excused' => Attendance::where('organization_id', $organization->id)->where('student_id', $user->id)->where('status', 'excused')->count(),
            ];

            return Inertia::render('school/attendance', [
                'isStudent' => true,
                'isTeacher' => false,
                'isAdmin' => false,
                'attendanceMode' => $organization->attendance_mode ?? 'daily_first_period',
                'allowEditing' => (bool) ($organization->allow_attendance_editing ?? true),
                'enrollment' => $enrollment,
                'studentAttendances' => $studentAttendances,
                'attendanceStats' => $stats,
                'attendanceTasks' => [],
                'sections' => [],
                'students' => [],
                'existingRecords' => (object) [],
                'canSubmit' => false,
                'selectedTask' => null,
                'teachers' => [],
            ]);
        }

        // 2. TEACHER & ADMIN VIEW
        $selectedDate = $request->query('date', now()->toDateString());
        $isAdmin = in_array($userRole, ['owner', 'admin'], true) || $user->isSuperAdmin();
        $isTeacher = ($userRole === 'teacher');

        // Fetch authorized attendance tasks for today/selected date
        $attendanceTasks = $this->authService->getAuthorizedAttendanceTasks($user, $organization, $selectedDate);

        // Determine accessible sections for dropdown
        if ($isAdmin) {
            $sections = ClassSection::with('schoolClass')
                ->where('organization_id', $organization->id)
                ->get();
        } else {
            // For teachers, restrict sections list strictly to authorized tasks and valid assigned sections
            $authorizedSectionIds = $attendanceTasks->pluck('class_section_id')->unique()->toArray();
            $sections = ClassSection::with('schoolClass')
                ->where('organization_id', $organization->id)
                ->whereIn('id', $authorizedSectionIds)
                ->get();
        }

        $selectedSectionId = $request->query('section_id');
        $timetableEntryId = $request->query('timetable_entry_id');

        // If no section chosen, default to first task's section or first accessible section
        if (! $selectedSectionId) {
            $selectedSectionId = $attendanceTasks->first()['class_section_id'] ?? $sections->first()?->id;
        }

        // If teacher requested a section they are NOT authorized for, reject or reset
        if ($isTeacher && $selectedSectionId) {
            $isAuthorizedForRequested = $this->authService->isAuthorized(
                $user,
                $organization,
                (int) $selectedSectionId,
                $selectedDate,
                $timetableEntryId ? (int) $timetableEntryId : null
            );

            if (! $isAuthorizedForRequested) {
                // Pick first valid task if available, or keep null
                $selectedSectionId = $attendanceTasks->first()['class_section_id'] ?? null;
            }
        }

        $students = [];
        $existingRecords = collect();
        $canSubmit = false;
        $selectedTask = null;

        if ($selectedSectionId) {
            $students = StudentEnrollment::with('student')
                ->where('organization_id', $organization->id)
                ->where('class_section_id', $selectedSectionId)
                ->where('status', 'active')
                ->get();

            $query = Attendance::where('organization_id', $organization->id)
                ->where('class_section_id', $selectedSectionId)
                ->whereDate('date', $selectedDate);

            if (($organization->attendance_mode ?? 'daily_first_period') === 'period_wise' && $timetableEntryId) {
                $query->where('timetable_entry_id', $timetableEntryId);
            }

            $existingRecords = $query->get()->keyBy('student_id');

            $isAuthorized = $this->authService->isAuthorized(
                $user,
                $organization,
                (int) $selectedSectionId,
                $selectedDate,
                $timetableEntryId ? (int) $timetableEntryId : null
            );

            $alreadySubmitted = $existingRecords->isNotEmpty();
            $canEdit = ! $alreadySubmitted || $this->authService->canEditSubmittedAttendance($user, $organization);

            $canSubmit = $isAuthorized && $canEdit;

            $selectedTask = $attendanceTasks->first(function ($t) use ($selectedSectionId, $timetableEntryId) {
                if ($timetableEntryId) {
                    return (int) $t['class_section_id'] === (int) $selectedSectionId && (int) ($t['timetable_entry_id'] ?? 0) === (int) $timetableEntryId;
                }
                return (int) $t['class_section_id'] === (int) $selectedSectionId;
            });
        }

        $teachers = [];
        if ($isAdmin) {
            $teachers = OrganizationUser::with('user')
                ->where('organization_id', $organization->id)
                ->whereIn('role', ['teacher', 'admin', 'owner'])
                ->get();
        }

        return Inertia::render('school/attendance', [
            'isStudent' => false,
            'isTeacher' => $isTeacher,
            'isAdmin' => $isAdmin,
            'attendanceMode' => $organization->attendance_mode ?? 'daily_first_period',
            'allowEditing' => (bool) ($organization->allow_attendance_editing ?? true),
            'attendanceTasks' => $attendanceTasks,
            'sections' => $sections,
            'selectedSectionId' => $selectedSectionId ? (int) $selectedSectionId : null,
            'selectedTimetableEntryId' => $timetableEntryId ? (int) $timetableEntryId : null,
            'selectedDate' => $selectedDate,
            'students' => $students,
            'existingRecords' => $existingRecords,
            'canSubmit' => $canSubmit,
            'selectedTask' => $selectedTask,
            'teachers' => $teachers,
        ]);
    }

    /**
     * Batch save daily or period attendance for students in a section.
     */
    public function store(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('gradeAndAttendance', $organization);

        $validated = $request->validate([
            'class_section_id' => 'required|exists:class_sections,id',
            'date' => 'required|date',
            'timetable_entry_id' => 'nullable|exists:timetable_entries,id',
            'attendances' => 'required|array|min:1',
            'attendances.*.student_id' => 'required|exists:users,id',
            'attendances.*.status' => 'required|string|in:present,absent,late,excused',
            'attendances.*.remarks' => 'nullable|string|max:255',
        ]);

        // Tenant Scoping Verification: Section must belong to current active organization
        $section = ClassSection::where('organization_id', $organization->id)->findOrFail($validated['class_section_id']);

        $user = $request->user();
        $timetableEntryId = $validated['timetable_entry_id'] ?? null;
        $date = $validated['date'];

        // Strict authorization check against configurable policy
        $isAuthorized = $this->authService->isAuthorized(
            $user,
            $organization,
            $section->id,
            $date,
            $timetableEntryId
        );

        if (! $isAuthorized) {
            abort(403, 'You are not authorized to mark attendance for this section and period.');
        }

        // Verify if attendance has already been submitted and whether editing is allowed
        $isPeriodWise = ($organization->attendance_mode ?? 'daily_first_period') === 'period_wise';
        $alreadySubmittedQuery = Attendance::where('organization_id', $organization->id)
            ->where('class_section_id', $section->id)
            ->whereDate('date', $date);

        if ($isPeriodWise && $timetableEntryId) {
            $alreadySubmittedQuery->where('timetable_entry_id', $timetableEntryId);
        }

        $alreadySubmitted = $alreadySubmittedQuery->exists();

        if ($alreadySubmitted && ! $this->authService->canEditSubmittedAttendance($user, $organization)) {
            abort(403, 'Attendance for this session has already been submitted and school policy does not permit modifications by teachers.');
        }

        // In daily_first_period mode, if timetable_entry_id was not explicitly passed, associate with first period if one exists
        if (! $timetableEntryId && ! $isPeriodWise) {
            $dayOfWeek = strtolower(Carbon::parse($date)->format('l'));
            $firstPeriod = $this->authService->getFirstScheduledPeriod($organization->id, $section->id, $dayOfWeek);
            $timetableEntryId = $firstPeriod?->id;
        }

        $markedBy = $user->id;

        DB::transaction(function () use ($organization, $validated, $timetableEntryId, $markedBy, $isPeriodWise) {
            foreach ($validated['attendances'] as $record) {
                $query = Attendance::where('organization_id', $organization->id)
                    ->where('class_section_id', $validated['class_section_id'])
                    ->where('student_id', $record['student_id'])
                    ->whereDate('date', $validated['date']);

                if ($timetableEntryId) {
                    $query->where('timetable_entry_id', $timetableEntryId);
                } else {
                    $query->whereNull('timetable_entry_id');
                }

                $existing = $query->first();

                if ($existing) {
                    $existing->update([
                        'timetable_entry_id' => $timetableEntryId,
                        'marked_by' => $markedBy,
                        'status' => $record['status'],
                        'remarks' => $record['remarks'] ?? null,
                    ]);
                } else {
                    Attendance::create([
                        'organization_id' => $organization->id,
                        'class_section_id' => $validated['class_section_id'],
                        'student_id' => $record['student_id'],
                        'timetable_entry_id' => $timetableEntryId,
                        'date' => $validated['date'],
                        'marked_by' => $markedBy,
                        'status' => $record['status'],
                        'remarks' => $record['remarks'] ?? null,
                    ]);
                }
            }
        });

        return back()->with('success', 'Attendance submitted successfully.');
    }

    /**
     * Authorize a substitute teacher for a section on a specific date (Owner/Admin only).
     */
    public function storeSubstitute(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'class_section_id' => 'required|exists:class_sections,id',
            'substitute_teacher_id' => 'required|exists:users,id',
            'date' => 'required|date',
            'timetable_entry_id' => 'nullable|exists:timetable_entries,id',
            'notes' => 'nullable|string|max:255',
        ]);

        // Verify section belongs to organization
        ClassSection::where('organization_id', $organization->id)->findOrFail($validated['class_section_id']);

        // Verify substitute belongs to organization as teacher/admin
        $isMember = OrganizationUser::where('organization_id', $organization->id)
            ->where('user_id', $validated['substitute_teacher_id'])
            ->whereIn('role', ['teacher', 'admin', 'owner'])
            ->exists();

        if (! $isMember) {
            abort(422, 'Selected substitute educator is not an active staff member in this organization.');
        }

        AttendanceSubstitute::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'class_section_id' => $validated['class_section_id'],
                'date' => $validated['date'],
                'timetable_entry_id' => $validated['timetable_entry_id'] ?? null,
            ],
            [
                'substitute_teacher_id' => $validated['substitute_teacher_id'],
                'authorized_by' => $request->user()->id,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return back()->with('success', 'Substitute teacher authorized successfully.');
    }
}
