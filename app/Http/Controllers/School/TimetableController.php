<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ClassSection;
use App\Models\ClassSubjectTeacher;
use App\Models\OrganizationUser;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\Timetable;
use App\Models\TimetableEntry;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TimetableController extends Controller
{
    /**
     * Display weekly schedule and timetable grid.
     */
    public function index(Request $request): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $user = $request->user();
        $userRole = TenantContext::currentRole($user);

        $academicYears = AcademicYear::where('organization_id', $organization->id)->get();
        $currentAcademicYear = AcademicYear::where('organization_id', $organization->id)->where('is_current', true)->first()
            ?? $academicYears->first();

        if (! $currentAcademicYear) {
            $currentAcademicYear = AcademicYear::create([
                'organization_id' => $organization->id,
                'name' => now()->year . '-' . (now()->year + 1) . ' Academic Session',
                'start_date' => now()->startOfYear(),
                'end_date' => now()->endOfYear(),
                'is_current' => true,
            ]);
            $academicYears = collect([$currentAcademicYear]);
        }

        // 1. STUDENT VIEW: Strict isolation to student's enrolled section
        if ($userRole === 'student') {
            $enrollment = StudentEnrollment::where('organization_id', $organization->id)
                ->where('student_id', $user->id)
                ->where('status', 'active')
                ->with(['classSection.schoolClass', 'academicYear'])
                ->first();

            $entries = collect();
            if ($enrollment) {
                $entries = TimetableEntry::where('organization_id', $organization->id)
                    ->where('class_section_id', $enrollment->class_section_id)
                    ->where('is_published', true)
                    ->with(['subject', 'teacher', 'schoolClass', 'classSection'])
                    ->orderBy('start_time')
                    ->get();
            }

            return Inertia::render('school/timetable', [
                'isStudent' => true,
                'isTeacher' => false,
                'canManage' => false,
                'enrollment' => $enrollment,
                'entries' => $entries,
                'currentAcademicYear' => $currentAcademicYear,
                'academicYears' => $academicYears,
                'classes' => [],
                'sections' => [],
                'subjects' => [],
                'teachers' => [],
            ]);
        }

        // 2. TEACHER & ADMIN TIMETABLE VIEW
        $canManage = in_array($userRole, ['owner', 'admin'], true) || $user->isSuperAdmin();
        $isTeacher = ($userRole === 'teacher');

        $filterSectionId = $request->query('class_section_id');
        $filterTeacherId = $request->query('teacher_id');
        $filterClassId = $request->query('school_class_id');

        if ($isTeacher) {
            // Strictly forbid teachers from viewing another teacher's timetable
            if ($filterTeacherId && (int) $filterTeacherId !== (int) $user->id) {
                abort(403, 'You are not authorized to view another teacher\'s timetable.');
            }

            // Identify all cohorts where this teacher has authorized assignments
            $teacherEntrySectionIds = TimetableEntry::where('organization_id', $organization->id)
                ->where('teacher_id', $user->id)
                ->pluck('class_section_id');

            $assignedCohortIds = ClassSubjectTeacher::where('organization_id', $organization->id)
                ->where('teacher_id', $user->id)
                ->pluck('class_section_id')
                ->merge($teacherEntrySectionIds)
                ->unique()
                ->filter()
                ->values();

            // Validate requested section filter: do not trust unverified browser parameters
            if ($filterSectionId && ! $assignedCohortIds->contains((int) $filterSectionId)) {
                abort(403, 'Unauthorized access to timetable schedule for unassigned cohort.');
            }

            // Restrict accessible sections and classes strictly to authorized cohorts
            $sections = ClassSection::where('organization_id', $organization->id)
                ->whereIn('id', $assignedCohortIds)
                ->with('schoolClass')
                ->get();

            $classes = SchoolClass::where('organization_id', $organization->id)
                ->whereIn('id', $sections->pluck('school_class_id')->unique())
                ->get();

            $subjects = Subject::where('organization_id', $organization->id)
                ->whereIn('id', TimetableEntry::where('organization_id', $organization->id)->where('teacher_id', $user->id)->pluck('subject_id'))
                ->with('schoolClass')
                ->get();

            $teachers = collect(); // Never expose other teachers' identities in teacher timetable view

            // Strict teacher query: always scoped to active org and authenticated teacher
            $query = TimetableEntry::where('organization_id', $organization->id)
                ->where('teacher_id', $user->id)
                ->with(['subject', 'teacher', 'schoolClass', 'classSection'])
                ->orderBy('start_time');

            if ($filterSectionId) {
                $query->where('class_section_id', $filterSectionId);
            }

            // Calculate weekly teaching hours from actual assignments
            $allTeacherEntries = TimetableEntry::where('organization_id', $organization->id)
                ->where('teacher_id', $user->id)
                ->get();

            $totalTeachingMinutes = $allTeacherEntries->sum(function ($entry) {
                $start = Carbon::parse($entry->start_time);
                $end = Carbon::parse($entry->end_time);
                return max(0, $start->diffInMinutes($end));
            });
            $teachingHours = round($totalTeachingMinutes / 60, 1);
            $filterViewMode = 'my_schedule';
        } else {
            // ADMIN / OWNER VIEW
            $classes = SchoolClass::where('organization_id', $organization->id)->get();
            $sections = ClassSection::where('organization_id', $organization->id)->with('schoolClass')->get();
            $subjects = Subject::where('organization_id', $organization->id)->with('schoolClass')->get();
            $teachers = OrganizationUser::with('user')
                ->where('organization_id', $organization->id)
                ->whereIn('role', ['teacher', 'admin', 'owner'])
                ->get();

            $filterViewMode = $request->query('view_mode', 'section');

            $query = TimetableEntry::where('organization_id', $organization->id)
                ->with(['subject', 'teacher', 'schoolClass', 'classSection'])
                ->orderBy('start_time');

            if ($filterSectionId) {
                $query->where('class_section_id', $filterSectionId);
            } elseif ($filterTeacherId) {
                $query->where('teacher_id', $filterTeacherId);
            } elseif ($filterClassId) {
                $query->where('school_class_id', $filterClassId);
            } elseif ($sections->isNotEmpty()) {
                $filterSectionId = $sections->first()->id;
                $query->where('class_section_id', $filterSectionId);
            }

            $teachingHours = 0;
        }

        $currentDay = strtolower(now()->format('l'));
        $currentTime = now()->format('H:i:s');

        $entries = $query->get()->map(function ($entry) use ($currentDay, $currentTime) {
            $isToday = strtolower($entry->day_of_week) === $currentDay;
            $status = 'scheduled';
            if ($isToday) {
                if ($currentTime > $entry->end_time) {
                    $status = 'completed';
                } elseif ($currentTime >= $entry->start_time && $currentTime <= $entry->end_time) {
                    $status = 'current';
                } else {
                    $status = 'upcoming';
                }
            }
            $entry->today_status = $status;
            $entry->is_today = $isToday;
            return $entry;
        });

        return Inertia::render('school/timetable', [
            'isStudent' => false,
            'isTeacher' => $isTeacher,
            'canManage' => $canManage,
            'enrollment' => null,
            'entries' => $entries,
            'teachingHours' => $teachingHours,
            'assignedCohortsCount' => $isTeacher ? $sections->count() : 0,
            'selectedSectionId' => $filterSectionId ? (int) $filterSectionId : ($isTeacher ? null : ($sections->first()?->id ?? null)),
            'selectedTeacherId' => $filterTeacherId ? (int) $filterTeacherId : null,
            'selectedClassId' => $filterClassId ? (int) $filterClassId : null,
            'viewMode' => $filterViewMode,
            'currentAcademicYear' => $currentAcademicYear,
            'academicYears' => $academicYears,
            'classes' => $classes,
            'sections' => $sections,
            'subjects' => $subjects,
            'teachers' => $teachers,
        ]);
    }

    /**
     * Store a new timetable period / entry.
     */
    public function store(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'school_class_id' => 'required|exists:school_classes,id',
            'class_section_id' => 'required|exists:class_sections,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'nullable|exists:users,id',
            'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'period_name' => 'nullable|string|max:60',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'room' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:300',
            'is_published' => 'boolean',
        ]);

        // Tenant Scoping Verification
        $section = ClassSection::where('organization_id', $organization->id)->findOrFail($validated['class_section_id']);
        $schoolClass = SchoolClass::where('organization_id', $organization->id)->findOrFail($validated['school_class_id']);
        $subject = Subject::where('organization_id', $organization->id)->findOrFail($validated['subject_id']);

        if ($section->school_class_id !== $schoolClass->id) {
            throw ValidationException::withMessages([
                'class_section_id' => 'The selected section does not belong to the selected class.',
            ]);
        }

        if (! empty($validated['teacher_id'])) {
            $isTeacherInOrg = OrganizationUser::where('organization_id', $organization->id)
                ->where('user_id', $validated['teacher_id'])
                ->exists();
            if (! $isTeacherInOrg) {
                throw ValidationException::withMessages([
                    'teacher_id' => 'Selected educator does not belong to this organization.',
                ]);
            }
        }

        $startTime = $validated['start_time'] . ':00';
        $endTime = $validated['end_time'] . ':00';
        $day = $validated['day_of_week'];

        DB::transaction(function () use ($organization, $validated, $startTime, $endTime, $day) {
            // 1. Conflict Check: Class Section Overlapping Period
            $sectionOverlap = TimetableEntry::where('organization_id', $organization->id)
                ->where('class_section_id', $validated['class_section_id'])
                ->where('day_of_week', $day)
                ->where(function ($q) use ($startTime, $endTime) {
                    $q->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
                })
                ->with('subject')
                ->first();

            if ($sectionOverlap) {
                throw ValidationException::withMessages([
                    'start_time' => "Time conflict: This section already has {$sectionOverlap->subject->name} scheduled on " . ucfirst($day) . " from {$sectionOverlap->start_time} to {$sectionOverlap->end_time}.",
                ]);
            }

            // 2. Conflict Check: Teacher Double-Booking
            if (! empty($validated['teacher_id'])) {
                $teacherOverlap = TimetableEntry::where('organization_id', $organization->id)
                    ->where('teacher_id', $validated['teacher_id'])
                    ->where('day_of_week', $day)
                    ->where(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<', $endTime)
                          ->where('end_time', '>', $startTime);
                    })
                    ->with(['schoolClass', 'classSection', 'subject'])
                    ->first();

                if ($teacherOverlap) {
                    throw ValidationException::withMessages([
                        'teacher_id' => "Faculty double-booking conflict: This teacher is already teaching {$teacherOverlap->subject->name} in {$teacherOverlap->schoolClass->name} ({$teacherOverlap->classSection->name}) on " . ucfirst($day) . " ({$teacherOverlap->start_time} - {$teacherOverlap->end_time}).",
                    ]);
                }
            }

            // 3. Conflict Check: Classroom / Room Double-Booking
            if (! empty($validated['room'])) {
                $roomOverlap = TimetableEntry::where('organization_id', $organization->id)
                    ->where('room', $validated['room'])
                    ->where('day_of_week', $day)
                    ->where(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<', $endTime)
                          ->where('end_time', '>', $startTime);
                    })
                    ->with(['schoolClass', 'classSection'])
                    ->first();

                if ($roomOverlap) {
                    throw ValidationException::withMessages([
                        'room' => "Room conflict: {$validated['room']} is already occupied by {$roomOverlap->schoolClass->name} ({$roomOverlap->classSection->name}) at this time.",
                    ]);
                }
            }

            // Ensure parent Timetable record exists
            $timetable = Timetable::firstOrCreate(
                [
                    'organization_id' => $organization->id,
                    'academic_year_id' => $validated['academic_year_id'],
                    'school_class_id' => $validated['school_class_id'],
                    'class_section_id' => $validated['class_section_id'],
                ],
                [
                    'title' => "{$validated['day_of_week']} Timetable",
                    'is_published' => $validated['is_published'] ?? true,
                ]
            );

            TimetableEntry::create([
                'organization_id' => $organization->id,
                'timetable_id' => $timetable->id,
                'academic_year_id' => $validated['academic_year_id'],
                'school_class_id' => $validated['school_class_id'],
                'class_section_id' => $validated['class_section_id'],
                'subject_id' => $validated['subject_id'],
                'teacher_id' => $validated['teacher_id'] ?? null,
                'day_of_week' => $day,
                'period_name' => $validated['period_name'] ?? null,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'room' => $validated['room'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'is_published' => $validated['is_published'] ?? true,
            ]);
        });

        return back()->with('success', 'Timetable period successfully scheduled.');
    }

    /**
     * Update an existing timetable period.
     */
    public function update(Request $request, TimetableEntry $entry): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $entry->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'school_class_id' => 'required|exists:school_classes,id',
            'class_section_id' => 'required|exists:class_sections,id',
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'nullable|exists:users,id',
            'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'period_name' => 'nullable|string|max:60',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'room' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:300',
            'is_published' => 'boolean',
        ]);

        $startTime = $validated['start_time'] . ':00';
        $endTime = $validated['end_time'] . ':00';
        $day = $validated['day_of_week'];

        DB::transaction(function () use ($organization, $entry, $validated, $startTime, $endTime, $day) {
            // Overlap check for section (excluding self)
            $sectionOverlap = TimetableEntry::where('organization_id', $organization->id)
                ->where('class_section_id', $validated['class_section_id'])
                ->where('day_of_week', $day)
                ->where('id', '!=', $entry->id)
                ->where(function ($q) use ($startTime, $endTime) {
                    $q->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
                })
                ->first();

            if ($sectionOverlap) {
                throw ValidationException::withMessages([
                    'start_time' => 'Conflict: Another period is already scheduled for this section in the same timeframe.',
                ]);
            }

            // Teacher overlap check (excluding self)
            if (! empty($validated['teacher_id'])) {
                $teacherOverlap = TimetableEntry::where('organization_id', $organization->id)
                    ->where('teacher_id', $validated['teacher_id'])
                    ->where('day_of_week', $day)
                    ->where('id', '!=', $entry->id)
                    ->where(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<', $endTime)
                          ->where('end_time', '>', $startTime);
                    })
                    ->first();

                if ($teacherOverlap) {
                    throw ValidationException::withMessages([
                        'teacher_id' => 'Teacher conflict: Selected instructor is already teaching another class during this time.',
                    ]);
                }
            }

            // Room overlap check (excluding self)
            if (! empty($validated['room'])) {
                $roomOverlap = TimetableEntry::where('organization_id', $organization->id)
                    ->where('room', $validated['room'])
                    ->where('day_of_week', $day)
                    ->where('id', '!=', $entry->id)
                    ->where(function ($q) use ($startTime, $endTime) {
                        $q->where('start_time', '<', $endTime)
                          ->where('end_time', '>', $startTime);
                    })
                    ->first();

                if ($roomOverlap) {
                    throw ValidationException::withMessages([
                        'room' => "Room conflict: {$validated['room']} is already booked for another session at this time.",
                    ]);
                }
            }

            $entry->update([
                'academic_year_id' => $validated['academic_year_id'],
                'school_class_id' => $validated['school_class_id'],
                'class_section_id' => $validated['class_section_id'],
                'subject_id' => $validated['subject_id'],
                'teacher_id' => $validated['teacher_id'] ?? null,
                'day_of_week' => $day,
                'period_name' => $validated['period_name'] ?? null,
                'start_time' => $startTime,
                'end_time' => $endTime,
                'room' => $validated['room'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'is_published' => $validated['is_published'] ?? true,
            ]);
        });

        return back()->with('success', 'Timetable period updated.');
    }

    /**
     * Delete a timetable entry.
     */
    public function destroy(TimetableEntry $entry): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $entry->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $entry->delete();

        return back()->with('success', 'Period removed from schedule.');
    }

    /**
     * Publish or unpublish all entries for a section.
     */
    public function publishSectionTimetable(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'class_section_id' => 'required|exists:class_sections,id',
            'is_published' => 'required|boolean',
        ]);

        TimetableEntry::where('organization_id', $organization->id)
            ->where('class_section_id', $validated['class_section_id'])
            ->update(['is_published' => $validated['is_published']]);

        Timetable::where('organization_id', $organization->id)
            ->where('class_section_id', $validated['class_section_id'])
            ->update(['is_published' => $validated['is_published']]);

        $statusStr = $validated['is_published'] ? 'published' : 'draft';
        return back()->with('success', "Timetable status updated to {$statusStr}.");
    }
}
