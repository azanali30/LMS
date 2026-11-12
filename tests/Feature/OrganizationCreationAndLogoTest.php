<?php

namespace Tests\Feature;

use App\Models\Organization;
use App\Models\OrganizationSubscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class OrganizationCreationAndLogoTest extends TestCase
{
    use RefreshDatabase;

    private function createOwnerWithPlan(string $planSlug = 'growth', int $maxOrgs = 5): array
    {
        $owner = User::factory()->create(['role' => 'owner']);
        $org = Organization::create([
            'name' => 'Parker College',
            'slug' => 'parker-college',
            'organization_type' => 'college',
            'status' => 'active',
            'created_by' => $owner->id,
        ]);
        $org->members()->attach($owner->id, ['role' => 'owner', 'status' => 'active']);

        $plan = SubscriptionPlan::create([
            'name' => ucfirst($planSlug),
            'slug' => $planSlug,
            'price_monthly' => 99,
            'price_yearly' => 999,
            'max_organizations' => $maxOrgs,
            'max_students' => 1000,
            'max_courses' => 100,
            'is_active' => true,
        ]);

        OrganizationSubscription::create([
            'organization_id' => $org->id,
            'plan_id' => $plan->id,
            'user_id' => $owner->id,
            'status' => OrganizationSubscription::STATUS_ACTIVE,
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addMonth(),
        ]);

        return [$owner, $org, $plan];
    }

    public function test_owner_clicking_create_organization_opens_setup_wizard_even_when_owning_existing_org(): void
    {
        [$owner, $org] = $this->createOwnerWithPlan('growth', 5);

        $response = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->get('/organizations/create');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('workspace/setup')
            ->where('ownedCount', 1)
            ->where('maxAllowed', 5)
        );
    }

    public function test_owner_at_organization_limit_is_redirected_with_clear_message(): void
    {
        [$owner, $org] = $this->createOwnerWithPlan('starter', 1);

        $response = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->get('/organizations/create');

        $response->assertRedirect(route('organizations.billing.index'));
        $response->assertSessionHas('error');
    }

    public function test_non_owner_cannot_access_create_organization(): void
    {
        [, $org] = $this->createOwnerWithPlan('growth', 5);
        $teacher = User::factory()->create(['role' => 'teacher']);
        $org->members()->attach($teacher->id, ['role' => 'teacher', 'status' => 'active']);

        $response = $this->actingAs($teacher)
            ->withSession(['current_organization_id' => $org->id])
            ->get('/organizations/create');

        $response->assertForbidden();
    }

    public function test_owner_can_create_additional_organization_without_duplicating_existing(): void
    {
        [$owner, $org] = $this->createOwnerWithPlan('growth', 5);

        $response = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->post('/organizations', [
                'name' => 'North Campus Academy',
                'slug' => 'north-campus-academy',
                'organization_type' => 'school',
                'primary_color' => '#173A5E',
                'accent_color' => '#078675',
                'skip_academic_setup' => true,
            ]);

        $response->assertRedirect(route('dashboard'));
        $this->assertDatabaseCount('organizations', 2);
        $this->assertDatabaseHas('organizations', ['slug' => 'parker-college']);
        $this->assertDatabaseHas('organizations', ['slug' => 'north-campus-academy']);
    }

    public function test_organization_logo_upload_saves_domain_relative_url_and_serves_image(): void
    {
        Storage::fake('public');
        [$owner, $org] = $this->createOwnerWithPlan('growth', 5);

        $file = UploadedFile::fake()->image('parker-logo.png', 200, 200);

        $response = $this->actingAs($owner)
            ->withSession(['current_organization_id' => $org->id])
            ->put('/organizations/settings', [
                'name' => 'Parker College',
                'organization_type' => 'college',
                'timezone' => 'UTC',
                'currency' => 'USD',
                'logo' => $file,
            ]);

        $response->assertSessionHasNoErrors();
        $org->refresh();

        $this->assertNotNull($org->logo_path);
        $this->assertStringStartsWith('/storage/logos/', $org->logo_path);
        $this->assertStringNotContainsString('localhost', $org->logo_path);

        $storedRelative = str_replace('/storage/', '', $org->logo_path);
        Storage::disk('public')->assertExists($storedRelative);

        $logoResponse = $this->get($org->logo_path);
        $logoResponse->assertOk();
    }

    public function test_legacy_localhost_logo_url_is_normalized_to_relative_storage_path(): void
    {
        $org = Organization::create([
            'name' => 'Legacy Org',
            'slug' => 'legacy-org',
            'organization_type' => 'school',
            'logo_path' => 'http://localhost:8000/storage/logos/legacy.png',
            'status' => 'active',
        ]);

        $this->assertSame('/storage/logos/legacy.png', $org->logo_path);
    }
}

