<?php

namespace App\Http\Controllers\Learning;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseCategory;
use App\Models\CourseEnrollment;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    /**
     * Display public course catalog for prospective students / visitors (Landing Page / Public).
     */
    public function index(Request $request): Response
    {
        $query = Course::with(['category', 'instructor'])
            ->withCount(['modules', 'enrollments'])
            ->where('is_public', true)
            ->where('is_published', true);

        if ($categorySlug = $request->query('category')) {
            $query->whereHas('category', function ($q) use ($categorySlug) {
                $q->where('slug', $categorySlug);
            });
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('summary', 'like', "%{$search}%");
            });
        }

        $courses = $query->latest()->paginate(12)->withQueryString();
        $categories = CourseCategory::all();

        return Inertia::render('learning/courses', [
            'courses' => $courses,
            'categories' => $categories,
            'filters' => [
                'category' => $categorySlug,
                'search' => $search,
            ],
            'isDashboard' => false,
        ]);
    }

    /**
     * Display dedicated course catalog inside the institutional dashboard.
     */
    public function dashboardIndex(Request $request): Response
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $query = Course::with(['category', 'instructor', 'modules.lessons'])
            ->withCount(['modules', 'enrollments'])
            ->where('organization_id', $organization->id);

        if ($categorySlug = $request->query('category')) {
            $query->whereHas('category', function ($q) use ($categorySlug) {
                $q->where('slug', $categorySlug);
            });
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('summary', 'like', "%{$search}%");
            });
        }

        $courses = $query->latest()->paginate(12)->withQueryString();
        $categories = CourseCategory::all();

        $courseStats = Course::where('organization_id', $organization->id)
            ->selectRaw('COUNT(*) as total_courses, SUM(CASE WHEN is_published = 1 THEN 1 ELSE 0 END) as published_courses')
            ->first();
        $totalCourses = (int) ($courseStats->total_courses ?? 0);
        $publishedCourses = (int) ($courseStats->published_courses ?? 0);
        $totalModules = CourseModule::where('organization_id', $organization->id)->count();
        $totalEnrollments = CourseEnrollment::where('organization_id', $organization->id)->count();

        $user = $request->user();
        $userRole = TenantContext::currentRole($user);
        $canManage = $user && ($user->isSuperAdmin() || in_array($userRole, ['owner', 'admin', 'teacher'], true));

        return Inertia::render('learning/dashboard-courses', [
            'courses' => $courses,
            'categories' => $categories,
            'canManage' => $canManage,
            'stats' => [
                'totalCourses' => $totalCourses,
                'publishedCourses' => $publishedCourses,
                'totalModules' => $totalModules,
                'totalEnrollments' => $totalEnrollments,
            ],
            'filters' => [
                'category' => $categorySlug,
                'search' => $search,
            ],
        ]);
    }

    /**
     * Show a course with its modules and lessons.
     */
    public function show(Course $course, Request $request): Response
    {
        $organization = TenantContext::current();
        if ($organization && $course->organization_id !== $organization->id && ! $course->is_public) {
            abort(403, 'This course is private to another organization.');
        }

        $course->load(['category', 'instructor', 'modules.lessons']);

        $user = $request->user();
        $isEnrolled = false;
        $enrollment = null;

        if ($user) {
            $enrollment = CourseEnrollment::where('course_id', $course->id)
                ->where('user_id', $user->id)
                ->first();
            $isEnrolled = $enrollment !== null;
        }

        $userRole = $user ? TenantContext::currentRole($user) : null;
        $canManage = $user && ($user->isSuperAdmin() || in_array($userRole, ['owner', 'admin', 'teacher'], true));

        return Inertia::render('learning/course-show', [
            'course' => $course,
            'isEnrolled' => $isEnrolled,
            'enrollment' => $enrollment,
            'canManage' => $canManage,
            'isDashboard' => $organization !== null && $user !== null,
        ]);
    }

    /**
     * Store a new course.
     */
    public function store(Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization) {
            abort(404);
        }

        $this->authorize('manageCourses', $organization);

        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'category_id' => 'nullable|exists:course_categories,id',
            'level' => 'required|string|in:beginner,intermediate,advanced',
            'duration' => 'nullable|string|max:50',
            'summary' => 'required|string|max:500',
            'description' => 'nullable|string',
            'is_published' => 'boolean',
            'is_public' => 'boolean',
        ]);

        $course = Course::create([
            'organization_id' => $organization->id,
            'instructor_id' => $request->user()->id,
            'title' => $validated['title'],
            'slug' => Str::slug($validated['title']).'-'.Str::random(5),
            'category_id' => $validated['category_id'] ?? null,
            'level' => $validated['level'],
            'duration' => $validated['duration'] ?? null,
            'summary' => $validated['summary'],
            'description' => $validated['description'] ?? null,
            'is_published' => $validated['is_published'] ?? true,
            'is_public' => $validated['is_public'] ?? false,
        ]);

        return redirect()->route('courses.show', $course->slug)
            ->with('success', "Course {$course->title} created successfully!");
    }

    /**
     * Enroll authenticated user in the course.
     */
    public function enroll(Course $course, Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->route('login');
        }

        // Verify organization access if course is private
        if (! $course->is_public) {
            $isMember = $user->organizations()
                ->where('organizations.id', $course->organization_id)
                ->exists();

            if (! $isMember && ! $user->isSuperAdmin()) {
                abort(403, 'This course is restricted to members of this organization.');
            }
        }

        CourseEnrollment::firstOrCreate(
            [
                'organization_id' => $course->organization_id,
                'course_id' => $course->id,
                'user_id' => $user->id,
            ],
            [
                'status' => 'in_progress',
                'progress_percent' => 0,
                'enrolled_at' => now(),
            ]
        );

        return back()->with('success', "You have enrolled in {$course->title}!");
    }

    /**
     * Update an existing course.
     */
    public function update(Course $course, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $course->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageCourses', $organization);

        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'category_id' => 'nullable|exists:course_categories,id',
            'level' => 'required|string|in:beginner,intermediate,advanced',
            'duration' => 'nullable|string|max:50',
            'summary' => 'required|string|max:500',
            'description' => 'nullable|string',
            'is_published' => 'boolean',
            'is_public' => 'boolean',
        ]);

        $course->update($validated);

        return back()->with('success', "Course {$course->title} updated successfully.");
    }

    /**
     * Delete an existing course.
     */
    public function destroy(Course $course): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $course->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageCourses', $organization);

        $title = $course->title;
        $course->delete();

        return back()->with('success', "Course {$title} deleted successfully.");
    }

    /**
     * Store a new module for the course syllabus.
     */
    public function storeModule(Course $course, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $course->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageCourses', $organization);

        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'description' => 'nullable|string|max:500',
        ]);

        $maxOrder = CourseModule::where('course_id', $course->id)->max('order') ?? 0;

        CourseModule::create([
            'organization_id' => $organization->id,
            'course_id' => $course->id,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'order' => $maxOrder + 1,
        ]);

        return back()->with('success', 'Syllabus module created successfully.');
    }

    /**
     * Delete a syllabus module.
     */
    public function destroyModule(CourseModule $module): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $module->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageCourses', $organization);

        $module->delete();

        return back()->with('success', 'Syllabus module deleted.');
    }

    /**
     * Store a new lesson inside a syllabus module.
     */
    public function storeLesson(CourseModule $module, Request $request): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $module->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageCourses', $organization);

        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'duration_minutes' => 'nullable|integer|min:1|max:600',
            'is_free_preview' => 'boolean',
            'content' => 'nullable|string',
            'video_url' => 'nullable|string|max:500',
        ]);

        $maxOrder = Lesson::where('course_module_id', $module->id)->max('order') ?? 0;
        $slug = Str::slug($validated['title']).'-'.Str::random(5);

        Lesson::create([
            'organization_id' => $organization->id,
            'course_module_id' => $module->id,
            'title' => $validated['title'],
            'slug' => $slug,
            'duration_minutes' => $validated['duration_minutes'] ?? 15,
            'is_free_preview' => $validated['is_free_preview'] ?? false,
            'content' => $validated['content'] ?? null,
            'video_url' => $validated['video_url'] ?? null,
            'order' => $maxOrder + 1,
        ]);

        $enrolledUserIds = \App\Models\CourseEnrollment::where('organization_id', $organization->id)
            ->where('course_id', $module->course_id)
            ->pluck('user_id')
            ->unique();

        if ($enrolledUserIds->isNotEmpty()) {
            app(\App\Services\NotificationDispatcher::class)->toUsers(
                recipients: \App\Models\User::whereIn('id', $enrolledUserIds)->get(),
                organizationId: $organization->id,
                category: 'academics',
                title: "New Learning Material: {$validated['title']}",
                message: "A new lesson '{$validated['title']}' has been added to your course.",
                url: "/courses/{$module->course_id}",
                icon: 'book-open',
                severity: 'info',
            );
        }

        return back()->with('success', 'Lesson added to syllabus successfully.');
    }

    /**
     * Delete a lesson.
     */
    public function destroyLesson(Lesson $lesson): RedirectResponse
    {
        $organization = TenantContext::current();
        if (! $organization || $lesson->organization_id !== $organization->id) {
            abort(403);
        }

        $this->authorize('manageCourses', $organization);

        $lesson->delete();

        return back()->with('success', 'Lesson removed from syllabus.');
    }
}
