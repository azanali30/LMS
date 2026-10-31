<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Verification Update — InstitutoPropio</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070b14; color: #f1f5f9; margin: 0; padding: 24px; }
        .card { max-width: 600px; margin: 0 auto; background: #0B1220; border: 1px solid #1e293b; border-radius: 16px; padding: 36px 32px; }
        .logo { font-size: 20px; font-weight: 800; color: #a855f7; margin-bottom: 24px; letter-spacing: -0.02em; }
        h1 { font-size: 22px; color: #ffffff; margin: 0 0 12px 0; font-weight: 700; }
        p { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 16px 0; }
        .alert-box { background: rgba(244, 63, 94, 0.1); border: 1px solid rgba(244, 63, 94, 0.25); border-radius: 12px; padding: 16px; margin: 24px 0; }
        .alert-title { color: #f43f5e; font-weight: 700; font-size: 13px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .reason { color: #fecdd3; font-size: 14px; line-height: 1.5; }
        .btn { display: inline-block; background: #2563eb; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; margin: 20px 0; text-align: center; }
        .footer { font-size: 11px; color: #64748b; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 16px; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">InstitutoPropio</div>
        <h1>Payment Verification Update</h1>
        <p>Hello,</p>
        <p>Thank you for submitting your payment proof for InstitutoPropio. Our verification team reviewed transaction reference <strong>{{ $approvalRequest->transaction_reference }}</strong> and was unable to verify the deposit.</p>
        
        <div class="alert-box">
            <div class="alert-title">Reason Provided by Finance Team:</div>
            <div class="reason">{{ $approvalRequest->rejection_reason ?: 'Unable to reconcile payment reference with bank records. Please provide a clear official receipt or revised transaction ID.' }}</div>
        </div>

        <p>You can easily upload a corrected receipt or revised transaction reference using our onboarding portal:</p>

        <div style="text-align: center;">
            <a href="{{ $resubmitUrl }}" class="btn">Submit Corrected Payment Proof &rarr;</a>
        </div>

        <p style="font-size: 12px; color: #64748b;">
            If you believe this was an error or need direct assistance, please reply directly to this email or contact support@institutopropio.com.
        </p>

        <div class="footer">
            &copy; {{ date('Y') }} InstitutoPropio SaaS Platform. All rights reserved.
        </div>
    </div>
</body>
</html>
