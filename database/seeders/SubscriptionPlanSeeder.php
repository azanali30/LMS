<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Seed the official InstitutoPropio SaaS subscription plans and maintain legacy backward compatibility.
     */
    public function run(): void
    {
        // 1. Official InstitutoPropio Plans
        $officialPlans = [
            [
                'name' => 'Starter',
                'slug' => 'starter',
                'description' => 'Essential digital campus operating system for a single independent school or academy.',
                'price_cents' => 1900,         // $19.00 USD/mo
                'price_annual_cents' => 19000,  // $190.00 USD/yr (2 months free)
                'currency' => 'USD',
                'billing_interval' => 'month',
                'max_organizations' => 1,
                'max_students' => 0, // Unlimited
                'max_teachers' => 0, // Unlimited
                'max_courses' => 0,  // Unlimited
                'is_active' => true,
                'features' => [
                    '1 Isolated institution workspace',
                    '30-Day free trial (payment method required)',
                    'Unlimited students & teacher accounts',
                    'Student admission & class rosters',
                    'Daily roll call & substitute tracking',
                    'Weekly timetable & room scheduling',
                    'Curriculum syllabus & progress tracking',
                    'Fee structures & PDF invoices/receipts',
                    'Gradebook & exam marks recording',
                    'Standard email & portal support',
                ],
            ],
            [
                'name' => 'Growth',
                'slug' => 'growth',
                'description' => 'Multi-campus expansion system for educational groups operating up to 5 branch institutions.',
                'price_cents' => 4900,         // $49.00 USD/mo
                'price_annual_cents' => 49000,  // $490.00 USD/yr (2 months free)
                'currency' => 'USD',
                'billing_interval' => 'month',
                'max_organizations' => 5,
                'max_students' => 0,
                'max_teachers' => 0,
                'max_courses' => 0,
                'is_active' => true,
                'features' => [
                    'Up to 5 Isolated institution workspaces',
                    '30-Day free trial (payment method required)',
                    'Unlimited students & teacher accounts',
                    'Instant 1-click institution switcher',
                    'Unified executive owner oversight',
                    'Independent academic years & terms per school',
                    'Separate campus fee structures & bank accounts',
                    'Cross-campus faculty assignments',
                    'All Starter features included',
                    'Priority email & ticketing support',
                ],
            ],
            [
                'name' => 'Professional',
                'slug' => 'professional',
                'description' => 'Regional campus network architecture managing up to 10 institutions with consolidated portfolio reporting.',
                'price_cents' => 9900,         // $99.00 USD/mo
                'price_annual_cents' => 99000,  // $990.00 USD/yr (2 months free)
                'currency' => 'USD',
                'billing_interval' => 'month',
                'max_organizations' => 10,
                'max_students' => 0,
                'max_teachers' => 0,
                'max_courses' => 0,
                'is_active' => true,
                'features' => [
                    'Up to 10 Isolated institution workspaces',
                    '30-Day free trial (payment method required)',
                    'Unlimited students & teacher accounts',
                    'Consolidated executive portfolio reporting',
                    'Cross-school curriculum sharing & templates',
                    'Delegated campus administration roles',
                    'Multi-institution fee audit & reconciliation',
                    'LMS multimedia course creation & certificates',
                    'All Growth features included',
                    'Dedicated onboarding specialist',
                ],
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'National trusts, school districts & franchises requiring unlimited institutions and dedicated private cloud infrastructure.',
                'price_cents' => 0,            // Custom / Contact Sales
                'price_annual_cents' => 0,     // Custom / Contact Sales
                'currency' => 'USD',
                'billing_interval' => 'month',
                'max_organizations' => null,   // Unlimited
                'max_students' => 0,
                'max_teachers' => 0,
                'max_courses' => 0,
                'is_active' => true,
                'features' => [
                    'Unlimited isolated institution workspaces',
                    'Unlimited students & teacher accounts',
                    'Dedicated private cloud infrastructure',
                    'Custom domain names & Single Sign-On (SSO)',
                    '99.9% Uptime SLA & 24/7 emergency telephone support',
                    'Tailored faculty & staff onboarding workshops',
                    'Bespoke data compliance, audit logs & export',
                    'Custom payment gateway & billing integrations',
                    'Executive account director & roadmap influence',
                ],
            ],
        ];

        foreach ($officialPlans as $planData) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }

        // 2. Legacy Slugs Compatibility (Bronze, Silver, Gold, Premium)
        // Ensure existing database foreign keys and test fixtures resolve safely
        $legacyMappings = [
            'bronze' => [
                'name' => 'Bronze (Starter)',
                'price_cents' => 1900,
                'price_annual_cents' => 19000,
                'max_organizations' => 1,
            ],
            'silver' => [
                'name' => 'Silver (Growth)',
                'price_cents' => 4900,
                'price_annual_cents' => 49000,
                'max_organizations' => 5,
            ],
            'gold' => [
                'name' => 'Gold (Professional)',
                'price_cents' => 9900,
                'price_annual_cents' => 99000,
                'max_organizations' => 10,
            ],
            'premium' => [
                'name' => 'Premium (Enterprise)',
                'price_cents' => 0,
                'price_annual_cents' => 0,
                'max_organizations' => null,
            ],
        ];

        foreach ($legacyMappings as $slug => $override) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $slug],
                array_merge([
                    'currency' => 'USD',
                    'billing_interval' => 'month',
                    'max_students' => 0,
                    'max_teachers' => 0,
                    'max_courses' => 0,
                    'is_active' => true,
                ], $override)
            );
        }

        // Historical legacy slug updates
        SubscriptionPlan::where('slug', 'starter-academy')->update(['max_organizations' => 1, 'price_cents' => 1900]);
        SubscriptionPlan::where('slug', 'pro-campus')->update(['max_organizations' => 5, 'price_cents' => 4900]);
    }
}
