<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Receipt #{{ $payment->payment_number }} - {{ $payment->student?->name }}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background: #f8fafc; color: #0f172a; padding: 24px; font-size: 13px; }
        .receipt-container { max-width: 750px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); padding: 36px; position: relative; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 24px; }
        .org-name { font-size: 22px; font-weight: 800; color: #064e3b; letter-spacing: -0.5px; }
        .org-sub { font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .receipt-badge { display: inline-block; background: #059669; color: white; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
        .receipt-num { font-size: 18px; font-weight: 800; color: #0f172a; text-align: right; }
        
        .meta-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .meta-row { display: flex; flex-direction: column; }
        .meta-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
        .meta-val { font-size: 13px; font-weight: 700; color: #0f172a; }

        .amount-highlight { background: #ecfdf5; border: 2px dashed #059669; border-radius: 10px; padding: 20px; text-align: center; margin-bottom: 28px; }
        .amount-highlight .label { font-size: 12px; text-transform: uppercase; color: #047857; font-weight: 700; letter-spacing: 1px; }
        .amount-highlight .val { font-size: 32px; font-weight: 900; color: #065f46; margin: 4px 0; }
        .amount-highlight .status { font-size: 12px; color: #047857; font-weight: 600; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; text-align: left; padding: 10px 14px; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
        .text-right { text-align: right; }

        .signatures { display: grid; grid-template-columns: repeat(2, 1fr); gap: 40px; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #cbd5e1; text-align: center; }
        .sig-box { padding-top: 35px; border-top: 1px solid #94a3b8; font-size: 11px; font-weight: 600; color: #475569; }

        .actions-bar { max-width: 750px; margin: 0 auto 16px auto; display: flex; justify-content: space-between; align-items: center; }
        .btn-print { background: #059669; color: white; border: none; padding: 8px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; gap: 6px; box-shadow: 0 2px 4px rgba(5,150,105,0.2); }
        .btn-print:hover { background: #047857; }
        .btn-back { color: #64748b; text-decoration: none; font-size: 12px; font-weight: 600; }

        @media print {
            body { background: white; padding: 0; }
            .receipt-container { border: none; box-shadow: none; padding: 0; max-width: 100%; }
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

    <div class="receipt-container">
        <!-- Header -->
        <div class="header">
            <div>
                <div class="org-name">{{ $organization->name }}</div>
                <div class="org-sub">Official Institutional Payment Receipt</div>
                <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Verified Transaction Record</div>
            </div>
            <div>
                <span class="receipt-badge">Verified Receipt</span>
                <div class="receipt-num">{{ $payment->payment_number }}</div>
                <div style="font-size: 11px; color: #64748b; text-align: right; margin-top: 2px;">
                    Date: {{ $payment->payment_date ? $payment->payment_date->format('M d, Y') : now()->format('M d, Y') }}
                </div>
            </div>
        </div>

        <!-- Student & Payment Meta -->
        <div class="meta-box">
            <div class="meta-row">
                <span class="meta-label">Received From (Student):</span>
                <span class="meta-val">{{ $payment->student?->name ?? 'Enrolled Student' }}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Admission Number:</span>
                <span class="meta-val">{{ $payment->student?->studentProfile?->admission_number ?? 'N/A' }}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Class & Section:</span>
                <span class="meta-val">{{ $payment->invoice?->schoolClass?->name ?? 'N/A' }} - {{ $payment->invoice?->classSection?->name ?? 'N/A' }}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Payment Method:</span>
                <span class="meta-val" style="text-transform: capitalize;">{{ str_replace('_', ' ', $payment->payment_method) }}</span>
            </div>
            @if($payment->reference_number)
            <div class="meta-row">
                <span class="meta-label">Reference / Transaction ID:</span>
                <span class="meta-val">{{ $payment->reference_number }}</span>
            </div>
            @endif
            <div class="meta-row">
                <span class="meta-label">Received & Verified By:</span>
                <span class="meta-val">{{ $payment->receiver?->name ?? 'Accounts Officer' }}</span>
            </div>
        </div>

        <!-- Amount Box -->
        <div class="amount-highlight">
            <div class="label">Amount Successfully Received</div>
            <div class="val">{{ number_format((float) $payment->amount, 2) }} {{ $currency }}</div>
            <div class="status">Payment Settled & Applied to Invoice #{{ $invoice->invoice_number }}</div>
        </div>

        <!-- Invoice Allocation Breakdown -->
        <table>
            <thead>
                <tr>
                    <th>Invoice Number</th>
                    <th>Billing Period</th>
                    <th class="text-right">Total Invoiced</th>
                    <th class="text-right">Total Paid</th>
                    <th class="text-right">Balance Due</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="font-weight: 700; color: #047857;">{{ $invoice->invoice_number }}</td>
                    <td>{{ $invoice->billing_month ? $invoice->billing_month->format('F Y') : 'Current Session' }}</td>
                    <td class="text-right">{{ number_format((float) $invoice->total_amount, 2) }} {{ $currency }}</td>
                    <td class="text-right" style="font-weight: 700; color: #047857;">{{ number_format((float) $invoice->paid_amount, 2) }} {{ $currency }}</td>
                    <td class="text-right" style="font-weight: 700; color: {{ $invoice->balance_due <= 0.0001 ? '#047857' : '#b91c1c' }};">
                        {{ number_format((float) $invoice->balance_due, 2) }} {{ $currency }}
                    </td>
                </tr>
            </tbody>
        </table>

        @if($payment->notes)
        <div style="background: #f8fafc; border-left: 3px solid #059669; padding: 10px 14px; font-size: 11px; color: #475569; margin-bottom: 24px;">
            <strong>Payment Notes:</strong> {{ $payment->notes }}
        </div>
        @endif

        <!-- Signatures -->
        <div class="signatures">
            <div class="sig-box">Depositor / Payer Signature</div>
            <div class="sig-box">Cashier / Finance Stamp & Signature</div>
        </div>
    </div>
</body>
</html>
