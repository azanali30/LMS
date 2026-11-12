<?php

namespace App\Http\Controllers\School;

use App\Http\Controllers\Controller;
use App\Models\ClassSection;
use App\Models\SchoolClass;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassroomController extends Controller
{
    /**
     * Display a listing of classes and sections for the active organization.
     */
    public function index(Request $request): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $user = $request->user();
        if (! $user || (! $user->isSuperAdmin() && ! $user->hasRoleInOrganization($organization->id, ['owner', 'admin']))) {
            abort(403, 'Unauthorized access to class directory. Administrative role required.');
        }

        $userRole = TenantContext::currentRole($user);
        $canManage = true;

        $classes = SchoolClass::with(['sections' => fn ($q) => $q->withCount('studentEnrollments')])
            ->where('organization_id', $organization->id)
            ->latest()
            ->paginate(10);

        $allClasses = SchoolClass::where('organization_id', $organization->id)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);

        return Inertia::render('school/classes', [
            'classes' => $classes,
            'allClasses' => $allClasses,
            'canManage' => $canManage,
        ]);
    }

    /**
     * Display dedicated listing of all class sections.
     */
    public function sectionsIndex(Request $request): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $user = $request->user();
        if (! $user || (! $user->isSuperAdmin() && ! $user->hasRoleInOrganization($organization->id, ['owner', 'admin']))) {
            abort(403, 'Unauthorized access to sections administration. Administrative role required.');
        }

        $userRole = TenantContext::currentRole($user);
        $canManage = true;

        $query = ClassSection::with(['schoolClass', 'studentEnrollments.student', 'subjectTeachers.teacher'])
            ->where('organization_id', $organization->id);

        if ($classId = $request->query('class_id')) {
            $query->where('school_class_id', $classId);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('room', 'like', "%{$search}%")
                    ->orWhereHas('schoolClass', function ($sq) use ($search) {
                        $sq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $sections = $query->latest()->paginate(15)->withQueryString();

        $allClassesQuery = SchoolClass::where('organization_id', $organization->id);
        if ($userRole === 'teacher' && $teacherHasAssignments) {
            $allClassesQuery->whereHas('sections.subjectTeachers', fn ($sq) => $sq->where('teacher_id', $user->id));
        }
        $allClasses = $allClassesQuery->orderBy('name')->get(['id', 'name', 'code']);

        $totalCapacityQuery = ClassSection::where('organization_id', $organization->id);
        if ($userRole === 'teacher' && $teacherHasAssignments) {
            $totalCapacityQuery->whereHas('subjectTeachers', fn ($sq) => $sq->where('teacher_id', $user->id));
        }
        $totalCapacity = (int) $totalCapacityQuery->sum('capacity');

        $totalStudentsQuery = \App\Models\StudentEnrollment::where('organization_id', $organization->id);
        if ($userRole === 'teacher' && $teacherHasAssignments) {
            $totalStudentsQuery->whereHas('classSection.subjectTeachers', fn ($sq) => $sq->where('teacher_id', $user->id));
        }
        $totalStudents = (int) $totalStudentsQuery->count();

        return Inertia::render('school/sections', [
            'sections' => $sections,
            'classes' => $allClasses,
            'stats' => [
                'totalSections' => $sections->total(),
                'totalClasses' => $allClasses->count(),
                'totalCapacity' => $totalCapacity,
                'totalStudents' => $totalStudents,
            ],
            'filters' => [
                'class_id' => $classId,
                'search' => $search,
            ],
            'canManage' => $canManage,
        ]);
    }

    /**
     * Store a section directly with optional quick-creation of class.
     */
    public function storeDirectSection(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'school_class_id' => 'nullable|string',
            'new_class_name' => 'nullable|string|max:100',
            'name' => 'required|string|max:50',
            'room' => 'nullable|string|max:50',
            'capacity' => 'nullable|integer|min:1|max:200',
        ]);

        $classId = $validated['school_class_id'] ?? null;

        // If user wants to create a new class or no class selected
        if ($classId === 'new' || ! $classId || ! is_numeric($classId)) {
            $className = trim($validated['new_class_name'] ?? '');
            if (! $className) {
                $className = 'Default Class';
            }

            $class = SchoolClass::create([
                'organization_id' => $organization->id,
                'name' => $className,
            ]);
            $classId = $class->id;
        } else {
            $class = SchoolClass::where('organization_id', $organization->id)->findOrFail((int) $classId);
        }

        $section = ClassSection::create([
            'organization_id' => $organization->id,
            'school_class_id' => $classId,
            'name' => $validated['name'],
            'room' => $validated['room'] ?? null,
            'capacity' => $validated['capacity'] ?? 35,
        ]);

        return back()->with('success', "Section {$section->name} added to {$class->name} successfully.");
    }

    /**
     * Store a new school class.
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
            'default_section' => 'nullable|string|max:50',
        ]);

        $class = SchoolClass::create([
            'organization_id' => $organization->id,
            'name' => $validated['name'],
            'code' => $validated['code'] ?? null,
            'description' => $validated['description'] ?? null,
        ]);

        // Auto-create initial section
        ClassSection::create([
            'organization_id' => $organization->id,
            'school_class_id' => $class->id,
            'name' => ! empty($validated['default_section']) ? $validated['default_section'] : 'Section A',
            'capacity' => 35,
        ]);

        return back()->with('success', "Class {$class->name} created successfully.");
    }

    /**
     * Store a section for a class.
     */
    public function storeSection(SchoolClass $class, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $class->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'room' => 'nullable|string|max:50',
            'capacity' => 'nullable|integer|min:1|max:200',
        ]);

        ClassSection::create([
            'organization_id' => $organization->id,
            'school_class_id' => $class->id,
            'name' => $validated['name'],
            'room' => $validated['room'] ?? null,
            'capacity' => $validated['capacity'] ?? 35,
        ]);

        return back()->with('success', "Section {$validated['name']} added to {$class->name}.");
    }

    /**
     * Update school class.
     */
    public function update(SchoolClass $class, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $class->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:20',
            'description' => 'nullable|string|max:500',
        ]);

        $class->update($validated);

        return back()->with('success', "Class {$class->name} updated successfully.");
    }

    /**
     * Delete school class.
     */
    public function destroy(SchoolClass $class): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $class->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $className = $class->name;
        $class->delete();

        return back()->with('success', "Class {$className} deleted successfully.");
    }

    /**
     * Update class section.
     */
    public function updateSection(ClassSection $section, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $section->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $validated = $request->validate([
            'school_class_id' => 'required|exists:school_classes,id',
            'name' => 'required|string|max:50',
            'room' => 'nullable|string|max:50',
            'capacity' => 'nullable|integer|min:1|max:200',
        ]);

        $section->update($validated);

        return back()->with('success', "Section {$section->name} updated successfully.");
    }

    /**
     * Delete class section.
     */
    public function destroySection(ClassSection $section): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $section->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageAcademics', $organization);

        $sectionName = $section->name;
        $section->delete();

        return back()->with('success', "Section {$sectionName} deleted successfully.");
    }
}
