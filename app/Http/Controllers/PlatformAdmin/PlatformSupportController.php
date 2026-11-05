<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformAuditLog;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSupportController extends Controller
{
    /**
     * Display support tickets queue.
     */
    public function index(Request $request): Response
    {
        return TenantContext::bypass(function () use ($request) {
            $status = $request->query('status');
            $priority = $request->query('priority');
            $search = $request->query('search');

            $query = SupportTicket::with(['organization', 'user', 'assignee'])
                ->withCount('messages')
                ->latest();

            if ($status) {
                $query->where('status', $status);
            }

            if ($priority) {
                $query->where('priority', $priority);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('ticket_number', 'like', "%{$search}%")
                        ->orWhere('subject', 'like', "%{$search}%")
                        ->orWhereHas('user', fn ($u) => $u->where('email', 'like', "%{$search}%"));
                });
            }

            $tickets = $query->paginate(15)->withQueryString()->through(function (SupportTicket $t) {
                return [
                    'id' => $t->id,
                    'ticket_number' => $t->ticket_number,
                    'subject' => $t->subject,
                    'priority' => $t->priority,
                    'status' => $t->status,
                    'organization_name' => $t->organization?->name,
                    'user_name' => $t->user?->name,
                    'user_email' => $t->user?->email,
                    'assignee_name' => $t->assignee?->name,
                    'messages_count' => $t->messages_count,
                    'created_at' => $t->created_at->format('M d, Y h:i A'),
                ];
            });

            $counts = [
                'all' => SupportTicket::count(),
                'open' => SupportTicket::where('status', 'open')->count(),
                'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
                'waiting_response' => SupportTicket::where('status', 'waiting_response')->count(),
                'resolved' => SupportTicket::where('status', 'resolved')->count(),
            ];

            return Inertia::render('platform-admin/support/index', [
                'tickets' => $tickets,
                'counts' => $counts,
                'filters' => [
                    'status' => $status,
                    'priority' => $priority,
                    'search' => $search,
                ],
            ]);
        });
    }

    /**
     * Show detailed support ticket conversation.
     */
    public function show(int $id): Response
    {
        return TenantContext::bypass(function () use ($id) {
            $ticket = SupportTicket::with(['organization', 'user', 'assignee', 'messages.user'])
                ->findOrFail($id);

            return Inertia::render('platform-admin/support/show', [
                'ticket' => [
                    'id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'subject' => $ticket->subject,
                    'priority' => $ticket->priority,
                    'status' => $ticket->status,
                    'organization' => $ticket->organization ? [
                        'id' => $ticket->organization->id,
                        'name' => $ticket->organization->name,
                    ] : null,
                    'user' => [
                        'id' => $ticket->user->id,
                        'name' => $ticket->user->name,
                        'email' => $ticket->user->email,
                    ],
                    'assignee' => $ticket->assignee ? [
                        'id' => $ticket->assignee->id,
                        'name' => $ticket->assignee->name,
                    ] : null,
                    'created_at' => $ticket->created_at->format('M d, Y h:i A'),
                    'messages' => $ticket->messages->map(fn ($m) => [
                        'id' => $m->id,
                        'message' => $m->message,
                        'is_internal_note' => (bool) $m->is_internal_note,
                        'user_name' => $m->user?->name ?? 'System',
                        'user_role' => $m->user?->role,
                        'created_at' => $m->created_at->format('M d, Y h:i A'),
                    ]),
                ],
            ]);
        });
    }

    /**
     * Post reply or internal staff note.
     */
    public function reply(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $ticket = SupportTicket::findOrFail($id);

            $validated = $request->validate([
                'message' => ['required', 'string', 'min:2'],
                'is_internal_note' => ['boolean'],
                'new_status' => ['nullable', 'string', 'in:open,in_progress,waiting_response,resolved,closed'],
            ]);

            SupportTicketMessage::create([
                'ticket_id' => $ticket->id,
                'user_id' => $request->user()->id,
                'message' => $validated['message'],
                'is_internal_note' => $request->boolean('is_internal_note'),
            ]);

            $newStatus = $validated['new_status'] ?? ($request->boolean('is_internal_note') ? $ticket->status : 'waiting_response');

            $ticket->update([
                'status' => $newStatus,
                'assigned_to' => $ticket->assigned_to ?: $request->user()->id,
                'resolved_at' => in_array($newStatus, ['resolved', 'closed']) ? now() : null,
            ]);

            PlatformAuditLog::record(
                action: 'support_ticket.replied',
                target: $ticket,
                details: [
                    'ticket_number' => $ticket->ticket_number,
                    'is_internal_note' => $request->boolean('is_internal_note'),
                    'status' => $newStatus,
                ],
                request: $request
            );

            return back()->with('success', 'Response recorded successfully.');
        });
    }

    /**
     * Update ticket status.
     */
    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $ticket = SupportTicket::findOrFail($id);

            $validated = $request->validate([
                'status' => ['required', 'string', 'in:open,in_progress,waiting_response,resolved,closed'],
            ]);

            $ticket->update([
                'status' => $validated['status'],
                'resolved_at' => in_array($validated['status'], ['resolved', 'closed']) ? now() : null,
            ]);

            PlatformAuditLog::record(
                action: 'support_ticket.status_changed',
                target: $ticket,
                details: [
                    'ticket_number' => $ticket->ticket_number,
                    'status' => $validated['status'],
                ],
                request: $request
            );

            return back()->with('success', "Ticket status updated to {$validated['status']}.");
        });
    }
}
