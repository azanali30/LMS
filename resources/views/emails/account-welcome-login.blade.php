@extends('emails.layout')

@section('title', 'Welcome to InstitutoPropio — Your Account & Workspace Are Ready')

@section('content')
    <div style="margin-bottom: 24px;">
        <span style="display: inline-block; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">
            🎉 Workspace Activated
        </span>
        <h1>Welcome to InstitutoPropio, {{ $user->name }}!</h1>
        <p>
            Your administrative account and campus workspace for <strong>{{ $organization->name }}</strong> have been successfully provisioned. You now have full access to your unified school management and e-learning platform.
        </p>
    </div>

    <!-- Workspace & Account Details -->
    <div class="info-card">
        <div class="info-row">
            <span class="info-label">Institution Workspace</span>
            <span class="info-value" style="color: #1769E0;">{{ $organization->name }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Login Work Email</span>
            <span class="info-value">{{ $user->email }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Administrative Role</span>
            <span class="info-value">Owner / Campus Director</span>
        </div>
        <div class="info-row">
            <span class="info-label">Dedicated Subdomain</span>
            <span class="info-value" style="font-family: monospace;">{{ $organization->slug }}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Trial Status</span>
            <span class="info-value" style="color: #059669;">30-Day Free Trial (Active)</span>
        </div>
    </div>

    <p style="margin-top: 24px;">
        You can now sign in directly using your work email and the password you selected:
    </p>

    <!-- Sign In Button -->
    <div style="text-align: center; margin: 30px 0;">
        <a href="{{ $loginUrl }}" class="btn-orange" style="font-size: 15px; padding: 14px 36px;">
            Sign In to Your Workspace &rarr;
        </a>
    </div>

    <!-- Dedicated Desktop Client Promotion -->
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-top: 28px;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <strong style="color: #0B1528; font-size: 14px;">💻 Prefer a Native Workstation?</strong>
        </div>
        <p style="margin: 0 0 12px; font-size: 13px; color: #475569; line-height: 1.5;">
            Download the official <strong>InstitutoPropio Windows Desktop App</strong> for distraction-free administrative operations, real-time timetable alerts, and fast taskbar launching.
        </p>
        <div>
            <a href="{{ $downloadUrl }}" style="color: #1769E0; font-size: 13px; font-weight: 700; text-decoration: none;">
                Download Windows Desktop App &rarr;
            </a>
        </div>
    </div>

    <p style="font-size: 12px; color: #64748B; margin-top: 24px;">
        Need help onboarding your teachers or importing students? Reach out anytime to our dedicated institutional onboarding team at <a href="mailto:support@institutopropio.com" style="color: #1769E0;">support@institutopropio.com</a>.
    </p>
@endsection

