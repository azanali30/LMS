<?php

namespace App\Http\Controllers\PlatformAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformAuditLog;
use App\Models\SubscriptionInvoice;
use App\Services\TenantContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformInvoiceController extends Controller
{
    /**
     * Display list of platform billing invoices.
     */
    public function index(Request $request): Response
    {
        return TenantContext::bypass(function () use ($request) {
            $status = $request->query('status');
            $search = $request->query('search');

            $query = SubscriptionInvoice::with(['organization', 'plan', 'user', 'verifier'])
                ->latest();

            if ($status) {
                $query->where('status', $status);
            }

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_number', 'like', "%{$search}%")
                        ->orWhereHas('organization', fn ($org) => $org->where('name', 'like', "%{$search}%"));
                });
            }

            $invoices = $query->paginate(15)->withQueryString()->through(function (SubscriptionInvoice $inv) {
                return [
                    'id' => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'organization_name' => $inv->organization?->name,
                    'plan_name' => $inv->plan?->name,
                    'user_email' => $inv->user?->email,
                    'amount_cents' => $inv->amount_cents,
                    'amount_formatted' => '$' . number_format($inv->amount_cents / 100, 2),
                    'billing_type' => $inv->billing_type,
                    'status' => $inv->status,
                    'payment_reference' => $inv->payment_reference,
                    'due_date' => $inv->due_date?->format('M d, Y'),
                    'paid_at' => $inv->paid_at?->format('M d, Y'),
                    'verified_by_name' => $inv->verifier?->name,
                    'created_at' => $inv->created_at->format('M d, Y'),
                ];
            });

            $counts = [
                'all' => SubscriptionInvoice::count(),
                'pending' => SubscriptionInvoice::where('status', 'pending')->count(),
                'paid' => SubscriptionInvoice::where('status', 'paid')->count(),
                'cancelled' => SubscriptionInvoice::where('status', 'cancelled')->count(),
            ];

            return Inertia::render('platform-admin/invoices/index', [
                'invoices' => $invoices,
                'counts' => $counts,
                'filters' => [
                    'status' => $status,
                    'search' => $search,
                ],
            ]);
        });
    }

    /**
     * Show invoice detail and printable view.
     */
    public function show(int $id): Response
    {
        return TenantContext::bypass(function () use ($id) {
            $inv = SubscriptionInvoice::with(['organization', 'plan', 'user', 'verifier'])->findOrFail($id);

            return Inertia::render('platform-admin/invoices/show', [
                'invoice' => [
                    'id' => $inv->id,
                    'invoice_number' => $inv->invoice_number,
                    'organization' => $inv->organization ? [
                        'name' => $inv->organization->name,
                        'email' => $inv->organization->email,
                        'address' => $inv->organization->address,
                    ] : null,
                    'plan' => $inv->plan ? [
                        'name' => $inv->plan->name,
                        'description' => $inv->plan->description,
                    ] : null,
                    'user' => $inv->user ? [
                        'name' => $inv->user->name,
                        'email' => $inv->user->email,
                    ] : null,
                    'amount_cents' => $inv->amount_cents,
                    'amount_formatted' => '$' . number_format($inv->amount_cents / 100, 2),
                    'currency' => $inv->currency,
                    'status' => $inv->status,
                    'billing_type' => $inv->billing_type,
                    'payment_reference' => $inv->payment_reference,
                    'notes' => $inv->notes,
                    'due_date' => $inv->due_date?->format('F d, Y'),
                    'paid_at' => $inv->paid_at?->format('F d, Y'),
                    'created_at' => $inv->created_at->format('F d, Y'),
                ],
            ]);
        });
    }

    /**
     * Manually verify and mark invoice as paid.
     */
    public function verifyPayment(Request $request, int $id): RedirectResponse
    {
        return TenantContext::bypass(function () use ($request, $id) {
            $inv = SubscriptionInvoice::findOrFail($id);

            $inv->update([
                'status' => 'paid',
                'paid_at' => now(),
                'verified_at' => now(),
                'verified_by' => $request->user()->id,
            ]);

            PlatformAuditLog::record(
                action: 'invoice.verified_paid',
                target: $inv,
                details: [
                    'invoice_number' => $inv->invoice_number,
                    'amount_cents' => $inv->amount_cents,
                ],
                request: $request
            );

            return back()->with('success', "Invoice {$inv->invoice_number} marked as Paid.");
        });
    }
}
