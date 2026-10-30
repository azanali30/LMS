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
        return Inertia::render('pricing');
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
