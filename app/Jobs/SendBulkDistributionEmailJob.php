<?php

namespace App\Jobs;

use App\Models\MailLog;
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

    public int $tries = 3;

    public array $backoff = [60, 300, 900];

    public function __construct(
        public User $sender,
        public string $recipientEmail,
        public string $subject,
        public string $htmlBody,
        public array $attachmentPaths = [],
        public ?string $eventId = null,
        public array $inlineEmbedUrls = [],
    ) {}

    public function handle(): void
    {
        $success = false;
        $errorMessage = null;

        try {
            $inlineEmbeds = [];
            foreach ($this->inlineEmbedUrls as $name => $url) {
                // Fetch image directly from source into memory during job execution
                $content = @file_get_contents($url);
                if ($content) {
                    $inlineEmbeds[$name] = $content;
                }
            }

            $transport = new GmailOAuthEmailTransport($this->sender);
            $success = $transport->send(
                to: $this->recipientEmail,
                subject: $this->subject,
                htmlBody: $this->htmlBody,
                attachments: $this->attachmentPaths,
                inlineEmbeds: $inlineEmbeds
            );

            if (! $success) {
                $errorMessage = "Gmail OAuth distribution failed to {$this->recipientEmail} from {$this->sender->email}";
            }
        } catch (\Exception $e) {
            $success = false;
            $errorMessage = $e->getMessage();
        }

        MailLog::create([
            'event_id' => $this->eventId,
            'user_id' => $this->sender->id,
            'recipient_email' => $this->recipientEmail,
            'subject' => $this->subject,
            'body' => $this->htmlBody,
            'success' => $success,
            'error_message' => $errorMessage,
        ]);

        if (! $success) {
            $this->fail(new \Exception($errorMessage));
        }
    }
}
