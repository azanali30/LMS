<?php

namespace App\Services;

use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TenantResolver
{
    /**
     * Resolve the organization from the incoming request.
     * Rejects unknown and inactive organizations with appropriate HTTP errors.
     * Returns null if the request is for the platform central/root domain or a reserved subdomain.
     */
    public function resolveFromRequest(Request $request): ?Organization
    {
        $subdomain = $this->extractSubdomain($request);

        if ($subdomain === null) {
            return null;
        }

        if ($this->isReservedSubdomain($subdomain)) {
            return null;
        }

        if (! $this->isValidSlug($subdomain)) {
            abort(404, 'Invalid organization subdomain format.');
        }

        $organization = Organization::where('slug', strtolower($subdomain))->first();

        if (! $organization) {
            abort(404, "School or organization '{$subdomain}' was not found. Please verify the URL or contact your administrator.");
        }

        if ($organization->status !== 'active') {
            abort(403, "The organization '{$organization->name}' is currently inactive or suspended. Please contact platform support.");
        }

        return $organization;
    }

    /**
     * Extract the subdomain string from the request hostname, desktop header, or dev query param.
     */
    public function extractSubdomain(Request $request): ?string
    {
        // 1. Desktop client & API header priority (Phase 5 Tauri readiness)
        if ($header = $request->header('X-Tenant-Subdomain')) {
            $cleaned = strtolower(trim($header));
            return $cleaned !== '' ? $cleaned : null;
        }

        $host = strtolower($request->getHost());

        // 2. Base domain resolution
        $rootDomain = $this->getRootDomain();

        // Exact match with root domain (e.g. skillforge.com or lms.test)
        if ($host === $rootDomain) {
            // Local development query param fallback for localhost:8000 or IP addresses
            return $this->resolveDevFallback($request);
        }

        // Subdomain check against configured root domain (e.g. {slug}.skillforge.com or {slug}.lms.test)
        $suffix = '.'.$rootDomain;
        if (str_ends_with($host, $suffix)) {
            $prefix = substr($host, 0, -strlen($suffix));
            // Check if there are nested subdomains (e.g. foo.bar.skillforge.com -> foo)
            $parts = explode('.', $prefix);
            $subdomain = end($parts);
            return $subdomain !== '' ? $subdomain : null;
        }

        // Handle *.localhost or *.test in development environments
        if (str_ends_with($host, '.localhost') || str_ends_with($host, '.test')) {
            $parts = explode('.', $host);
            if (count($parts) >= 2) {
                return $parts[0] !== '' ? $parts[0] : null;
            }
        }

        // 3. Localhost / IP dev fallback
        return $this->resolveDevFallback($request);
    }

    /**
     * Resolve development fallback (query param or dev session) on non-subdomain local URLs.
     */
    protected function resolveDevFallback(Request $request): ?string
    {
        if (app()->environment('local', 'testing')) {
            if ($query = $request->query('subdomain')) {
                $cleaned = strtolower(trim((string) $query));
                if ($cleaned !== '') {
                    return $cleaned;
                }
            }
        }

        return null;
    }

    /**
     * Determine if a given subdomain is reserved for platform use.
     */
    public function isReservedSubdomain(?string $subdomain): bool
    {
        if (! $subdomain) {
            return false;
        }

        $reserved = config('app.reserved_subdomains', [
            'www', 'app', 'admin', 'api', 'mail', 'support', 'help',
            'static', 'assets', 'portal', 'dashboard', 'login', 'register',
            'central', 'staging', 'test', 'dev', 'superadmin',
        ]);

        return in_array(strtolower($subdomain), $reserved, true);
    }

    /**
     * Validate that the slug conforms to standard organization slug rules.
     */
    public function isValidSlug(?string $slug): bool
    {
        if (! is_string($slug) || $slug === '') {
            return false;
        }

        return (bool) preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/i', $slug) && strlen($slug) <= 100;
    }

    /**
     * Get the configured or inferred root application domain.
     */
    public function getRootDomain(): string
    {
        if ($configured = config('app.domain')) {
            return strtolower(trim($configured));
        }

        $appUrl = config('app.url', 'http://localhost');
        $host = parse_url($appUrl, PHP_URL_HOST);

        return strtolower($host ?: 'localhost');
    }

    /**
     * Build the fully qualified subdomain URL for a given organization or slug.
     */
    public function buildSubdomainUrl(Organization|string $org, string $path = '/', array $query = []): string
    {
        $slug = $org instanceof Organization ? $org->slug : (string) $org;
        $slug = strtolower($slug);

        $appUrl = config('app.url', 'http://localhost');
        $parsed = parse_url($appUrl);
        $scheme = $parsed['scheme'] ?? 'http';
        $port = isset($parsed['port']) ? ':'.$parsed['port'] : '';

        $rootDomain = $this->getRootDomain();

        // If root domain is an IP address or 'localhost' and we are testing on localhost:port
        if ($rootDomain === 'localhost' || filter_var($rootDomain, FILTER_VALIDATE_IP)) {
            // Check if on local host with port, e.g. http://school.localhost:8000
            $host = "{$slug}.localhost{$port}";
        } else {
            $host = "{$slug}.{$rootDomain}{$port}";
        }

        $path = '/'.ltrim($path, '/');
        $url = "{$scheme}://{$host}{$path}";

        if (! empty($query)) {
            $url .= '?'.http_build_query($query);
        }

        return $url;
    }
}
