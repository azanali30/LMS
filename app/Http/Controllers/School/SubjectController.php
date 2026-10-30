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
use App\Models\TimetableEntry;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    /**
     * List all subjects, syllabus summaries, and teacher assignments.
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
        $academicYear = AcademicYear::where('organization_id', $organization->id)
            ->where('is_current', true)
            ->first() ?? $academicYears->first();

        if (! $academicYear) {
            $academicYear = AcademicYear::create([
                'organization_id' => $organization->id,
                'name' => now()->year . '-' . (now()->year + 1) . ' Academic Session',
                'start_date' => now()->startOfYear(),
                'end_date' => now()->endOfYear(),
                'is_current' => true,
            ]);
            $academicYears = collect([$academicYear]);
        }

        // 1. STUDENT VIEW: Subjects matching student's active enrollment class and section only
        if ($userRole === 'student') {
            $enrollment = StudentEnrollment::where('organization_id', $organization->id)
                ->where('student_id', $user->id)
                ->where('status', 'active')
                ->with(['classSection.schoolClass', 'academicYear'])
                ->first();

            $studentSubjects = collect();
            if ($enrollment) {
                $enrolledClassId = $enrollment->classSection->school_class_id;

                $studentSubjects = Subject::where('organization_id', $organization->id)
                    ->where(function ($q) use ($enrolledClassId) {
                        $q->where('school_class_id', $enrolledClassId)
                          ->orWhereHas('classes', function ($sub) use ($enrolledClassId) {
                              $sub->where('school_classes.id', $enrolledClassId);
                          });
                    })
                    ->with([
                        'schoolClass',
                        'classes',
                        'currentCurriculum.units.topics.progress' => function ($q) use ($enrollment) {
                            $q->where('class_section_id', $enrollment->class_section_id);
                        },
                        'subjectTeachers' => function ($q) use ($enrollment) {
                            $q->where('class_section_id', $enrollment->class_section_id);
                        },
                        'subjectTeachers.teacher',
                        'timetableEntries' => function ($q) use ($enrollment) {
                            $q->where('class_section_id', $enrollment->class_section_id)->where('is_published', true)->orderBy('start_time');
                        },
                    ])
                    ->get()
                    ->map(function ($subject) {
                        $curr = $subject->currentCurriculum;
                        $totalTopics = 0;
                        $completedTopics = 0;
                        if ($curr) {
                            foreach ($curr->units as $u) {
                                foreach ($u->topics as $t) {
                                    $totalTopics++;
                                    if ($t->progress->first()?->status === 'completed') {
                                        $completedTopics++;
                                    }
                                }
                            }
                        }
                        $subject->curriculum_progress = $totalTopics > 0 ? round(($completedTopics / $totalTopics) * 100) : 0;
                        $subject->curriculum_total_topics = $totalTopics;
                        $subject->curriculum_completed_topics = $completedTopics;
                        return $subject;
                    });
            }

            return Inertia::render('school/subjects', [
                'isStudent' => true,
                'isTeacher' => false,
                'canManage' => false,
                'enrollment' => $enrollment,
                'studentSubjects' => $studentSubjects,
                'subjects' => ['data' => [], 'links' => []],
                'classes' => [],
                'sections' => [],
                'teachers' => [],
                'academicYear' => $academicYear,
                'academicYears' => $academicYears,
            ]);
        }

        // 2. ADMIN / TEACHER VIEW
        $classes = SchoolClass::where('organization_id', $organization->id)->get();
        $sections = ClassSection::where('organization_id', $organization->id)
            ->with('schoolClass')
            ->get();
        $teachers = OrganizationUser::with('user')
            ->where('organization_id', $organization->id)
            ->whereIn('role', ['teacher', 'admin', 'owner'])
            ->get();

        $canManage = in_array($userRole, ['owner', 'admin'], true) || $user->isSuperAdmin();
        $isTeacher = $userRole === 'teacher';

        // Filters
        $search = $request->query('search');
        $filterClassId = $request->query('class_id');
        $filterTeacherId = $request->query('teacher_id');
        $filterYearId = $request->query('academic_year_id');

        $query = Subject::where('organization_id', $organization->id)
            ->with([
                'schoolClass',
                'classes',
                'academicYear',
                'currentCurriculum.units.topics',
                'subjectTeachers.teacher',
                'subjectTeachers.classSection.schoolClass',
            ])
            ->latest();

        if ($isTeacher) {
            $assignedSubjectIds = ClassSubjectTeacher::where('organization_id', $organization->id)
                ->where('teacher_id', $user->id)
                ->pluck('subject_id')
                ->merge(
                    TimetableEntry::where('organization_id', $organization->id)
                        ->where('teacher_id', $user->id)
                        ->pluck('subject_id')
                )
                ->unique()
                ->filter()
                ->values();

            $query->whereIn('id', $assignedSubjectIds);
            $teachers = collect(); // Do not expose other educators
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($filterClassId) {
            $query->where(function ($q) use ($filterClassId) {
                $q->where('school_class_id', $filterClassId)
                  ->orWhereHas('classes', function ($sub) use ($filterClassId) {
                      $sub->where('school_classes.id', $filterClassId);
                  });
            });
        }

        if ($filterTeacherId) {
            $query->whereHas('subjectTeachers', function ($q) use ($filterTeacherId) {
                $q->where('teacher_id', $filterTeacherId);
            });
        }

        if ($filterYearId) {
            $query->where('academic_year_id', $filterYearId);
        }

        $subjects = $query->paginate(15)->through(function ($subj) {
            $curr = $subj->currentCurriculum;
            $subj->curriculum_status = $curr ? ucfirst($curr->status) : 'No Syllabus';
            $subj->units_count = $curr ? $curr->units->count() : 0;
            $subj->topics_count = $curr ? $curr->units->sum(fn ($u) => $u->topics->count()) : 0;
            return $subj;
        });

        return Inertia::render('school/subjects', [
            'isStudent' => false,
            'isTeacher' => $isTeacher,
            'canManage' => $canManage,
            'enrollment' => null,
            'studentSubjects' => [],
            'subjects' => $subjects,
            'classes' => $classes,
            'sections' => $sections,
            'teachers' => $teachers,
            'academicYear' => $academicYear,
            'academicYears' => $academicYears,
            'filters' => [
                'search' => $search,
                'class_id' => $filterClassId,
                'teacher_id' => $filterTeacherId,
                'academic_year_id' => $filterYearId,
            ],
        ]);
    }

    /**
     * Store a new subject with class association, type, and optional immediate teacher assignment.
     */
    public function store(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:500',
            'type' => 'nullable|string|in:core,elective,practical,language,vocational',
            'school_class_id' => 'nullable|exists:school_classes,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'class_ids' => 'nullable|array',
            'class_ids.*' => 'exists:school_classes,id',
            'teacher_id' => 'nullable|exists:users,id',
            'class_section_id' => 'nullable|exists:class_sections,id',
        ]);

        // Tenant Scoping Verification
        if (! empty($validated['school_class_id'])) {
            $classInOrg = SchoolClass::where('organization_id', $organization->id)
                ->where('id', $validated['school_class_id'])
                ->exists();
            if (! $classInOrg) {
                throw ValidationException::withMessages([
                    'school_class_id' => 'Selected grade level does not belong to this organization.',
                ]);
            }
        }

        if (! empty($validated['academic_year_id'])) {
            $yearInOrg = AcademicYear::where('organization_id', $organization->id)
                ->where('id', $validated['academic_year_id'])
                ->exists();
            if (! $yearInOrg) {
                throw ValidationException::withMessages([
                    'academic_year_id' => 'Selected academic year does not belong to this organization.',
                ]);
            }
        }

        // Prevent duplicate subject for the same class and academic year
        $existingDuplicate = Subject::where('organization_id', $organization->id)
            ->where('name', $validated['name'])
            ->when(! empty($validated['school_class_id']), function ($q) use ($validated) {
                $q->where('school_class_id', $validated['school_class_id']);
            })
            ->when(! empty($validated['academic_year_id']), function ($q) use ($validated) {
                $q->where('academic_year_id', $validated['academic_year_id']);
            })
            ->exists();

        if ($existingDuplicate) {
            throw ValidationException::withMessages([
                'name' => "A subject named '{$validated['name']}' already exists for this grade level and session.",
            ]);
        }

        $subject = Subject::create([
            'organization_id' => $organization->id,
            'school_class_id' => $validated['school_class_id'] ?? null,
            'academic_year_id' => $validated['academic_year_id'] ?? null,
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'] ?? 'core',
        ]);

        // Associate multi-classes if selected
        $classIdsToSync = collect($validated['class_ids'] ?? []);
        if (! empty($validated['school_class_id'])) {
            $classIdsToSync->push($validated['school_class_id']);
        }
        $validClassIds = SchoolClass::where('organization_id', $organization->id)
            ->whereIn('id', $classIdsToSync->unique()->filter())
            ->pluck('id');

        $syncData = [];
        foreach ($validClassIds as $cId) {
            $syncData[$cId] = ['organization_id' => $organization->id, 'academic_year_id' => $validated['academic_year_id'] ?? null];
        }
        $subject->classes()->sync($syncData);

        // Optional Immediate Teacher Assignment
        if (! empty($validated['teacher_id']) && ! empty($validated['class_section_id'])) {
            $section = ClassSection::where('organization_id', $organization->id)->find($validated['class_section_id']);
            $isTeacher = OrganizationUser::where('organization_id', $organization->id)
                ->where('user_id', $validated['teacher_id'])
                ->exists();

            if ($section && $isTeacher) {
                $ayId = $validated['academic_year_id'] ?? AcademicYear::where('organization_id', $organization->id)->first()?->id;
                if ($ayId) {
                    ClassSubjectTeacher::updateOrCreate(
                        [
                            'organization_id' => $organization->id,
                            'class_section_id' => $section->id,
                            'subject_id' => $subject->id,
                            'academic_year_id' => $ayId,
                        ],
                        [
                            'teacher_id' => $validated['teacher_id'],
                        ]
                    );
                }
            }
        }

        return back()->with('success', "Curriculum subject '{$subject->name}' created successfully.");
    }

    /**
     * Assign a teacher to a subject and class section.
     */
    public function assignTeacher(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageAcademics', $organization);

        if (! $request->filled('academic_year_id')) {
            $ay = AcademicYear::where('organization_id', $organization->id)
                ->where('is_current', true)
                ->first() ?? AcademicYear::where('organization_id', $organization->id)->first();

            if (! $ay) {
                $ay = AcademicYear::create([
                    'organization_id' => $organization->id,
                    'name' => now()->year . '-' . (now()->year + 1) . ' Academic Session',
                    'start_date' => now()->startOfYear(),
                    'end_date' => now()->endOfYear(),
                    'is_current' => true,
                ]);
            }
            $request->merge(['academic_year_id' => $ay->id]);
        }

        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'class_section_id' => 'required|exists:class_sections,id',
            'teacher_id' => 'required|exists:users,id',
            'academic_year_id' => 'required|exists:academic_years,id',
        ]);

        // Tenant Scoping Verification
        $subject = Subject::where('organization_id', $organization->id)->findOrFail($validated['subject_id']);
        $section = ClassSection::where('organization_id', $organization->id)->findOrFail($validated['class_section_id']);
        $isTeacherInOrg = OrganizationUser::where('organization_id', $organization->id)
            ->where('user_id', $validated['teacher_id'])
            ->exists();

        if (! $isTeacherInOrg) {
            throw ValidationException::withMessages([
                'teacher_id' => 'Selected educator is not a member of this organization.',
            ]);
        }

        // Link subject to the section's class if not linked yet
        if ($section->school_class_id) {
            if (! $subject->school_class_id) {
                $subject->update(['school_class_id' => $section->school_class_id]);
            }
            if (! $subject->classes()->where('school_classes.id', $section->school_class_id)->exists()) {
                $subject->classes()->attach($section->school_class_id, [
                    'organization_id' => $organization->id,
                    'academic_year_id' => $validated['academic_year_id'],
                ]);
            }
        }

        ClassSubjectTeacher::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'class_section_id' => $validated['class_section_id'],
                'subject_id' => $validated['subject_id'],
                'academic_year_id' => $validated['academic_year_id'],
            ],
            [
                'teacher_id' => $validated['teacher_id'],
            ]
        );

        return back()->with('success', 'Educator successfully assigned to classroom section.');
    }

    /**
     * Remove / unassign a teacher from a subject and section.
     */
    public function destroyAssignment(ClassSubjectTeacher $assignment): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $assignment->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $assignment->delete();

        return back()->with('success', 'Teacher allocation unassigned successfully.');
    }

    /**
     * Update subject.
     */
    public function update(Subject $subject, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $subject->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:500',
            'type' => 'nullable|string|in:core,elective,practical,language,vocational',
            'school_class_id' => 'nullable|exists:school_classes,id',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'class_ids' => 'nullable|array',
            'class_ids.*' => 'exists:school_classes,id',
        ]);

        if (! empty($validated['school_class_id'])) {
            $classInOrg = SchoolClass::where('organization_id', $organization->id)
                ->where('id', $validated['school_class_id'])
                ->exists();
            if (! $classInOrg) {
                throw ValidationException::withMessages([
                    'school_class_id' => 'Selected class does not belong to this organization.',
                ]);
            }
        }

        $subject->update([
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'description' => $validated['description'] ?? null,
            'type' => $validated['type'] ?? $subject->type,
            'school_class_id' => $validated['school_class_id'] ?? $subject->school_class_id,
            'academic_year_id' => $validated['academic_year_id'] ?? $subject->academic_year_id,
        ]);

        if (isset($validated['class_ids'])) {
            $classIdsToSync = collect($validated['class_ids']);
            if ($subject->school_class_id) {
                $classIdsToSync->push($subject->school_class_id);
            }
            $validClassIds = SchoolClass::where('organization_id', $organization->id)
                ->whereIn('id', $classIdsToSync->unique()->filter())
                ->pluck('id');

            $syncData = [];
            foreach ($validClassIds as $cId) {
                $syncData[$cId] = ['organization_id' => $organization->id, 'academic_year_id' => $subject->academic_year_id];
            }
            $subject->classes()->sync($syncData);
        }

        return back()->with('success', "Subject '{$subject->name}' updated successfully.");
    }

    /**
     * Delete subject.
     */
    public function destroy(Subject $subject): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $subject->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $name = $subject->name;
        $subject->delete();

        return back()->with('success', "Subject '{$name}' deleted successfully.");
    }
}
