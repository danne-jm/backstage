<?php

namespace App\Jobs;

use App\Mail\DistributionMail;
use App\Models\User;
use App\Models\Ticket;
use App\Models\Event;
use App\Services\GmailSender;
use Illuminate\Support\Facades\DB;
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

            Log::info('SendDistributionEmail: Processing job', [
                'to' => $to,
                'subject' => $subject,
                'has_sender_id' => isset($this->recipient['sender_id']),
                'sender_id' => $this->recipient['sender_id'] ?? null,
            ]);

            // If sender_id exists and that user has a gmail_refresh_token, attempt to send via Gmail API
            $senderId = $this->recipient['sender_id'] ?? null;
            if ($senderId) {
                Log::info('SendDistributionEmail: sender_id found, looking up user...', ['sender_id' => $senderId]);
                $user = User::find($senderId);
                if ($user && ! empty($user->gmail_refresh_token)) {
                    Log::info('SendDistributionEmail: User has gmail_refresh_token, attempting Gmail API send...', [
                        'sender_id' => $senderId,
                        'user_email' => $user->email,
                    ]);
                    // Use Gmail API to send as the connected user; keep subject/body as provided
                    $sent = $gmailSender->sendHtmlAsUser($user, $to, $subject, $body);
                    if ($sent) {
                        Log::info('SendDistributionEmail: Email sent successfully via Gmail API', ['to' => $to]);
                        return;
                    }
                    Log::warning('SendDistributionEmail: Gmail API send returned false, falling back to SMTP', ['to' => $to]);
                    // If Gmail send failed, fall back to configured mailer
                } else {
                    Log::warning('SendDistributionEmail: User found but no gmail_refresh_token', [
                        'sender_id' => $senderId,
                        'user_found' => $user !== null,
                        'has_refresh_token' => $user ? !empty($user->gmail_refresh_token) : false,
                    ]);
                }
            } else {
                Log::warning('SendDistributionEmail: No sender_id in recipient data, using SMTP fallback');
            }

            // Fallback to existing mail system
            Log::info('SendDistributionEmail: Attempting SMTP send...', ['to' => $to]);
            Mail::to($to)->send(new DistributionMail($subject, $body));
            Log::info('SendDistributionEmail: Email sent via SMTP', ['to' => $to]);
            // Persist ticket_code into tickets DB if provided (controller already updates unique_trait but we double-write here)
            try {
                $ticketCode = $this->recipient['ticket_code'] ?? null;
                $ticketId = $this->recipient['__ticket_id'] ?? null;
                $eventId = $this->recipient['event_id'] ?? null;
                if ($ticketCode && $ticketId && $eventId) {
                    $event = Event::find($eventId);
                    if ($event) {
                        $tableName = Ticket::generateTableName($event);
                        DB::connection('tickets')->table($tableName)
                            ->where('ticket_id', $ticketId)
                            ->update(['unique_trait' => $ticketCode, 'updated_at' => now()]);
                        Log::info('SendDistributionEmail: persisted ticket_code to tickets DB', ['ticket_id' => $ticketId]);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('SendDistributionEmail: failed to persist ticket_code', ['error' => $e->getMessage(), 'recipient' => $this->recipient]);
            }
        } catch (\Throwable $e) {
            Log::error('SendDistributionEmail failed', ['recipient' => $this->recipient, 'error' => $e->getMessage()]);
            // Let the job fail so the queue can retry according to configuration
            throw $e;
        }
    }
}
