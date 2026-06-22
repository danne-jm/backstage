<?php

namespace App\Services\Mail;

use App\Contracts\EmailTransportInterface;
use Illuminate\Mail\Message;
use Illuminate\Support\Facades\Mail;

class SmtpEmailTransport implements EmailTransportInterface
{
    public function send(string $to, string $subject, string $htmlBody, array $attachments = []): bool
    {
        try {
            Mail::html($htmlBody, function (Message $message) use ($to, $subject, $attachments) {
                $message->to($to)
                    ->subject($subject);

                foreach ($attachments as $attachment) {
                    // Assuming $attachment is a file path for now.
                    // Real implementation would handle options like inline CIDs.
                    $message->attach($attachment);
                }
            });

            return true;
        } catch (\Exception $e) {
            // Log error
            \Log::error("SMTP Email failed to send to {$to}: ".$e->getMessage());

            return false;
        }
    }
}
