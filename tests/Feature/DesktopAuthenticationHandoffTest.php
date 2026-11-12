<?php

namespace Tests\Feature;

use App\Models\DesktopAuthCode;
use App\Models\Organization;
use App\Models\OrganizationUser;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DesktopAuthenticationHandoffTest extends TestCase
{
    use RefreshDatabase;

    protected function generatePkcePair(): array
    {
        $verifier = Str::random(64);
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');
        $state = Str::random(32);

        return [
            'verifier' => $verifier,
            'challenge' => $challenge,
            'state' => $state,
        ];
    }

    public function test_guest_is_redirected_to_login_when_opening_desktop_connect(): void
    {
        $pkce = $this->generatePkcePair();

        $response = $this->get("/desktop/connect?code_challenge={$pkce['challenge']}&state={$pkce['state']}");
        $response->assertRedirect('/login');
    }

    public function test_authenticated_user_can_view_desktop_connect_prompt(): void
    {
        $user = User::factory()->create();

        $org = Organization::create([
            'name' => 'Campus Alpha',
            'slug' => 'campus-alpha',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $user->id,
        ]);

        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $pkce = $this->generatePkcePair();

        $response = $this->actingAs($user)->get("/desktop/connect?code_challenge={$pkce['challenge']}&state={$pkce['state']}");
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('auth/desktop-connect')
            ->where('user.email', $user->email)
            ->where('organization.name', 'Campus Alpha')
            ->where('codeChallenge', $pkce['challenge'])
            ->where('state', $pkce['state'])
        );
    }

    public function test_user_can_authorize_desktop_and_receive_single_use_auth_code(): void
    {
        $user = User::factory()->create();
        $pkce = $this->generatePkcePair();

        $response = $this->actingAs($user)->postJson('/desktop/authorize', [
            'code_challenge' => $pkce['challenge'],
            'state' => $pkce['state'],
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'code',
            'state',
            'callback_url',
        ]);

        $code = $response->json('code');
        $this->assertSame(64, strlen($code));
        $this->assertDatabaseHas('desktop_auth_codes', [
            'code' => $code,
            'user_id' => $user->id,
            'code_challenge' => $pkce['challenge'],
            'state' => $pkce['state'],
            'used_at' => null,
        ]);
    }

    public function test_valid_pkce_code_exchange_authenticates_session_and_redirects(): void
    {
        $user = User::factory()->create();
        $pkce = $this->generatePkcePair();

        $authCode = DesktopAuthCode::issue(
            user: $user,
            codeChallenge: $pkce['challenge'],
            state: $pkce['state'],
            ttlMinutes: 5
        );

        $this->assertGuest();

        // Desktop WebView calls /desktop/consume
        $response = $this->get("/desktop/consume?code={$authCode->code}&code_verifier={$pkce['verifier']}&state={$pkce['state']}");

        $response->assertRedirect(route('dashboard'));
        $this->assertAuthenticatedAs($user);

        // Code is marked as used atomically
        $authCode->refresh();
        $this->assertTrue($authCode->isUsed());
    }

    public function test_invalid_pkce_verifier_is_rejected(): void
    {
        $user = User::factory()->create();
        $pkce = $this->generatePkcePair();

        $authCode = DesktopAuthCode::issue(
            user: $user,
            codeChallenge: $pkce['challenge'],
            state: $pkce['state'],
            ttlMinutes: 5
        );

        $wrongVerifier = Str::random(64);

        $response = $this->getJson("/desktop/consume?code={$authCode->code}&code_verifier={$wrongVerifier}&state={$pkce['state']}");

        $response->assertStatus(422);
        $response->assertJson([
            'error' => 'invalid_grant',
        ]);

        $this->assertGuest();
        $authCode->refresh();
        $this->assertFalse($authCode->isUsed());
    }

    public function test_state_mismatch_is_rejected(): void
    {
        $user = User::factory()->create();
        $pkce = $this->generatePkcePair();

        $authCode = DesktopAuthCode::issue(
            user: $user,
            codeChallenge: $pkce['challenge'],
            state: $pkce['state'],
            ttlMinutes: 5
        );

        $wrongState = 'tampered-state-999';

        $response = $this->getJson("/desktop/consume?code={$authCode->code}&code_verifier={$pkce['verifier']}&state={$wrongState}");

        $response->assertStatus(422);
        $response->assertJson([
            'error' => 'invalid_grant',
        ]);

        $this->assertGuest();
    }

    public function test_auth_code_cannot_be_reused_replay_attack_prevention(): void
    {
        $user = User::factory()->create();
        $pkce = $this->generatePkcePair();

        $authCode = DesktopAuthCode::issue(
            user: $user,
            codeChallenge: $pkce['challenge'],
            state: $pkce['state'],
            ttlMinutes: 5
        );

        // First exchange succeeds
        $res1 = $this->get("/desktop/consume?code={$authCode->code}&code_verifier={$pkce['verifier']}&state={$pkce['state']}");
        $res1->assertRedirect(route('dashboard'));

        // Logout
        $this->post('/desktop/logout');
        $this->assertGuest();

        // Second exchange fails (Replay attack blocked)
        $res2 = $this->getJson("/desktop/consume?code={$authCode->code}&code_verifier={$pkce['verifier']}&state={$pkce['state']}");
        $res2->assertStatus(422);
        $res2->assertJson([
            'error' => 'invalid_grant',
        ]);
        $this->assertGuest();
    }

    public function test_expired_auth_code_is_rejected(): void
    {
        $user = User::factory()->create();
        $pkce = $this->generatePkcePair();

        $authCode = DesktopAuthCode::create([
            'code' => Str::random(64),
            'user_id' => $user->id,
            'code_challenge' => $pkce['challenge'],
            'state' => $pkce['state'],
            'expires_at' => Carbon::now()->subMinutes(1), // Expired 1 min ago
        ]);

        $response = $this->getJson("/desktop/consume?code={$authCode->code}&code_verifier={$pkce['verifier']}&state={$pkce['state']}");

        $response->assertStatus(422);
        $response->assertJson([
            'error' => 'invalid_grant',
        ]);
        $this->assertGuest();
    }

    public function test_api_desktop_exchange_authenticates_session_and_preserves_tenant_context(): void
    {
        $user = User::factory()->create();

        $org = Organization::create([
            'name' => 'St. Jude Academy',
            'slug' => 'st-jude-academy',
            'organization_type' => 'school',
            'status' => 'active',
            'created_by' => $user->id,
        ]);

        OrganizationUser::create([
            'organization_id' => $org->id,
            'user_id' => $user->id,
            'role' => 'owner',
            'status' => 'active',
        ]);

        $pkce = $this->generatePkcePair();

        $authCode = DesktopAuthCode::issue(
            user: $user,
            codeChallenge: $pkce['challenge'],
            state: $pkce['state'],
            ttlMinutes: 5
        );

        $this->assertGuest();

        // Desktop sends unauthenticated POST to /api/desktop/exchange (exempt from web CSRF)
        $response = $this->postJson('/api/desktop/exchange', [
            'code' => $authCode->code,
            'code_verifier' => $pkce['verifier'],
            'state' => $pkce['state'],
        ]);

        $response->assertOk();
        $response->assertJson([
            'authenticated' => true,
            'redirect_url' => route('dashboard'),
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
            ],
        ]);

        $this->assertAuthenticatedAs($user);
        $this->assertSame($org->id, session('current_organization_id'));

        $authCode->refresh();
        $this->assertTrue($authCode->isUsed());
    }

    public function test_desktop_logout_redirects_to_desktop_welcome_for_desktop_client(): void
    {
        $user = User::factory()->create();

        // Desktop client with desktop User-Agent header
        $response = $this->actingAs($user)
            ->withHeader('User-Agent', 'Mozilla/5.0 InstitutoPropio-Desktop/1.0.0')
            ->post('/desktop/logout');

        $response->assertRedirect(route('desktop.welcome'));
        $this->assertGuest();
    }

    public function test_standard_web_logout_redirects_to_home_for_browser(): void
    {
        $user = User::factory()->create();

        // Standard web browser without desktop header
        $response = $this->actingAs($user)
            ->withHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36')
            ->post('/logout');

        $response->assertRedirect(route('home'));
        $this->assertGuest();
    }

    public function test_fortify_logout_redirects_to_desktop_welcome_when_desktop_session(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->withHeader('User-Agent', 'Mozilla/5.0 InstitutoPropio-Desktop/1.0.0')
            ->post('/logout');

        $response->assertRedirect(route('desktop.welcome'));
        $this->assertGuest();
    }

    public function test_desktop_welcome_route_shows_dedicated_screen_for_guest(): void
    {
        $response = $this->get('/desktop');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('desktop/welcome')
            ->where('appName', config('app.name', 'InstitutoPropio'))
        );
    }

    public function test_desktop_welcome_route_redirects_to_dashboard_for_authenticated_user(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/desktop');
        $response->assertRedirect(route('dashboard'));
    }

    public function test_desktop_welcome_route_sets_cors_header_for_tauri_origin(): void
    {
        $response = $this->withHeader('Origin', 'http://tauri.localhost')
            ->get('/desktop');

        $response->assertOk();
        $response->assertHeader('Access-Control-Allow-Origin', 'http://tauri.localhost');
    }

    public function test_normal_browser_logout_redirects_to_public_homepage(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->withHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36')
            ->post('/logout');

        $response->assertRedirect('/');
        $this->assertGuest();
    }
}
