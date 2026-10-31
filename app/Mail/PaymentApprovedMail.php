<?php

namespace App\Mail;

use App\Models\PaymentApprovalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentApprovedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PaymentApprovalRequest $approvalRequest,
        public string $completionUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Payment Approved — Complete Your InstitutoPropio Workspace',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-approved',
            with: [
                'approvalRequest' => $this->approvalRequest,
                'completionUrl' => $this->completionUrl,
                'planName' => $this->approvalRequest->planDisplayName(),
            ],
        );
    }
}
