<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Approved — Complete Your InstitutoPropio Workspace</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070b14; color: #f1f5f9; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #0B1220; border: 1px solid #1e293b; border-radius: 16px; padding: 36px 32px; }
        .logo { font-size: 20px; font-weight: 800; color: #a855f7; margin-bottom: 24px; letter-spacing: -0.02em; }
        h1 { font-size: 22px; color: #ffffff; margin: 0 0 12px 0; font-weight: 700; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0; }
        .highlight { background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.2); border-radius: 12px; padding: 16px; margin: 24px 0; }
        .highlight-item { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
        .highlight-item:last-child { margin-bottom: 0; }
        .label { color: #94a3b8; }
        .val { color: #f8fafc; font-weight: 600; }
        .btn { display: inline-block; background: #7c3aed; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; margin: 20px 0; text-align: center; }
        .footer { font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">InstitutoPropio</div>
        <h1>Your Payment Has Been Verified!</h1>
        <p>Hello,</p>
        <p>Great news! Our finance team has successfully reviewed and approved your manual payment verification. Your <strong>30-day free trial</strong> is now ready to activate.</p>
        
        <div class="highlight">
            <div class="highlight-item"><span class="label">Plan:</span> <span class="val">{{ $planName }}</span></div>
            <div class="highlight-item"><span class="label">Billing Interval:</span> <span class="val">{{ ucfirst($approvalRequest->billing_interval) }}</span></div>
            <div class="highlight-item"><span class="label">Transaction Reference:</span> <span class="val">{{ $approvalRequest->transaction_reference }}</span></div>
            <div class="highlight-item"><span class="label">Approved Date:</span> <span class="val">{{ $approvalRequest->approved_at?->format('M d, Y') ?? 'Today' }}</span></div>
        </div>

        <p>To finalize your setup, please click the secure button below to choose your password and set up your institution details (such as your preferred subdomain and school name):</p>

        <div style="text-align: center;">
            <a href="{{ $completionUrl }}" class="btn">Complete Account & Setup Institution &rarr;</a>
        </div>

        <p style="font-size: 12px; color: #64748b;">
            This single-use link expires in 7 days. If you did not request this registration, please disregard this email.
        </p>

        <div class="footer">
            &copy; {{ date('Y') }} InstitutoPropio SaaS Platform. All rights reserved.
        </div>
    </div>
</body>
</html>
