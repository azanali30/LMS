<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TrackingVerificationCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $code,
        public string $verificationUrl,
        public string $email,
        public int $expiresInMinutes = 15
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Application Tracking Verification Code: {$this->code}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.tracking-verification-code',
            with: [
                'code' => $this->code,
                'verificationUrl' => $this->verificationUrl,
                'email' => $this->email,
                'expiresInMinutes' => $this->expiresInMinutes,
            ],
        );
    }
}

