<?php

namespace App\Mail;

use App\Models\OrganizationInvitation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrganizationInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(public OrganizationInvitation $invitation)
    {
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $orgName = $this->invitation->organization->name ?? 'AcademiaLMS';

        return new Envelope(
            subject: "Invitation to join {$orgName} on AcademiaLMS",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.organization-invitation',
            with: [
                'invitation' => $this->invitation,
                'organization' => $this->invitation->organization,
                'inviter' => $this->invitation->inviter,
                'acceptUrl' => url("/invitations/{$this->invitation->token}"),
                'roleName' => ucfirst($this->invitation->role),
                'expiresAt' => $this->invitation->expires_at?->format('F j, Y g:i A') ?? '7 days',
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
