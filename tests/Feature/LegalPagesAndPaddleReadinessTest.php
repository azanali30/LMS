<?php

namespace Tests\Feature;

use App\Models\ContactMessage;
use App\Models\SubscriptionPlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LegalPagesAndPaddleReadinessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed subscription plans for pricing test
        SubscriptionPlan::create([
            'name' => 'Bronze (Starter)',
            'slug' => 'starter',
            'description' => 'Essential campus OS for 1 institution.',
            'price_cents' => 1900,
            'price_annual_cents' => 19000,
            'currency' => 'USD',
            'billing_interval' => 'month',
            'max_organizations' => 1,
            'max_students' => 0,
            'max_teachers' => 0,
            'max_courses' => 0,
            'is_active' => true,
            'features' => ['1 Institution workspace'],
        ]);
    }

    public function test_all_legal_pages_render_without_authentication(): void
    {
        $this->get('/terms')->assertOk();
        $this->get('/privacy-policy')->assertOk();
        $this->get('/refund-policy')->assertOk();
        $this->get('/pricing')->assertOk();
        $this->get('/about')->assertOk();
        $this->get('/contact')->assertOk();
    }

    public function test_contact_form_validates_and_stores_inquiry_properly(): void
    {
        $payload = [
            'name' => 'Director Martinez',
            'email' => 'martinez@academy.edu',
            'subject' => 'Multi-Campus Enterprise Deployment',
            'message' => 'We are evaluating InstitutoPropio for 4 academy campuses and request onboarding assistance.',
        ];

        $response = $this->from('/contact')->post('/contact', $payload);

        $response->assertRedirect('/contact');
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('contact_messages', [
            'name' => 'Director Martinez',
            'email' => 'martinez@academy.edu',
            'subject' => 'Multi-Campus Enterprise Deployment',
            'status' => 'unread',
        ]);
    }

    public function test_contact_form_rejects_missing_or_invalid_fields(): void
    {
        $response = $this->post('/contact', [
            'name' => '',
            'email' => 'invalid-email-format',
            'subject' => '',
            'message' => '',
        ]);

        $response->assertSessionHasErrors(['name', 'email', 'subject', 'message']);
    }
}

