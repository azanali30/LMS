<?php

namespace App\Mail;

use App\Models\PaymentApprovalRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PaymentRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public PaymentApprovalRequest $approvalRequest,
        public string $resubmitUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Payment Verification Update — Action Required for InstitutoPropio',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.payment-rejected',
            with: [
                'approvalRequest' => $this->approvalRequest,
                'resubmitUrl' => $this->resubmitUrl,
            ],
        );
    }
}
