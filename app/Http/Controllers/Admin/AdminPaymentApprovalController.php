<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\PaymentApprovedMail;
use App\Mail\PaymentRejectedMail;
use App\Models\PaymentApprovalRequest;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminPaymentApprovalController extends Controller
{
    /**
     * Display the Platform Admin Payment Approvals Panel.
     */
    public function index(Request $request): Response
    {
        $this->ensureSuperAdmin($request);

        $statusFilter = $request->query('status', 'pending');
        $search = $request->query('search');

        $query = PaymentApprovalRequest::with(['approver', 'rejecter', 'createdOrganization'])
            ->latest();

        if ($statusFilter && in_array($statusFilter, ['pending', 'approved', 'rejected'], true)) {
            $query->where('status', $statusFilter);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('transaction_reference', 'like', "%{$search}%");
            });
        }

        $requests = $query->paginate(15)->withQueryString()->through(function (PaymentApprovalRequest $req) {
            return [
                'id' => $req->id,
                'email' => $req->email,
                'plan_slug' => $req->plan_slug,
                'plan_name' => $req->planDisplayName(),
                'billing_interval' => $req->billing_interval,
                'amount_cents' => $req->amount_cents,
                'amount_formatted' => $req->formattedAmount(),
                'payment_method' => $req->payment_method,
                'transaction_reference' => $req->transaction_reference,
                'has_receipt' => ! empty($req->receipt_path) && Storage::disk('local')->exists($req->receipt_path),
                'receipt_original_name' => $req->receipt_original_name,
                'receipt_mime' => $req->receipt_mime,
                'receipt_size_bytes' => $req->receipt_size_bytes,
                'notes' => $req->notes,
                'status' => $req->status,
                'rejection_reason' => $req->rejection_reason,
                'approved_at' => $req->approved_at?->format('M d, Y h:i A'),
                'approved_by_name' => $req->approver?->name,
                'rejected_at' => $req->rejected_at?->format('M d, Y h:i A'),
                'rejected_by_name' => $req->rejecter?->name,
                'completed_at' => $req->completed_at?->format('M d, Y h:i A'),
                'created_org_name' => $req->createdOrganization?->name,
                'created_at' => $req->created_at->format('M d, Y h:i A'),
                'completion_url' => $req->isTokenValid() ? url("/onboarding/complete/{$req->completion_token}") : null,
            ];
        });

        $counts = [
            'pending' => PaymentApprovalRequest::where('status', PaymentApprovalRequest::STATUS_PENDING)->count(),
            'approved' => PaymentApprovalRequest::where('status', PaymentApprovalRequest::STATUS_APPROVED)->count(),
            'rejected' => PaymentApprovalRequest::where('status', PaymentApprovalRequest::STATUS_REJECTED)->count(),
            'all' => PaymentApprovalRequest::count(),
        ];

        return Inertia::render('admin/payment-approvals', [
            'requests' => $requests,
            'counts' => $counts,
            'currentStatus' => $statusFilter,
            'search' => $search,
        ]);
    }

    /**
     * Securely stream/download uploaded payment receipt (superadmin only).
     */
    public function downloadReceipt(Request $request, int $id): StreamedResponse
    {
        $this->ensureSuperAdmin($request);

        $approvalRequest = PaymentApprovalRequest::findOrFail($id);

        if (! Storage::disk('local')->exists($approvalRequest->receipt_path)) {
            abort(404, 'Receipt file not found on private storage.');
        }

        $filename = $approvalRequest->receipt_original_name ?: "receipt-{$approvalRequest->id}.png";
        $mime = $approvalRequest->receipt_mime ?: 'application/octet-stream';

        return Storage::disk('local')->response(
            $approvalRequest->receipt_path,
            $filename,
            ['Content-Type' => $mime]
        );
    }

    /**
     * Approve a pending payment request.
     */
    public function approve(Request $request, int $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);
        $user = $request->user();

        $approvalRequest = DB::transaction(function () use ($id, $user) {
            $req = PaymentApprovalRequest::where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($req->status === PaymentApprovalRequest::STATUS_APPROVED) {
                return $req; // Idempotent
            }

            if ($req->status !== PaymentApprovalRequest::STATUS_PENDING) {
                abort(422, "Cannot approve request in status '{$req->status}'.");
            }

            $token = Str::random(64);
            $expiresAt = Carbon::now()->addDays(7);

            $req->update([
                'status' => PaymentApprovalRequest::STATUS_APPROVED,
                'pending_email' => null,
                'approved_by' => $user->id,
                'approved_at' => now(),
                'completion_token' => $token,
                'token_expires_at' => $expiresAt,
            ]);

            return $req;
        });

        // Send email notification with completion link (safe against local mail errors)
        $completionUrl = url("/onboarding/complete/{$approvalRequest->completion_token}");
        rescue(function () use ($approvalRequest, $completionUrl) {
            Mail::to($approvalRequest->email)->send(new PaymentApprovedMail($approvalRequest, $completionUrl));
        }, report: false);

        return back()->with('success', "Payment for {$approvalRequest->email} approved! A secure completion link has been issued.");
    }

    /**
     * Reject a payment request with a reason.
     */
    public function reject(Request $request, int $id): RedirectResponse
    {
        $this->ensureSuperAdmin($request);
        $user = $request->user();

        $validated = $request->validate([
            'rejection_reason' => ['required', 'string', 'max:1000'],
        ]);

        $approvalRequest = DB::transaction(function () use ($id, $user, $validated) {
            $req = PaymentApprovalRequest::where('id', $id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($req->status === PaymentApprovalRequest::STATUS_REJECTED) {
                return $req;
            }

            if ($req->status !== PaymentApprovalRequest::STATUS_PENDING) {
                abort(422, "Cannot reject request in status '{$req->status}'.");
            }

            $req->update([
                'status' => PaymentApprovalRequest::STATUS_REJECTED,
                'pending_email' => null,
                'rejection_reason' => trim($validated['rejection_reason']),
                'rejected_by' => $user->id,
                'rejected_at' => now(),
                'completion_token' => null,
            ]);

            return $req;
        });

        // Send rejection notification email with resubmission link
        $resubmitUrl = url("/register?email=".urlencode($approvalRequest->email));
        rescue(function () use ($approvalRequest, $resubmitUrl) {
            Mail::to($approvalRequest->email)->send(new PaymentRejectedMail($approvalRequest, $resubmitUrl));
        }, report: false);

        return back()->with('success', "Payment for {$approvalRequest->email} has been rejected. Notification sent.");
    }

    /**
     * Guard: Ensure current authenticated user is a platform-level Super Admin.
     */
    private function ensureSuperAdmin(Request $request): void
    {
        abort_unless($request->user()?->isSuperAdmin(), 403, 'Unauthorized. Platform administrator privileges required.');
    }
}
