@extends('emails.layout')

@section('title', "Invitation to Join {$organization->name} — InstitutoPropio")

@section('content')
    <div style="margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #EFF6FF; border: 1px solid #BFDBFE; color: #1769E0; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            🎓 Campus Invitation
        </span>
        <h1>You've Been Invited to Join {{ $organization->name }}</h1>
        <p>
            Hello, {{ $inviter?->name ?? 'An administrator' }} has invited you to join the <strong>{{ $organization->name }}</strong> workspace on the InstitutoPropio platform as a <strong>{{ $roleName }}</strong>.
        </p>
    </div>

    <!-- Invitation Details Box -->
    <div class="info-card">
        <div class="info-row">
            <span class="info-label">Institution</span>
            <span class="info-value" style="color: #1769E0;">{{ $organization->name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Assigned Role</span>
            <span class="info-value">{{ $roleName }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Invited By</span>
            <span class="info-value">{{ $inviter?->name ?? 'Campus Administrator' }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Expires At</span>
            <span class="info-value">{{ $expiresAt }}</span>
        </div>
    </div>

    <p style="margin-top: 24px;">
        To accept your invitation, activate your account credentials, and access your campus portal, click the button below:
    </p>

    <!-- Accept Invitation Button -->
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $acceptUrl }}" class="btn-orange" style="font-size: 15px; padding: 14px 32px;">
            Accept Invitation & Access Workspace &rarr;
        </a>
    </div>

    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 14px 18px; margin-top: 24px;">
        <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.5;">
            <strong>Security Notice:</strong> If you did not expect this invitation or believe it was sent in error, you can safely ignore this email.
        </p>
    </div>
@endsection
