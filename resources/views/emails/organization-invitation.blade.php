<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Organization Invitation</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #070b14;
            color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
        }
        .wrapper {
            width: 100%;
            background-color: #070b14;
            padding: 40px 16px;
        }
        .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #0B1220;
            border: 1px solid #1e293b;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
        }
        .header {
            padding: 32px 32px 24px;
            background: linear-gradient(135deg, rgba(124, 58, 237, 0.15) 0%, rgba(79, 70, 229, 0.05) 100%);
            border-bottom: 1px solid #1e293b;
            text-align: center;
        }
        .brand-badge {
            display: inline-block;
            background: linear-gradient(135deg, #7c3aed, #4f46e5);
            color: #ffffff;
            font-weight: 800;
            font-size: 14px;
            padding: 6px 14px;
            border-radius: 8px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-bottom: 12px;
        }
        .title {
            margin: 0;
            font-size: 22px;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.3;
        }
        .content {
            padding: 32px;
        }
        .message {
            font-size: 15px;
            line-height: 1.6;
            color: #cbd5e1;
            margin-bottom: 24px;
        }
        .card {
            background-color: #0f172a;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 28px;
        }
        .card-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #1e293b;
            font-size: 14px;
        }
        .card-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
        }
        .card-row:first-child {
            padding-top: 0;
        }
        .card-label {
            color: #94a3b8;
        }
        .card-value {
            color: #ffffff;
            font-weight: 600;
            text-align: right;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            background-color: rgba(124, 58, 237, 0.2);
            color: #c084fc;
            border: 1px solid rgba(124, 58, 237, 0.4);
        }
        .btn-wrapper {
            text-align: center;
            margin: 32px 0 24px;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #7c3aed, #6366f1);
            color: #ffffff !important;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 10px;
            box-shadow: 0 4px 14px 0 rgba(124, 58, 237, 0.39);
        }
        .subtext {
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
            text-align: center;
            word-break: break-all;
        }
        .subtext a {
            color: #a855f7;
            text-decoration: underline;
        }
        .footer {
            padding: 20px 32px;
            background-color: #070b14;
            border-top: 1px solid #1e293b;
            text-align: center;
            font-size: 12px;
            color: #64748b;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <div class="brand-badge">{{ $organization->name }}</div>
                <h1 class="title">You've been invited to join<br><span style="color: #c084fc;">{{ $organization->name }}</span></h1>
            </div>

            <div class="content">
                <p class="message">
                    Hello,<br><br>
                    <strong>{{ $inviter?->name ?? 'An administrator' }}</strong> has invited you to join the <strong>{{ $organization->name }}</strong> workspace.
                </p>

                <div class="card">
                    <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
                        <tr>
                            <td style="color: #94a3b8; font-size: 13px;">Organization</td>
                            <td style="color: #ffffff; font-weight: 600; font-size: 13px; text-align: right;">{{ $organization->name }}</td>
                        </tr>
                        <tr>
                            <td style="color: #94a3b8; font-size: 13px;">Type</td>
                            <td style="color: #ffffff; font-weight: 600; font-size: 13px; text-align: right;">{{ ucfirst(str_replace('_', ' ', $organization->organization_type)) }}</td>
                        </tr>
                        <tr>
                            <td style="color: #94a3b8; font-size: 13px;">Invited Role</td>
                            <td style="text-align: right;"><span class="badge">{{ $roleName }}</span></td>
                        </tr>
                        <tr>
                            <td style="color: #94a3b8; font-size: 13px;">Expires On</td>
                            <td style="color: #f59e0b; font-size: 13px; text-align: right;">{{ $expiresAt }}</td>
                        </tr>
                    </table>
                </div>

                <div class="btn-wrapper">
                    <a href="{{ $acceptUrl }}" class="btn" target="_blank">
                        Accept Invitation &rarr;
                    </a>
                </div>

                <p class="subtext">
                    This single-use link is valid for 7 days.<br>
                    If the button above does not work, copy and paste this URL into your browser:<br>
                    <a href="{{ $acceptUrl }}">{{ $acceptUrl }}</a>
                </p>
            </div>

            <div class="footer">
                If you did not expect an invitation to {{ $organization->name }}, you can safely ignore this email.<br>
                &copy; {{ date('Y') }} {{ $organization->name }}. All rights reserved.
            </div>
        </div>
    </div>
</body>
</html>
