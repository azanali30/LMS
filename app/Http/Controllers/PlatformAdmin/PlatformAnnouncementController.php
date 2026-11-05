<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformAnnouncement;
use App\Models\PlatformAuditLog;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformAnnouncementController extends Controller
{
    /**
     * Display platform announcements.
     */
    public function index(): Response
    {
        return TenantContext::bypass(function () {
            $announcements = PlatformAnnouncement::with('creator')
                ->latest()
                ->paginate(15)
                ->through(function (PlatformAnnouncement $a) {
                    return [
                        'id' => $a->id,
                        'title' => $a->title,
                        'content' => $a->content,
                        'type' => $a->type,
                        'target_audience' => $a->target_audience,
                        'is_published' => (bool) $a->is_published,
                        'published_at' => $a->published_at?->format('M d, Y h:i A'),
                        'creator_name' => $a->creator?->name,
                        'created_at' => $a->created_at->format('M d, Y'),
                    ];
                });

            return Inertia::render('platform-admin/announcements/index', [
                'announcements' => $announcements,
            ]);
        });
    }

    /**
     * Create a new announcement.
     */
    public function store(Request $request): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request) {
            $validated = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'content' => ['required', 'string'],
                'type' => ['required', 'in:info,warning,critical,maintenance'],
                'target_audience' => ['required', 'in:all,owners,teachers,students'],
                'is_published' => ['boolean'],
            ]);

            $isPublished = $request->boolean('is_published');

            $announcement = PlatformAnnouncement::create([
                'title' => $validated['title'],
                'content' => $validated['content'],
                'type' => $validated['type'],
                'target_audience' => $validated['target_audience'],
                'is_published' => $isPublished,
                'published_at' => $isPublished ? now() : null,
                'created_by' => $request->user()->id,
            ]);

            PlatformAuditLog::record(
                action: 'announcement.created',
                target: $announcement,
                details: ['title' => $announcement->title, 'is_published' => $isPublished],
                request: $request
            );

            return back()->with('success', "Announcement '{$announcement->title}' created.");
        });
    }

    /**
     * Publish an announcement immediately.
     */
    public function publish(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $announcement = PlatformAnnouncement::findOrFail($id);

            $announcement->update([
                'is_published' => true,
                'published_at' => now(),
            ]);

            PlatformAuditLog::record(
                action: 'announcement.published',
                target: $announcement,
                details: ['title' => $announcement->title],
                request: $request
            );

            return back()->with('success', "Announcement '{$announcement->title}' published.");
        });
    }

    /**
     * Delete an announcement.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $announcement = PlatformAnnouncement::findOrFail($id);
            $title = $announcement->title;

            $announcement->delete();

            PlatformAuditLog::record(
                action: 'announcement.deleted',
                details: ['title' => $title],
                request: $request
            );

            return back()->with('success', "Announcement '{$title}' deleted.");
        });
    }
}
