@extends('emails.layout')

@section('title', 'Payment Approved — Complete Your InstitutoPropio Workspace')

@section('content')
    <div style="margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            ✓ Payment Verified & Approved
        </span>
        <h1>Congratulations! Your Payment is Verified</h1>
        <p>
            Hello, our finance team has reviewed and confirmed your payment verification. Your <strong>30-day free trial</strong> is now ready to activate.
        </p>
    </div>

    <!-- Payment & Plan Summary -->
    <div class="info-card">
        <div class="info-row">
            <span class="info-label">Selected Plan</span>
            <span class="info-value" style="color: #1769E0;">{{ $planName }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Billing Interval</span>
            <span class="info-value">{{ ucfirst($approvalRequest->billing_interval) }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Transaction Reference</span>
            <span class="info-value" style="font-family: monospace;">{{ $approvalRequest->transaction_reference }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Payment Method</span>
            <span class="info-value">{{ ucfirst(str_replace('_', ' ', $approvalRequest->payment_method)) }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Approval Date</span>
            <span class="info-value">{{ $approvalRequest->approved_at?->format('M d, Y h:i A') ?? now()->format('M d, Y h:i A') }}</span>
        </div>
    </div>

    <p style="margin-top: 24px;">
        Click the button below to set your password and complete your institution setup (choose your school name and custom campus subdomain):
    </p>

    <!-- Call to Action Button -->
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $completionUrl }}" class="btn-orange" style="font-size: 15px; padding: 14px 32px;">
            Complete Account & Setup Institution &rarr;
        </a>
    </div>

    <!-- Security Information Box -->
    <div style="background-color: #EFF6FF; border-left: 4px solid #1769E0; padding: 14px 18px; border-radius: 8px; margin-top: 28px;">
        <p style="margin: 0; font-size: 12px; color: #1E3A8A; line-height: 1.5;">
            <strong>Security Notice:</strong> This single-use setup link will expire in <strong>7 days</strong>. If you did not request this registration, please contact our security desk immediately at <a href="mailto:support@institutopropio.com" style="color: #1769E0;">support@institutopropio.com</a>.
        </p>
    </div>
@endsection
