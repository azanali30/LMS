<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Application Tracking Verification Code</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .logo { font-size: 20px; font-weight: 800; color: #1769E0; margin-bottom: 24px; letter-spacing: -0.02em; }
        h1 { font-size: 22px; color: #0B1528; margin: 0 0 12px 0; font-weight: 800; }
        p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; }
        .code-box { background: #f0f7ff; border: 2px dashed #1769E0; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .code { font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1769E0; font-family: monospace; }
        .btn { display: inline-block; background: #FF7A30; color: #ffffff !important; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; margin: 16px 0; text-align: center; }
        .footer { font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo">InstitutoPropio</div>
        <h1>Track Your Payment Application</h1>
        <p>Hello,</p>
        <p>You requested access to check the verification status of your InstitutoPropio payment application for <strong>{{ $email }}</strong>.</p>
        
        <p>Use the following 6-digit one-time verification code to view your application details:</p>

        <div class="code-box">
            <div class="code">{{ $code }}</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Valid for {{ $expiresInMinutes }} minutes</div>
        </div>

        <p>Alternatively, you can instantly verify your session and view your application by clicking below:</p>

        <div style="text-align: center;">
            <a href="{{ $verificationUrl }}" class="btn">View Application Status Directly &rarr;</a>
        </div>

        <p style="font-size: 12px; color: #64748b; margin-top: 24px;">
            If you did not request this verification code, please ignore this email. Your application details will not be disclosed to anyone without this code.
        </p>

        <div class="footer">
            &copy; {{ date('Y') }} InstitutoPropio SaaS Platform. All rights reserved.
        </div>
    </div>
</body>
</html>

