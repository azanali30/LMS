# SkillForge LMS - Desktop Readiness & Tauri Integration Plan

## 1. Overview & Strategy

SkillForge LMS is designed as a multi-tenant education SaaS platform where each school/academy operates within its own branded subdomain (e.g., `greenvalley.skillforge.com`).

- **Primary Client:** The responsive web portal remains the primary supported implementation. All LMS features, administrative workflows, and learning activities are fully supported directly in modern desktop and mobile web browsers without installing any desktop software.
- **Future Desktop Client:** A future Tauri (v2) desktop client will serve as a lightweight native desktop wrapper (using Microsoft Edge WebView2 on Windows and WebKit on macOS/Linux), communicating directly with the exact same Laravel backend, database, and authorization layer.
- **Status:** The backend is now fully desktop-ready. The desktop application itself is currently in the planned/integration phase and is not claimed as available until a verified production build artifact exists.

---

## 2. Desktop Organization Resolution Layer

The backend's `App\Services\TenantResolver` and `App\Http\Middleware\SetTenantContext` natively support two resolution channels for desktop clients:

### Option A: Header Injection (`X-Tenant-Subdomain`) — Recommended
When the Tauri client launches, it reads the active school configuration stored in the local client configuration file (e.g. `config.json` in user AppData) and includes the header:
```http
X-Tenant-Subdomain: greenvalley
```
The backend `TenantResolver` detects this header with top priority, validates the slug against reserved system names, verifies that the organization exists and is active, and binds `TenantContext` immediately before controllers execute.

### Option B: Direct Subdomain Webview Navigation
The Tauri webview window directly loads the school's fully qualified subdomain URL:
```text
Production: https://greenvalley.skillforge.com
Local Development: http://greenvalley.lms.test
```
The backend resolves the tenant from the request hostname just as it does for standard web browsers.

---

## 3. Desktop Authentication & Security Constraints

The desktop client integration strictly adheres to the following security principles:

1. **Session-Based Authentication Preserved:**
   - The desktop client utilizes standard secure HTTP-only cookies managed automatically by the native WebView2 container.
   - Browser session authentication with Laravel Fortify is fully preserved; token-only authentication is not forced or substituted for browser users.
2. **Zero Permanent Secrets in Client:**
   - No hardcoded API secrets, database credentials, encryption keys (`APP_KEY`), or administrative tokens may ever be compiled into Tauri Rust binaries or bundled frontend assets.
3. **Zero Duplication of Business Logic:**
   - No secondary database, SQLite offline sync, or duplicated LMS validation logic exists on the client. All grading, fee calculations, attendance policies, and organization membership checks are performed exclusively by the Laravel backend.
4. **Context vs Authorization:**
   - The `X-Tenant-Subdomain` header or subdomain hostname establishes tenant *context*, not authorization.
   - Every request to a tenant-scoped route verifies that the authenticated user possesses an active membership record in that organization (`$user->hasRoleInOrganization($org->id, ...)`). Attempting to spoof another school's slug results in an immediate HTTP 403 Forbidden.
5. **Session Invalidation & Logout:**
   - Logging out triggers `$request->session()->invalidate()` and regenerates the CSRF token on the backend, clearing credentials from the WebView cookie jar.

---

## 4. Local Development Hostnames & Configuration

To test school subdomains in local development:

### Laragon Virtual Host (Recommended):
- Domain: `lms.test`
- Virtual host configuration in Apache / Nginx:
  ```apache
  <VirtualHost *:80>
      DocumentRoot "C:/laragon/www/LMS/public"
      ServerName lms.test
      ServerAlias *.lms.test
  </VirtualHost>
  ```
- Windows hosts file (`C:\Windows\System32\drivers\etc\hosts`):
  ```text
  127.0.0.1 lms.test
  127.0.0.1 greenvalley.lms.test
  127.0.0.1 cityacademy.lms.test
  ```

### `.env` Settings for Subdomains:
```dotenv
APP_URL=http://lms.test
APP_DOMAIN=lms.test
SESSION_DOMAIN=.lms.test
```

### Direct Development Fallback:
If testing on `localhost:8000` without editing the Windows hosts file:
- Header: `X-Tenant-Subdomain: greenvalley`
- Query param (local/testing env only): `http://localhost:8000/dashboard?subdomain=greenvalley`
- Existing routes without a subdomain continue to function as the central platform without breaking.
