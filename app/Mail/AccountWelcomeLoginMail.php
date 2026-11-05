<?php

namespace App\Mail;

use App\Models\Organization;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AccountWelcomeLoginMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public Organization $organization
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Welcome to InstitutoPropio — Your {$this->organization->name} Workspace is Ready",
        );
    }

    public function content(): Content
    {
        $webUrl = rtrim(config('app.web_url', url('/')), '/');

        return new Content(
            view: 'emails.account-welcome-login',
            with: [
                'user' => $this->user,
                'organization' => $this->organization,
                'loginUrl' => "{$webUrl}/login",
                'downloadUrl' => "{$webUrl}/download",
            ],
        );
    }
}

