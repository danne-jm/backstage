<?php

namespace App\Jobs;

use App\Mail\DistributionMail;
use App\Models\Mail as MailModel;
use App\Models\User;
use App\Services\GmailSenderService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Job for sending distribution emails
 * Processes queued emails and handles Gmail API with SMTP fallback
 * 
 * Priority order:
 * 1. Gmail API (if user has OAuth token)
 * 2. SMTP fallback (configured mail driver)
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

            // Attempt Gmail API send if sender has token
            if ($this->tryGmailSend($to, $subject, $body, $gmailSender)) {
                if ($mailLog) {
                    $mailLog->update(['success' => true]);
                }
                return;
            }

            // Fallback to SMTP
            $this->sendViaSmtp($to, $subject, $body);
            
            if ($mailLog) {
                $mailLog->update(['success' => true]);
            }

            Log::info('SendDistributionEmail: Email sent successfully', ['to' => $to]);

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
            Log::info('SendDistributionEmail: No sender_id, skipping Gmail API');
            return false;
        }

        $user = User::find($senderId);
        
        if (!$user || empty($user->gmail_refresh_token)) {
            Log::info('SendDistributionEmail: User has no Gmail token, skipping Gmail API');
            return false;
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

    /**
     * Send email via SMTP
     */
    private function sendViaSmtp(string $to, string $subject, string $body): void
    {
        Log::info('SendDistributionEmail: Sending via SMTP', ['to' => $to]);
        Mail::to($to)->send(new DistributionMail($subject, $body));
    }
}
