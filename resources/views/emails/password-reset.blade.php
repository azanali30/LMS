@extends('emails.layout')

@section('title', 'Reset Your Password — InstitutoPropio')

@section('content')
    <div style="margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #EFF6FF; border: 1px solid #BFDBFE; color: #1769E0; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            🔑 Password & Account Security
        </span>
        <h1>Reset Your Account Password</h1>
        <p>
            Hello, we received a request to reset the password for your InstitutoPropio account associated with <strong style="color: #0B1528;">{{ $email }}</strong>.
        </p>
    </div>

    <p style="margin-top: 16px;">
        Click the button below to choose a new password and sign in to your campus workspace:
    </p>

    <!-- Reset Password Button -->
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $resetUrl }}" class="btn-orange" style="font-size: 15px; padding: 14px 34px;">
            Reset Password & Sign In &rarr;
        </a>
    </div>

    <!-- Security Information Box -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px 20px; margin-top: 24px;">
        <p style="margin: 0 0 8px; font-size: 12px; color: #475569; line-height: 1.5;">
            <strong>Security Notice:</strong> This password reset link will expire in <strong>{{ $count }} minutes</strong>.
        </p>
        <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
            If you did not request a password reset, no further action is required; your account and login credentials remain secure.
        </p>
    </div>

    <p style="font-size: 11px; color: #94A3B8; margin-top: 24px; word-break: break-all;">
        If you are having trouble clicking the "Reset Password & Sign In" button, copy and paste the following URL into your web browser:<br />
        <a href="{{ $resetUrl }}" style="color: #1769E0; text-decoration: underline;">{{ $resetUrl }}</a>
    </p>
@endsection

