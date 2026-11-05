<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>@yield('title', 'InstitutoPropio')</title>
    <style type="text/css">
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E293B; }
        .email-wrapper { width: 100%; background-color: #F8FAFC; padding: 40px 16px; }
        .email-card { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(11, 21, 40, 0.04), 0 2px 4px -2px rgba(11, 21, 40, 0.04); }
        .email-header { padding: 32px 36px 24px; border-bottom: 1px solid #F1F5F9; text-align: left; background-color: #FFFFFF; }
        .email-body { padding: 32px 36px; color: #334155; line-height: 1.6; font-size: 14px; }
        .email-footer { padding: 24px 36px 32px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0; text-align: center; font-size: 12px; color: #64748B; }
        h1 { margin: 0 0 12px; font-size: 22px; font-weight: 800; color: #0B1528; letter-spacing: -0.02em; line-height: 1.3; }
        h2 { margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #0B1528; }
        p { margin: 0 0 16px; font-size: 14px; line-height: 1.65; color: #475569; }
        .btn-primary { display: inline-block; background-color: #1769E0; color: #FFFFFF !important; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-size: 14px; text-align: center; transition: all 0.15s ease; box-shadow: 0 2px 4px rgba(23, 105, 224, 0.2); }
        .btn-orange { display: inline-block; background-color: #FF7A30; color: #FFFFFF !important; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-size: 14px; text-align: center; transition: all 0.15s ease; box-shadow: 0 2px 4px rgba(255, 122, 48, 0.25); }
        .info-card { background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px 20px; margin: 20px 0; }
        .info-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px dashed #E2E8F0; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #64748B; font-weight: 500; }
        .info-value { color: #0B1528; font-weight: 700; text-align: right; }
        @media only screen and (max-width: 600px) {
            .email-header, .email-body, .email-footer { padding-left: 20px !important; padding-right: 20px !important; }
            .info-row { flex-direction: column !important; gap: 2px !important; }
            .info-value { text-align: left !important; }
        }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center">
                    <div class="email-card">
                        <!-- Branded Header with Logo -->
                        <div class="email-header">
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td valign="middle" style="width: 58px;">
                                        <a href="{{ rtrim(config('app.web_url', url('/')), '/') }}" target="_blank" style="text-decoration: none; display: block;">
                                            <img src="{{ rtrim(config('app.web_url', url('/')), '/') }}/images/logo.png" alt="InstitutoPropio Logo" width="50" height="50" style="display: block; border-radius: 12px; border: 1px solid #E2E8F0; object-fit: contain; background-color: #FFFFFF;" />
                                        </a>
                                    </td>
                                    <td valign="middle" style="padding-left: 14px;">
                                        <div style="font-size: 21px; font-weight: 800; color: #0B1528; letter-spacing: -0.02em; line-height: 1.2;">
                                            Instituto<span style="color: #1769E0;">Propio</span>
                                        </div>
                                        <div style="font-size: 11px; font-weight: 700; color: #1769E0; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px;">
                                            Unified Education SaaS Platform
                                        </div>
                                    </td>
                                    <td align="right" valign="middle">
                                        <span style="display: inline-block; background-color: #EFF6FF; border: 1px solid #BFDBFE; color: #1769E0; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px;">
                                            Official Notice
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <!-- Email Body Content -->
                        <div class="email-body">
                            @yield('content')
                        </div>

                        <!-- Branded Footer -->
                        <div class="email-footer">
                            <p style="margin-bottom: 12px; font-size: 12px; color: #64748B;">
                                <strong style="color: #0B1528;">InstitutoPropio</strong> — The Modern Operating System for Educational Campuses.
                            </p>
                            
                            <div style="margin-bottom: 16px;">
                                <a href="{{ rtrim(config('app.web_url', url('/')), '/') }}/login" style="color: #1769E0; text-decoration: none; font-weight: 600; margin: 0 8px; font-size: 12px;">Web Login</a> &bull;
                                <a href="{{ rtrim(config('app.web_url', url('/')), '/') }}/download" style="color: #1769E0; text-decoration: none; font-weight: 600; margin: 0 8px; font-size: 12px;">Windows Desktop App</a> &bull;
                                <a href="{{ rtrim(config('app.web_url', url('/')), '/') }}/onboarding/status" style="color: #1769E0; text-decoration: none; font-weight: 600; margin: 0 8px; font-size: 12px;">Track Application</a>
                            </div>

                            <p style="font-size: 11px; color: #94A3B8; margin-bottom: 6px;">
                                &copy; {{ date('Y') }} InstitutoPropio SaaS Platform. All rights reserved. &bull; ISO 27001 & SOC-2 Certified
                            </p>
                            <p style="font-size: 10px; color: #94A3B8; margin: 0;">
                                Cryptographic Multi-Tenant Isolation &bull; End-to-End Encrypted Campus Communications
                            </p>
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>

