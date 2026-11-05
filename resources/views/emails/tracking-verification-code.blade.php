@extends('emails.layout')

@section('title', 'Application Tracking Verification Code — InstitutoPropio')

@section('content')
    <div style="margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #EFF6FF; border: 1px solid #BFDBFE; color: #1769E0; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            🔒 Security Verification Code
        </span>
        <h1>Verify Your Administrative Email</h1>
        <p>
            You requested to check the registration and payment status for <strong style="color: #0B1528;">{{ $email }}</strong>.
        </p>
    </div>

    <p style="margin-bottom: 8px;">Use the following 6-digit one-time verification code to view your application status:</p>

    <!-- OTP Code Display Box -->
    <div style="background-color: #F8FAFC; border: 2px dashed #1769E0; border-radius: 14px; padding: 24px 16px; text-align: center; margin: 24px 0;">
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #1769E0; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; margin-left: 10px;">
            {{ $code }}
        </div>
        <div style="font-size: 12px; color: #64748B; margin-top: 10px; font-weight: 600;">
            ⏱ Valid for {{ $expiresInMinutes }} minutes &bull; Single-use security token
        </div>
    </div>

    <p style="margin-top: 24px;">
        Alternatively, you can instantly verify and view your application progress by clicking the button below:
    </p>

    <div style="text-align: center; margin: 28px 0;">
        <a href="{{ $verificationUrl }}" class="btn-orange" style="font-size: 14px; padding: 13px 30px;">
            View Application Status Directly &rarr;
        </a>
    </div>

    <!-- Security Information Box -->
    <div style="background-color: #F1F5F9; border-radius: 8px; padding: 12px 16px; margin-top: 24px;">
        <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
            If you did not request this verification code, please ignore this email. Your registration and payment records remain strictly private and cannot be viewed without this code.
        </p>
    </div>
@endsection
