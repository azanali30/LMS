<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Seed the 4 official SkillForge LMS subscription plans.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Bronze',
                'slug' => 'bronze',
                'description' => 'Ideal for standalone private schools, single-branch academies, and specialized training institutes.',
                'price_cents' => 0, // Unfinalized price
                'currency' => 'USD',
                'billing_interval' => 'month',
                'max_organizations' => 1,
                'max_students' => 0, // Unlimited - no arbitrary student/teacher limits
                'max_teachers' => 0,
                'max_courses' => 0,
                'is_active' => true,
                'features' => [
                    '1 Isolated organization tenant',
                    '30-Day free trial included',
                    'Complete student admission & class rosters',
                    'Timetable, attendance & gradebook',
                    'Fee structures & PDF invoices',
                    'Standard email support',
                ],
            ],
            [
                'name' => 'Silver',
                'slug' => 'silver',
                'description' => 'Tailored for expanding multi-campus schools managing up to 5 branch organizations with unified oversight.',
                'price_cents' => 0,
                'currency' => 'USD',
                'billing_interval' => 'month',
                'max_organizations' => 5,
                'max_students' => 0,
                'max_teachers' => 0,
                'max_courses' => 0,
                'is_active' => true,
                'features' => [
                    'Up to 5 Isolated organization tenants',
                    '30-Day free trial included',
                    'Instant 1-click organization switcher',
                    'Unified executive owner oversight',
                    'Separate academic calendars & fee structures',
                    'Cross-campus faculty assignments',
                    'Priority ticketing & email support',
                ],
            ],
            [
                'name' => 'Gold',
                'slug' => 'gold',
                'description' => 'Engineered for regional educational groups, multi-city academy chains, and campus networks managing up to 10 organizations.',
                'price_cents' => 0,
                'currency' => 'USD',
                'billing_interval' => 'month',
                'max_organizations' => 10,
                'max_students' => 0,
                'max_teachers' => 0,
                'max_courses' => 0,
                'is_active' => true,
                'features' => [
                    'Up to 10 Isolated organization tenants',
                    '30-Day free trial included',
                    'Executive portfolio reporting across schools',
                    'Custom academic policies & timetables',
                    'Consolidated billing & invoice reporting',
                    'Dedicated implementation specialist',
                ],
            ],
            [
                'name' => 'Premium',
                'slug' => 'premium',
                'description' => 'Enterprise campus network with unlimited isolated organizations and bespoke service level agreements.',
                'price_cents' => 0,
                'currency' => 'USD',
                'billing_interval' => 'month',
                'max_organizations' => null, // Unlimited
                'max_students' => 0,
                'max_teachers' => 0,
                'max_courses' => 0,
                'is_active' => true,
                'features' => [
                    'Unlimited organization tenants',
                    '30-Day free trial included',
                    'Dedicated private cloud infrastructure',
                    'Custom SLA & 24/7 phone/emergency support',
                    'Custom domain & SSO integrations',
                    'Executive account manager',
                ],
            ],
        ];

        foreach ($plans as $planData) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $planData['slug']],
                $planData
            );
        }

        // Also update legacy starter-academy & pro-campus if they exist
        SubscriptionPlan::where('slug', 'starter-academy')->update(['max_organizations' => 1]);
        SubscriptionPlan::where('slug', 'pro-campus')->update(['max_organizations' => 5]);
    }
}
