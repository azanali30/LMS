<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicController extends Controller
{
    /**
     * Display the Benefits page.
     */
    public function benefits(): Response
    {
        return Inertia::render('benefits');
    }

    /**
     * Display the Pricing page.
     */
    public function pricing(): Response
    {
        $plans = \App\Models\SubscriptionPlan::where('is_active', true)
            ->whereIn('slug', ['starter', 'growth', 'professional', 'enterprise'])
            ->get()
            ->map(fn (\App\Models\SubscriptionPlan $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'slug' => $p->slug,
                'description' => $p->description,
                'price_cents' => $p->price_cents,
                'price_annual_cents' => $p->price_annual_cents,
                'price_monthly_formatted' => $p->formattedPrice('monthly'),
                'price_annual_formatted' => $p->formattedPrice('annual'),
                'currency' => $p->currency,
                'max_organizations' => $p->max_organizations,
                'organization_limit' => $p->organizationLimit(),
                'features' => $p->features ?: [],
                'is_popular' => $p->slug === 'growth',
                'is_custom' => $p->isCustomPricing(),
            ]);

        return Inertia::render('pricing', [
            'plans' => $plans,
            'currency' => config('plans.currency', 'USD'),
            'trial_days' => (int) config('plans.trial_days', 30),
            'trialDays' => (int) config('plans.trial_days', 30),
        ]);
    }

    /**
     * Display the How It Works page.
     */
    public function howItWorks(): Response
    {
        return Inertia::render('how-it-works');
    }

    /**
     * Display the About Us page.
     */
    public function about(): Response
    {
        return Inertia::render('about');
    }

    /**
     * Display the Desktop App Download page.
     */
    public function download(): Response
    {
        return Inertia::render('download');
    }

    /**
     * Display the Contact Us page.
     */
    public function contact(): Response
    {
        return Inertia::render('contact');
    }

    /**
     * Store an incoming contact inquiry.
     */
    public function storeContact(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:200',
            'message' => 'required|string|max:3000',
        ]);

        ContactMessage::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'subject' => $validated['subject'],
            'message' => $validated['message'],
            'ip_address' => $request->ip(),
            'status' => 'unread',
        ]);

        return back()->with('success', 'Thank you for reaching out! Our team has received your message and will respond promptly.');
    }
}
