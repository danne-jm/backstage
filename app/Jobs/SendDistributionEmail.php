<?php

namespace App\Jobs;

use App\Mail\DistributionMail;
use App\Models\User;
use App\Services\GmailSender;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendDistributionEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public array $recipient;

    /**
     * Create a new job instance.
     */
    public function __construct(array $recipient)
    {
        $this->recipient = $recipient;
        $this->queue = 'distributions';
    }

    /**
     * Execute the job.
     */
    public function handle(GmailSender $gmailSender): void
    {
        try {
            $to = $this->recipient['email'];
            $subject = $this->recipient['subject'] ?? 'Notification from ESN Leuven';
            $body = $this->recipient['body'] ?? '';

            // If sender_id exists and that user has a gmail_refresh_token, attempt to send via Gmail API
            $senderId = $this->recipient['sender_id'] ?? null;
            if ($senderId) {
                $user = User::find($senderId);
                if ($user && ! empty($user->gmail_refresh_token)) {
                    // Use Gmail API to send as the connected user; keep subject/body as provided
                    $sent = $gmailSender->sendHtmlAsUser($user, $to, $subject, $body);
                    if ($sent) {
                        return;
                    }
                    // If Gmail send failed, fall back to configured mailer
                }
            }

            // Fallback to existing mail system
            Mail::to($to)->send(new DistributionMail($subject, $body));
        } catch (\Throwable $e) {
            Log::error('SendDistributionEmail failed', ['recipient' => $this->recipient, 'error' => $e->getMessage()]);
            // Let the job fail so the queue can retry according to configuration
            throw $e;
        }
    }
}
