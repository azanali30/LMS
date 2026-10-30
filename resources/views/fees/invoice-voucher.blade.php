<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fee Voucher #{{ $invoice->invoice_number }} - {{ $invoice->student?->name }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background: #f8fafc; color: #0f172a; padding: 24px; font-size: 13px; }
        .voucher-container { max-width: 900px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); padding: 32px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 24px; }
        .org-name { font-size: 24px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.5px; }
        .org-sub { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .voucher-title { text-align: right; }
        .voucher-badge { display: inline-block; background: #8b5cf6; color: white; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .invoice-num { font-size: 18px; font-weight: 800; color: #0f172a; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-top: 4px; }
        .status-paid { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
        .status-partially_paid { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
        .status-unpaid { background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa; }
        .status-overdue { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        
        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; }
        .meta-group h4 { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 12px; }
        .meta-label { color: #64748b; }
        .meta-val { font-weight: 600; color: #0f172a; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f1f5f9; color: #475569; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: left; padding: 10px 14px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
        .text-right { text-align: right; }
        .font-semibold { font-weight: 600; }
        
        .totals-section { display: flex; justify-content: flex-end; margin-bottom: 28px; }
        .totals-table { width: 340px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 12px; }
        .totals-row.grand-total { border-top: 2px solid #e2e8f0; border-bottom: 2px solid #e2e8f0; padding: 10px 0; font-size: 15px; font-weight: 800; color: #1e1b4b; }
        .totals-row.balance { font-size: 16px; font-weight: 800; color: #b91c1c; padding: 8px 0; }
        .totals-row.balance.cleared { color: #047857; }

        .payment-history { margin-bottom: 28px; }
        .payment-history h4 { font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 0.5px; }

        .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center; }
        .sig-box { padding-top: 35px; border-top: 1px solid #94a3b8; font-size: 11px; font-weight: 600; color: #475569; }

        .actions-bar { max-width: 900px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; }
        .btn-print { background: #8b5cf6; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(139,92,246,0.2); }
        .btn-print:hover { background: #7c3aed; }
        .btn-back { color: #64748b; text-decoration: none; font-size: 12px; font-weight: 600; }

        @media print {
            body { background: white; padding: 0; }
            .voucher-container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
            .actions-bar { display: none; }
        }
    </style>
</head>
<body>
    <div class="actions-bar">
        <a href="javascript:window.history.back()" class="btn-back">&larr; Back to Portal</a>
        <button onclick="window.print()" class="btn-print">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print / Save as PDF
        </button>
    </div>

    <div class="voucher-container">
        <!-- Header -->
        <div class="header">
            <div>
                <div class="org-name">{{ $organization->name }}</div>
                <div class="org-sub">Institutional Fee Voucher • Billing & Finance Department</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Academic Year: {{ $invoice->academicYear?->name ?? 'Current Session' }}</div>
            </div>
            <div class="voucher-title">
                <span class="voucher-badge">Official Fee Invoice</span>
                <div class="invoice-num">{{ $invoice->invoice_number }}</div>
                <div>
                    <span class="status-badge status-{{ $invoice->status }}">
                        {{ strtoupper(str_replace('_', ' ', $invoice->status)) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Student & Billing Meta -->
        <div class="meta-grid">
            <div class="meta-group">
                <h4>Student Information</h4>
                <div class="meta-row">
                    <span class="meta-label">Student Name:</span>
                    <span class="meta-val">{{ $invoice->student?->name ?? 'N/A' }}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Admission No:</span>
                    <span class="meta-val">{{ $invoice->student?->studentProfile?->admission_number ?? 'N/A' }}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Class & Section:</span>
                    <span class="meta-val">{{ $invoice->schoolClass?->name ?? 'N/A' }} - {{ $invoice->classSection?->name ?? 'N/A' }}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Roll Number:</span>
                    <span class="meta-val">{{ $invoice->studentEnrollment?->roll_number ?? 'N/A' }}</span>
                </div>
            </div>

            <div class="meta-group">
                <h4>Voucher & Payment Details</h4>
                <div class="meta-row">
                    <span class="meta-label">Billing Month:</span>
                    <span class="meta-val">{{ $invoice->billing_month ? $invoice->billing_month->format('F Y') : 'N/A' }}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Issue Date:</span>
                    <span class="meta-val">{{ $invoice->issue_date ? $invoice->issue_date->format('M d, Y') : 'N/A' }}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Payment Due Date:</span>
                    <span class="meta-val" style="color: #b91c1c;">{{ $invoice->due_date ? $invoice->due_date->format('M d, Y') : 'N/A' }}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Currency:</span>
                    <span class="meta-val">{{ $currency }}</span>
                </div>
            </div>
        </div>

        <!-- Fee Items Table -->
        <table>
            <thead>
                <tr>
                    <th style="width: 50px;">#</th>
                    <th>Fee Description</th>
                    <th>Category</th>
                    <th class="text-right">Amount ({{ $currency }})</th>
                </tr>
            </thead>
            <tbody>
                @forelse($invoice->items as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td class="font-semibold">{{ $item->description }}</td>
                    <td style="color: #64748b; text-transform: capitalize;">{{ $item->fee_type }}</td>
                    <td class="text-right font-semibold">{{ number_format((float) $item->amount, 2) }}</td>
                </tr>
                @empty
                <tr>
                    <td>1</td>
                    <td class="font-semibold">Tuition & Institutional Charges</td>
                    <td>Tuition</td>
                    <td class="text-right font-semibold">{{ number_format((float) $invoice->subtotal, 2) }}</td>
                </tr>
                @endforelse
            </tbody>
        </table>

        <!-- Totals & Balances -->
        <div class="totals-section">
            <div class="totals-table">
                <div class="totals-row">
                    <span class="meta-label">Subtotal:</span>
                    <span class="font-semibold">{{ number_format((float) $invoice->subtotal, 2) }} {{ $currency }}</span>
                </div>
                @if($invoice->discount_amount > 0)
                <div class="totals-row" style="color: #c2410c;">
                    <span>Concession / Discount {{ $invoice->discount_reason ? "({$invoice->discount_reason})" : '' }}:</span>
                    <span class="font-semibold">-{{ number_format((float) $invoice->discount_amount, 2) }} {{ $currency }}</span>
                </div>
                @endif
                @if($invoice->late_fee > 0)
                <div class="totals-row" style="color: #b91c1c;">
                    <span>Late Payment Surcharge:</span>
                    <span class="font-semibold">+{{ number_format((float) $invoice->late_fee, 2) }} {{ $currency }}</span>
                </div>
                @endif
                <div class="totals-row grand-total">
                    <span>Total Invoiced:</span>
                    <span>{{ number_format((float) $invoice->total_amount, 2) }} {{ $currency }}</span>
                </div>
                <div class="totals-row" style="color: #047857; padding-top: 6px;">
                    <span>Amount Paid to Date:</span>
                    <span class="font-semibold">{{ number_format((float) $invoice->paid_amount, 2) }} {{ $currency }}</span>
                </div>
                <div class="totals-row balance {{ $invoice->balance_due <= 0.0001 ? 'cleared' : '' }}">
                    <span>Remaining Balance Due:</span>
                    <span>{{ number_format((float) $invoice->balance_due, 2) }} {{ $currency }}</span>
                </div>
            </div>
        </div>

        <!-- Recorded Payments Ledger -->
        @if($invoice->payments->isNotEmpty())
        <div class="payment-history">
            <h4>Verified Payment Ledger Records</h4>
            <table>
                <thead>
                    <tr>
                        <th>Receipt No</th>
                        <th>Payment Date</th>
                        <th>Method</th>
                        <th>Reference / Cheque</th>
                        <th>Received By</th>
                        <th class="text-right">Amount Paid</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($invoice->payments as $payment)
                    <tr>
                        <td class="font-semibold" style="color: #8b5cf6;">{{ $payment->payment_number }}</td>
                        <td>{{ $payment->payment_date ? $payment->payment_date->format('M d, Y') : 'N/A' }}</td>
                        <td style="text-transform: capitalize;">{{ str_replace('_', ' ', $payment->payment_method) }}</td>
                        <td>{{ $payment->reference_number ?: '-' }}</td>
                        <td>{{ $payment->receiver?->name ?? 'Staff Cashier' }}</td>
                        <td class="text-right font-semibold" style="color: #047857;">{{ number_format((float) $payment->amount, 2) }} {{ $currency }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif

        @if($invoice->notes)
        <div style="background: #f8fafc; border-left: 3px solid #8b5cf6; padding: 10px 14px; font-size: 11px; color: #475569; margin-bottom: 24px;">
            <strong>Institutional Notes:</strong> {{ $invoice->notes }}
        </div>
        @endif

        <!-- Signatures & Verification -->
        <div class="signatures">
            <div class="sig-box">Depositor / Guardian Signature</div>
            <div class="sig-box">Accounts & Cashier Stamp</div>
            <div class="sig-box">Principal / Authorized Official</div>
        </div>
    </div>
</body>
</html>
