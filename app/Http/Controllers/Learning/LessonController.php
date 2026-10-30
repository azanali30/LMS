<?php

namespace App\Http\Controllers\Learning;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\CourseCertificate;
use App\Models\CourseEnrollment;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class LessonController extends Controller
{
    /**
     * Display a lesson within its course curriculum.
     */
    public function show(Course $course, Lesson $lesson, Request $request): Response
    {
        $organization = TenantContext::current();
        if ($organization && $course->organization_id !== $organization->id && ! $course->is_public) {
            abort(403);
        }

        $user = $request->user();
        if (! $lesson->is_free_preview && ! $user) {
            return redirect()->route('login');
        }

        $course->load(['modules.lessons']);

        $isCompleted = false;
        if ($user) {
            $isCompleted = LessonCompletion::where('lesson_id', $lesson->id)
                ->where('user_id', $user->id)
                ->exists();
        }

        $completedLessonIds = $user
            ? LessonCompletion::where('course_id', $course->id)
                ->where('user_id', $user->id)
                ->pluck('lesson_id')
                ->toArray()
            : [];

        return Inertia::render('learning/lesson-view', [
            'course' => $course,
            'lesson' => $lesson,
            'isCompleted' => $isCompleted,
            'completedLessonIds' => $completedLessonIds,
        ]);
    }

    /**
     * Mark a lesson as completed and recalculate course progress.
     */
    public function complete(Course $course, Lesson $lesson, Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        LessonCompletion::firstOrCreate(
            [
                'organization_id' => $course->organization_id,
                'course_id' => $course->id,
                'lesson_id' => $lesson->id,
                'user_id' => $user->id,
            ],
            [
                'completed_at' => now(),
            ]
        );

        // Recalculate progress
        $totalLessons = Lesson::whereHas('module', function ($q) use ($course) {
            $q->where('course_id', $course->id);
        })->count();

        $completedLessons = LessonCompletion::where('course_id', $course->id)
            ->where('user_id', $user->id)
            ->count();

        $progressPercent = $totalLessons > 0 ? (int) round(($completedLessons / $totalLessons) * 100) : 100;

        $enrollment = CourseEnrollment::firstOrCreate(
            [
                'organization_id' => $course->organization_id,
                'course_id' => $course->id,
                'user_id' => $user->id,
            ],
            [
                'status' => 'in_progress',
                'progress_percent' => 0,
            ]
        );

        $enrollment->update([
            'progress_percent' => $progressPercent,
            'status' => $progressPercent >= 100 ? 'completed' : 'in_progress',
            'completed_at' => $progressPercent >= 100 ? now() : null,
        ]);

        // Auto-generate certificate if 100% complete
        if ($progressPercent >= 100) {
            CourseCertificate::firstOrCreate(
                [
                    'organization_id' => $course->organization_id,
                    'course_id' => $course->id,
                    'user_id' => $user->id,
                ],
                [
                    'certificate_number' => 'CERT-'.strtoupper(Str::random(10)),
                    'issued_at' => now(),
                ]
            );
        }

        return back()->with('success', 'Lesson completed!');
    }
}
