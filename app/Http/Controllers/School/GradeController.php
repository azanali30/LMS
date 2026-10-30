<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\AcademicYear;
use App\Models\Assessment;
use App\Models\ClassSection;
use App\Models\ClassSubjectTeacher;
use App\Models\Grade;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\TimetableEntry;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradeController extends Controller
{
    /**
     * Display assessments and student grading sheet.
     */
    public function index(Request $request): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $user = $request->user();
        if (! $user || (! $user->isSuperAdmin() && ! $user->hasRoleInOrganization($organization->id, ['owner', 'admin', 'teacher', 'student', 'parent']))) {
            abort(403, 'Unauthorized access to assessments & grades.');
        }

        $userRole = TenantContext::currentRole($user);
        $canManage = $user->isSuperAdmin() || in_array($userRole, ['owner', 'admin', 'teacher'], true);
        $isTeacher = ($userRole === 'teacher');

        if ($userRole === 'student') {
            $studentEnrollment = StudentEnrollment::with(['classSection.schoolClass'])
                ->where('organization_id', $organization->id)
                ->where('student_id', $user->id)
                ->where('status', 'active')
                ->first();

            $studentGrades = Grade::with(['assessment.subject', 'assessment.academicTerm', 'assessment.classSection.schoolClass'])
                ->where('organization_id', $organization->id)
                ->where('student_id', $user->id)
                ->latest()
                ->paginate(15);

            return Inertia::render('school/grades', [
                'isStudent' => true,
                'canManage' => false,
                'studentEnrollment' => $studentEnrollment,
                'studentGrades' => $studentGrades,
                'assessments' => ['data' => [], 'links' => []],
                'sections' => [],
                'subjects' => [],
                'terms' => [],
                'currentTermId' => null,
                'selectedAssessment' => null,
                'students' => [],
                'grades' => (object) [],
            ]);
        }

        // Teacher scoping: identify assigned sections and subjects
        $teacherSectionIds = collect();
        $teacherSubjectIds = collect();

        if ($isTeacher) {
            $teacherSectionIds = ClassSubjectTeacher::where('organization_id', $organization->id)
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

            $teacherSubjectIds = ClassSubjectTeacher::where('organization_id', $organization->id)
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
        }

        $assessmentsQuery = Assessment::with(['classSection.schoolClass', 'subject', 'academicTerm'])
            ->where('organization_id', $organization->id);

        if ($isTeacher) {
            $assessmentsQuery->whereIn('class_section_id', $teacherSectionIds)
                ->whereIn('subject_id', $teacherSubjectIds);
        }

        $assessments = $assessmentsQuery->latest()->paginate(10);

        if ($isTeacher) {
            $sections = ClassSection::where('organization_id', $organization->id)
                ->whereIn('id', $teacherSectionIds)
                ->with('schoolClass')
                ->get();
            $subjects = Subject::where('organization_id', $organization->id)
                ->whereIn('id', $teacherSubjectIds)
                ->get();
        } else {
            $sections = ClassSection::where('organization_id', $organization->id)->with('schoolClass')->get();
            $subjects = Subject::where('organization_id', $organization->id)->get();
        }

        // 1. Ensure current Academic Year exists
        $academicYear = AcademicYear::where('organization_id', $organization->id)
            ->where('is_current', true)
            ->first() ?? AcademicYear::where('organization_id', $organization->id)->latest()->first();

        if (! $academicYear) {
            $currentYear = (int) date('Y');
            $academicYear = AcademicYear::create([
                'organization_id' => $organization->id,
                'name' => "{$currentYear}-".($currentYear + 1).' Academic Session',
                'start_date' => "{$currentYear}-09-01",
                'end_date' => ($currentYear + 1).'-06-30',
                'is_current' => true,
            ]);
        }

        // 2. Ensure Academic Terms exist for organization
        $terms = AcademicTerm::where('organization_id', $organization->id)->get();
        if ($terms->isEmpty()) {
            $yearStart = Carbon::parse($academicYear->start_date);
            $yearEnd = Carbon::parse($academicYear->end_date);
            $midYear = $yearStart->copy()->addMonths(5);

            $now = now();
            $isTerm1Current = $now->between($yearStart, $midYear) || ! $now->between($midYear, $yearEnd);

            AcademicTerm::create([
                'organization_id' => $organization->id,
                'academic_year_id' => $academicYear->id,
                'name' => 'Fall Term (First Half)',
                'start_date' => $yearStart->toDateString(),
                'end_date' => $midYear->toDateString(),
                'is_current' => $isTerm1Current,
            ]);

            AcademicTerm::create([
                'organization_id' => $organization->id,
                'academic_year_id' => $academicYear->id,
                'name' => 'Spring Term (Second Half)',
                'start_date' => $midYear->copy()->addDay()->toDateString(),
                'end_date' => $yearEnd->toDateString(),
                'is_current' => ! $isTerm1Current,
            ]);

            $terms = AcademicTerm::where('organization_id', $organization->id)->get();
        }

        // 3. Identify current ongoing academic term
        $currentTerm = $terms->firstWhere('is_current', true)
            ?? $terms->first(function ($term) {
                return $term->start_date && $term->end_date && now()->between($term->start_date, $term->end_date);
            })
            ?? $terms->first();

        if ($currentTerm && ! $currentTerm->is_current) {
            AcademicTerm::where('organization_id', $organization->id)->where('id', '!=', $currentTerm->id)->update(['is_current' => false]);
            $currentTerm->update(['is_current' => true]);
            $terms = AcademicTerm::where('organization_id', $organization->id)->get();
        }

        $selectedAssessmentId = $request->query('assessment_id');
        $selectedAssessment = null;
        $students = [];
        $grades = collect();

        if ($selectedAssessmentId) {
            $selectedAssessment = Assessment::with(['classSection', 'subject'])->find($selectedAssessmentId);

            if ($selectedAssessment && $selectedAssessment->organization_id === $organization->id) {
                // If teacher, verify that this assessment belongs to teacher's assigned section & subject
                if ($isTeacher) {
                    $isAllowed = $teacherSectionIds->contains($selectedAssessment->class_section_id)
                        && $teacherSubjectIds->contains($selectedAssessment->subject_id);

                    if (! $isAllowed) {
                        $selectedAssessment = null;
                    }
                }

                if ($selectedAssessment) {
                    $students = StudentEnrollment::with('student')
                        ->where('organization_id', $organization->id)
                        ->where('class_section_id', $selectedAssessment->class_section_id)
                        ->where('status', 'active')
                        ->get();

                    $grades = Grade::where('assessment_id', $selectedAssessment->id)
                        ->get()
                        ->keyBy('student_id');
                }
            }
        }

        return Inertia::render('school/grades', [
            'isStudent' => false,
            'canManage' => $canManage,
            'assessments' => $assessments,
            'sections' => $sections,
            'subjects' => $subjects,
            'terms' => $terms,
            'currentTermId' => $currentTerm?->id,
            'selectedAssessment' => $selectedAssessment,
            'students' => $students,
            'grades' => $grades,
        ]);
    }

    /**
     * Store a new assessment / exam.
     */
    public function storeAssessment(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('gradeAndAttendance', $organization);

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'type' => 'required|string|in:exam,quiz,project,practical,assignment',
            'class_section_id' => 'required|exists:class_sections,id',
            'subject_id' => 'required|exists:subjects,id',
            'academic_term_id' => 'nullable|exists:academic_terms,id',
            'max_score' => 'required|numeric|min:1|max:1000',
            'due_date' => 'nullable|date',
        ]);

        $user = $request->user();
        $userRole = TenantContext::currentRole($user);

        // Teacher restriction: verify teacher is assigned to teach this section and subject
        if ($userRole === 'teacher') {
            $isAssigned = ClassSubjectTeacher::where('organization_id', $organization->id)
                ->where('class_section_id', $validated['class_section_id'])
                ->where('subject_id', $validated['subject_id'])
                ->where('teacher_id', $user->id)
                ->exists() ||
                TimetableEntry::where('organization_id', $organization->id)
                    ->where('class_section_id', $validated['class_section_id'])
                    ->where('subject_id', $validated['subject_id'])
                    ->where('teacher_id', $user->id)
                    ->exists();

            if (! $isAssigned) {
                abort(403, 'You are not assigned to create assessments for this section and subject.');
            }
        }

        $termId = $validated['academic_term_id'] ?? null;
        if (! $termId) {
            $term = AcademicTerm::where('organization_id', $organization->id)->where('is_current', true)->first()
                ?? AcademicTerm::where('organization_id', $organization->id)->first();
            $termId = $term?->id;
        }

        if (! $termId) {
            $ay = AcademicYear::where('organization_id', $organization->id)->firstOrCreate(
                ['organization_id' => $organization->id, 'is_current' => true],
                [
                    'name' => date('Y').'-'.(date('Y') + 1).' Academic Session',
                    'start_date' => date('Y').'-09-01',
                    'end_date' => (date('Y') + 1).'-06-30',
                ]
            );
            $term = AcademicTerm::create([
                'organization_id' => $organization->id,
                'academic_year_id' => $ay->id,
                'name' => 'Current Academic Term',
                'start_date' => date('Y').'-09-01',
                'end_date' => (date('Y') + 1).'-06-30',
                'is_current' => true,
            ]);
            $termId = $term->id;
        }

        $assessment = Assessment::create([
            'organization_id' => $organization->id,
            'title' => $validated['title'],
            'type' => $validated['type'],
            'class_section_id' => $validated['class_section_id'],
            'subject_id' => $validated['subject_id'],
            'academic_term_id' => $termId,
            'max_score' => $validated['max_score'],
            'due_date' => $validated['due_date'] ?? null,
        ]);

        return redirect()->route('school.grades.index', ['assessment_id' => $assessment->id])
            ->with('success', "Assessment {$assessment->title} created.");
    }

    /**
     * Store student grades for an assessment.
     */
    public function storeGrades(Assessment $assessment, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $assessment->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('gradeAndAttendance', $organization);

        $user = $request->user();
        $userRole = TenantContext::currentRole($user);

        // Teacher restriction: verify teacher is assigned to this assessment's section and subject
        if ($userRole === 'teacher') {
            $isAssigned = ClassSubjectTeacher::where('organization_id', $organization->id)
                ->where('class_section_id', $assessment->class_section_id)
                ->where('subject_id', $assessment->subject_id)
                ->where('teacher_id', $user->id)
                ->exists() ||
                TimetableEntry::where('organization_id', $organization->id)
                    ->where('class_section_id', $assessment->class_section_id)
                    ->where('subject_id', $assessment->subject_id)
                    ->where('teacher_id', $user->id)
                    ->exists();

            if (! $isAssigned) {
                abort(403, 'You are not authorized to record grades for this assessment.');
            }
        }

        $validated = $request->validate([
            'grades' => 'required|array',
            'grades.*.student_id' => 'required|exists:users,id',
            'grades.*.score' => 'required|numeric|min:0|max:'.$assessment->max_score,
            'grades.*.feedback' => 'nullable|string|max:500',
        ]);

        $graderId = $user->id;

        foreach ($validated['grades'] as $item) {
            Grade::updateOrCreate(
                [
                    'organization_id' => $organization->id,
                    'assessment_id' => $assessment->id,
                    'student_id' => $item['student_id'],
                ],
                [
                    'score' => $item['score'],
                    'feedback' => $item['feedback'] ?? null,
                    'graded_by' => $graderId,
                ]
            );
        }

        return back()->with('success', 'Grades recorded successfully.');
    }
}