<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\Mail\GmailOAuthEmailTransport;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendBulkDistributionEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $backoff = [60, 300, 900];

    public function __construct(
        public User $sender,
        public string $recipientEmail,
        public string $subject,
        public string $htmlBody,
        public array $attachmentPaths = []
    ) {}

    public function handle(): void
    {
        // 1. Initialize the Gmail Transport with the employee's credentials
        $transport = new GmailOAuthEmailTransport($this->sender);

        // 2. Send the email
        $success = $transport->send(
            to: $this->recipientEmail,
            subject: $this->subject,
            htmlBody: $this->htmlBody,
            attachments: $this->attachmentPaths
        );

        if (!$success) {
            $this->fail(new \Exception("Gmail OAuth distribution failed to {$this->recipientEmail} from {$this->sender->email}"));
        }
    }
}
