<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ClassSection;
use App\Models\Curriculum;
use App\Models\CurriculumTopic;
use App\Models\CurriculumTopicProgress;
use App\Models\CurriculumUnit;
use App\Models\SchoolClass;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CurriculumController extends Controller
{
    /**
     * Show curriculum syllabus builder or student/teacher view for a subject.
     */
    public function show(Subject $subject, Request $request): Response
    {
        $organization = TenantContext::current();
        if (! $organization || $subject->organization_id !== $organization->id) {
            abort(404);
        }

        $user = $request->user();
        $userRole = TenantContext::currentRole($user);

        // Verify Student class access
        $studentEnrollment = null;
        if ($userRole === 'student') {
            $studentEnrollment = StudentEnrollment::where('organization_id', $organization->id)
                ->where('student_id', $user->id)
                ->where('status', 'active')
                ->with(['classSection.schoolClass'])
                ->first();

            if (! $studentEnrollment) {
                abort(403, 'You are not enrolled in an active class section.');
            }

            $enrolledClassId = $studentEnrollment->classSection->school_class_id;
            $isAssociatedWithClass = $subject->school_class_id === $enrolledClassId
                || $subject->classes()->where('school_classes.id', $enrolledClassId)->exists();

            if (! $isAssociatedWithClass) {
                abort(403, 'This subject is not assigned to your grade level.');
            }
        }

        $subject->load([
            'schoolClass',
            'classes',
            'academicYear',
            'subjectTeachers.teacher',
            'subjectTeachers.classSection.schoolClass',
        ]);

        $curriculum = Curriculum::where('organization_id', $organization->id)
            ->where('subject_id', $subject->id)
            ->with([
                'units' => function ($q) {
                    $q->orderBy('order');
                },
                'units.topics' => function ($q) {
                    $q->orderBy('order');
                },
                'units.topics.progress' => function ($q) use ($organization, $studentEnrollment) {
                    if ($studentEnrollment) {
                        $q->where('class_section_id', $studentEnrollment->class_section_id);
                    }
                },
            ])
            ->first();

        // If no curriculum exists yet and user can manage, create initial draft
        if (! $curriculum && in_array($userRole, ['owner', 'admin', 'teacher'], true)) {
            $academicYear = $subject->academic_year_id ? AcademicYear::find($subject->academic_year_id) : AcademicYear::where('organization_id', $organization->id)->where('is_current', true)->first();

            $curriculum = Curriculum::create([
                'organization_id' => $organization->id,
                'subject_id' => $subject->id,
                'school_class_id' => $subject->school_class_id,
                'academic_year_id' => $academicYear?->id,
                'title' => "{$subject->name} Curriculum",
                'description' => $subject->description ?: "Comprehensive syllabus for {$subject->name}",
                'status' => 'draft',
            ]);

            $curriculum->load(['units.topics.progress']);
        }

        $canManage = in_array($userRole, ['owner', 'admin'], true) || $user->isSuperAdmin();
        $isTeacher = $userRole === 'teacher';
        $isStudent = $userRole === 'student';

        // Fetch sections for teacher/admin to record progress against
        $sections = ClassSection::where('organization_id', $organization->id)
            ->when($subject->school_class_id, function ($q) use ($subject) {
                $q->where('school_class_id', $subject->school_class_id);
            })
            ->with('schoolClass')
            ->get();

        return Inertia::render('school/curriculum', [
            'subject' => $subject,
            'curriculum' => $curriculum,
            'canManage' => $canManage,
            'isTeacher' => $isTeacher,
            'isStudent' => $isStudent,
            'sections' => $sections,
            'studentEnrollment' => $studentEnrollment,
        ]);
    }

    /**
     * Store or update top-level curriculum metadata.
     */
    public function store(Request $request, Subject $subject): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $subject->organization_id !== $organization->id) {
            abort(404);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:draft,published,archived',
        ]);

        Curriculum::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'subject_id' => $subject->id,
            ],
            [
                'school_class_id' => $subject->school_class_id,
                'academic_year_id' => $subject->academic_year_id,
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'],
            ]
        );

        return back()->with('success', 'Curriculum updated successfully.');
    }

    /**
     * Update curriculum details.
     */
    public function update(Request $request, Curriculum $curriculum): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $curriculum->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'description' => 'nullable|string|max:1000',
            'status' => 'required|in:draft,published,archived',
        ]);

        $curriculum->update($validated);

        return back()->with('success', 'Curriculum details updated.');
    }

    /**
     * Add a unit/chapter to the curriculum.
     */
    public function storeUnit(Request $request, Curriculum $curriculum): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $curriculum->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'description' => 'nullable|string|max:1000',
            'estimated_periods' => 'nullable|integer|min:1|max:200',
            'order' => 'nullable|integer|min:1',
        ]);

        $nextOrder = $validated['order'] ?? ($curriculum->units()->max('order') + 1);

        $curriculum->units()->create([
            'organization_id' => $organization->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'estimated_periods' => $validated['estimated_periods'] ?? null,
            'order' => $nextOrder,
        ]);

        return back()->with('success', 'Curriculum unit added successfully.');
    }

    /**
     * Update unit.
     */
    public function updateUnit(Request $request, CurriculumUnit $unit): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $unit->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'description' => 'nullable|string|max:1000',
            'estimated_periods' => 'nullable|integer|min:1|max:200',
            'order' => 'nullable|integer|min:1',
        ]);

        $unit->update($validated);

        return back()->with('success', 'Unit updated successfully.');
    }

    /**
     * Delete unit.
     */
    public function destroyUnit(CurriculumUnit $unit): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $unit->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $unit->delete();

        return back()->with('success', 'Unit removed.');
    }

    /**
     * Add a topic under a unit.
     */
    public function storeTopic(Request $request, CurriculumUnit $unit): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $unit->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'learning_objectives' => 'nullable|string|max:1500',
            'content_summary' => 'nullable|string|max:1500',
            'order' => 'nullable|integer|min:1',
            'status' => 'required|in:draft,published',
        ]);

        $nextOrder = $validated['order'] ?? ($unit->topics()->max('order') + 1);

        $unit->topics()->create([
            'organization_id' => $organization->id,
            'title' => $validated['title'],
            'learning_objectives' => $validated['learning_objectives'] ?? null,
            'content_summary' => $validated['content_summary'] ?? null,
            'order' => $nextOrder,
            'status' => $validated['status'],
        ]);

        return back()->with('success', 'Topic created successfully.');
    }

    /**
     * Update topic.
     */
    public function updateTopic(Request $request, CurriculumTopic $topic): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $topic->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'learning_objectives' => 'nullable|string|max:1500',
            'content_summary' => 'nullable|string|max:1500',
            'order' => 'nullable|integer|min:1',
            'status' => 'required|in:draft,published',
        ]);

        $topic->update($validated);

        return back()->with('success', 'Topic updated.');
    }

    /**
     * Delete topic.
     */
    public function destroyTopic(CurriculumTopic $topic): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $topic->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $topic->delete();

        return back()->with('success', 'Topic deleted.');
    }

    /**
     * Update teacher/section lesson progress on a topic.
     */
    public function updateProgress(Request $request, CurriculumTopic $topic): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $topic->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('updateCurriculumProgress', $organization);

        $validated = $request->validate([
            'class_section_id' => 'required|exists:class_sections,id',
            'status' => 'required|in:not_started,in_progress,completed',
            'notes' => 'nullable|string|max:500',
        ]);

        // Verify section belongs to current organization
        $section = ClassSection::where('organization_id', $organization->id)->findOrFail($validated['class_section_id']);

        $user = $request->user();

        CurriculumTopicProgress::updateOrCreate(
            [
                'organization_id' => $organization->id,
                'curriculum_topic_id' => $topic->id,
                'class_section_id' => $section->id,
            ],
            [
                'teacher_id' => $user->id,
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'completed_at' => $validated['status'] === 'completed' ? now() : null,
            ]
        );

        return back()->with('success', 'Topic progress updated.');
    }
}
