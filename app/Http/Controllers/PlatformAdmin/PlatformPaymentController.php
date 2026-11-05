<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Mail\PaymentApprovedMail;
use App\Mail\PaymentRejectedMail;
use App\Models\PaymentApprovalRequest;
use App\Models\PlatformAuditLog;
use App\Services\TenantContext;
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

class PlatformPaymentController extends Controller
{
    /**
     * Display Payment Verification Queue and History.
     */
    public function index(Request $request): Response
    {
        return TenantContext::bypass(function () use ($request) {
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

            return Inertia::render('platform-admin/payments/index', [
                'requests' => $requests,
                'counts' => $counts,
                'currentStatus' => $statusFilter,
                'search' => $search,
            ]);
        });
    }

    /**
     * Approve manual payment request and issue completion token.
     */
    public function approve(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $approvalRequest = PaymentApprovalRequest::findOrFail($id);

            if ($approvalRequest->status !== PaymentApprovalRequest::STATUS_PENDING) {
                return back()->with('error', 'This payment request is not in pending status.');
            }

            DB::transaction(function () use ($approvalRequest, $request) {
                $token = Str::random(64);
                $approvalRequest->update([
                    'status' => PaymentApprovalRequest::STATUS_APPROVED,
                    'approved_at' => now(),
                    'approved_by' => $request->user()->id,
                    'completion_token' => $token,
                    'token_expires_at' => Carbon::now()->addDays(7),
                ]);
            });

            // Send notification email
            $completionUrl = url("/onboarding/complete/{$approvalRequest->completion_token}");
            rescue(function () use ($approvalRequest, $completionUrl) {
                Mail::to($approvalRequest->email)->send(
                    new PaymentApprovedMail($approvalRequest, $completionUrl)
                );
            }, report: true);

            PlatformAuditLog::record(
                action: 'payment.approved',
                target: $approvalRequest,
                details: [
                    'email' => $approvalRequest->email,
                    'amount' => $approvalRequest->formattedAmount(),
                    'reference' => $approvalRequest->transaction_reference,
                ],
                request: $request
            );

            return back()->with('success', "Payment for {$approvalRequest->email} approved successfully.");
        });
    }

    /**
     * Reject manual payment request.
     */
    public function reject(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $validated = $request->validate([
                'reason' => ['required', 'string', 'min:5', 'max:500'],
            ]);

            $approvalRequest = PaymentApprovalRequest::findOrFail($id);

            if ($approvalRequest->status !== PaymentApprovalRequest::STATUS_PENDING) {
                return back()->with('error', 'This payment request is not in pending status.');
            }

            $approvalRequest->update([
                'status' => PaymentApprovalRequest::STATUS_REJECTED,
                'rejected_at' => now(),
                'rejected_by' => $request->user()->id,
                'rejection_reason' => $validated['reason'],
                'completion_token' => null,
            ]);

            // Send rejection email
            $resubmitUrl = url("/register?email=" . urlencode($approvalRequest->email));
            rescue(function () use ($approvalRequest, $resubmitUrl) {
                Mail::to($approvalRequest->email)->send(
                    new PaymentRejectedMail($approvalRequest, $resubmitUrl)
                );
            }, report: true);

            PlatformAuditLog::record(
                action: 'payment.rejected',
                target: $approvalRequest,
                details: [
                    'email' => $approvalRequest->email,
                    'reason' => $validated['reason'],
                ],
                request: $request
            );

            return back()->with('success', "Payment for {$approvalRequest->email} rejected.");
        });
    }

    /**
     * Stream receipt attachment.
     */
    public function downloadReceipt(int $id): StreamedResponse
    {
        return TenantContext::bypass(function () use ($id) {
            $req = PaymentApprovalRequest::findOrFail($id);

            if (! Storage::disk('local')->exists($req->receipt_path)) {
                abort(404, 'Receipt file not found on private storage.');
            }

            return Storage::disk('local')->download(
                $req->receipt_path,
                $req->receipt_original_name ?: 'payment-receipt.jpg'
            );
        });
    }
}
