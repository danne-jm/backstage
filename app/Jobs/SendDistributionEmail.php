<?php

namespace App\Jobs;

use App\Models\Mail as MailModel;
use App\Models\User;
use App\Services\GmailSenderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Job for sending distribution emails
 * Processes queued emails and sends via Gmail API using user OAuth
 */
class SendDistributionEmail implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public array $recipient;

    /**
     * The number of times the job may be attempted
     */
    public int $tries = 3;

    /**
     * The number of seconds to wait before retrying
     */
    public int $backoff = 60;

    /**
     * Create a new job instance
     */
    public function __construct(array $recipient)
    {
        $this->recipient = $recipient;
        $this->queue = 'distributions';
    }

    /**
     * Execute the job
     */
    public function handle(GmailSenderService $gmailSender): void
    {
        $mailLog = isset($this->recipient['mail_log_id']) 
            ? MailModel::find($this->recipient['mail_log_id']) 
            : null;

        try {
            $to = $this->recipient['email'];
            $subject = $this->recipient['subject'] ?? 'Notification';
            $body = $this->recipient['body'] ?? '';

            Log::info('SendDistributionEmail: Processing job', [
                'to' => $to,
                'subject' => $subject,
                'has_sender_id' => isset($this->recipient['sender_id']),
            ]);

            // Attempt Gmail API send; fail if it cannot be sent
            if (!$this->tryGmailSend($to, $subject, $body, $gmailSender)) {
                throw new \RuntimeException('Gmail send failed or Google account not connected.');
            }

            if ($mailLog) {
                $mailLog->update(['success' => true]);
            }

            Log::info('SendDistributionEmail: Email sent successfully via Gmail', ['to' => $to]);

        } catch (\Throwable $e) {
            if ($mailLog) {
                $mailLog->update([
                    'success' => false,
                    'error_message' => $e->getMessage(),
                ]);
            }
            
            Log::error('SendDistributionEmail failed', [
                'recipient' => $this->recipient['email'] ?? 'unknown',
                'error' => $e->getMessage(),
            ]);
            
            // Re-throw to allow queue retry
            throw $e;
        }
    }

    /**
     * Try to send via Gmail API if user has token
     */
    private function tryGmailSend(string $to, string $subject, string $body, GmailSenderService $gmailSender): bool
    {
        $senderId = $this->recipient['sender_id'] ?? null;
        
        if (!$senderId) {
            throw new \RuntimeException('No sender_id provided for Gmail send.');
        }

        $user = User::find($senderId);
        
        if (!$user || empty($user->gmail_refresh_token)) {
            throw new \RuntimeException('User has no connected Google account.');
        }

        try {
            return $gmailSender->send($to, $subject, $body, $user);
        } catch (\Throwable $e) {
            Log::warning('SendDistributionEmail: Gmail API failed, falling back to SMTP', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

}
