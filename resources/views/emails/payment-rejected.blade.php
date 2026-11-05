@extends('emails.layout')

@section('title', 'Payment Verification Update — InstitutoPropio')

@section('content')
    <div style="margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #FEF2F2; border: 1px solid #FECACA; color: #DC2626; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            ⚠️ Payment Verification Update
        </span>
        <h1>Action Required: Payment Verification</h1>
        <p>
            Hello, thank you for submitting your payment proof for InstitutoPropio. Our verification team reviewed transaction reference <strong style="color: #0B1528; font-family: monospace;">{{ $approvalRequest->transaction_reference }}</strong> and was unable to reconcile the deposit.
        </p>
    </div>

    <!-- Reason Box -->
    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 16px 20px; border-radius: 8px; margin: 24px 0;">
        <div style="font-size: 11px; font-weight: 800; color: #B91C1C; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px;">
            Finance Team Feedback:
        </div>
        <div style="font-size: 13px; color: #7F1D1D; line-height: 1.5; font-weight: 500;">
            {{ $approvalRequest->rejection_reason ?: 'Unable to reconcile payment reference with bank records. Please provide a clear official receipt or revised transaction ID.' }}
        </div>
    </div>

    <p style="margin-top: 20px;">
        You can easily upload a corrected receipt or revised transaction reference using our secure onboarding portal:
    </p>

    <!-- Resubmit Button -->
    <div style="text-align: center; margin: 28px 0;">
        <a href="{{ $resubmitUrl }}" class="btn-primary" style="font-size: 14px; padding: 13px 30px;">
            Submit Corrected Payment Proof &rarr;
        </a>
    </div>

    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; margin-top: 24px;">
        <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
            Need help? If you believe this was an error or need direct support, reply directly to this email or reach us at <a href="mailto:support@institutopropio.com" style="color: #1769E0;">support@institutopropio.com</a>.
        </p>
    </div>
@endsection
