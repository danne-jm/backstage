<?php

namespace App\Services;

use App\Jobs\SendDistributionEmail;
use App\Models\Mail;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Service for queuing emails for distribution
 * Separated from EmailDistributionService for single responsibility
 */
class EmailQueueService
{
    public function __construct(
        private readonly QrCodeGenerationService $qrService,
        private readonly EmailFormattingService $emailFormattingService
    ) {
    }

    /**
     * Queue an email for sending
     */
    public function queueEmail(array $recipient, ?User $sender): void
    {
        if (!$sender || !$sender->gmail_refresh_token) {
            throw new \RuntimeException('Sender must have a connected Google account to distribute emails.');
        }

        // Store original body before QR embedding
        $originalBody = $recipient['body'] ?? '';

        // Embed QR code if needed
        if (isset($recipient['__ticket_code'])) {
            $recipient = $this->embedQrCode($recipient);
        }

        // Apply email formatting/normalization
        if (isset($recipient['body'])) {
            $recipient['body'] = $this->emailFormattingService->applyInlineReset(
                $recipient['body']
            );
        }

        // Create mail log entry
        $mailLog = $this->createMailLog($recipient, $sender, $originalBody);

        // Prepare payload for queue
        $payload = $this->prepareQueuePayload($recipient, $sender, $mailLog);

        // Dispatch to queue
        SendDistributionEmail::dispatch($payload)->onQueue('distributions');
    }

    /**
     * Embed QR code into email body
     */
    private function embedQrCode(array $recipient): array
    {
        $ticketCode = $recipient['__ticket_code'] ?? null;

        if (!$ticketCode) {
            Log::warning('No ticket_code found for QR generation', [
                'recipient' => $recipient['email'] ?? 'unknown'
            ]);
            $recipient['body'] = str_replace(
                '{{qr}}',
                '<p>QR code unavailable</p>',
                $recipient['body']
            );
            return $recipient;
        }

        try {
            $qrImageTag = $this->qrService->generateQrImageTag($ticketCode);
            $recipient['body'] = str_replace('{{qr}}', $qrImageTag, $recipient['body']);
        } catch (\Throwable $e) {
            Log::error('QR code generation failed', [
                'ticket_code' => $ticketCode,
                'error' => $e->getMessage(),
            ]);
            $recipient['body'] = str_replace(
                '{{qr}}',
                '<p>QR code generation failed</p>',
                $recipient['body']
            );
        }

        return $recipient;
    }

    /**
     * Create mail log entry
     */
    private function createMailLog(array $recipient, ?User $sender, string $originalBody): Mail
    {
        return Mail::create([
            'event_id' => $recipient['event_id'] ?? null,
            'user_id' => $sender?->id,
            'recipient_email' => $recipient['email'],
            'subject' => $recipient['subject'] ?? null,
            'body' => $originalBody,
            'success' => false,
            'metadata' => $recipient,
        ]);
    }

    /**
     * Prepare payload for queue
     */
    private function prepareQueuePayload(array $recipient, ?User $sender, Mail $mailLog): array
    {
        return array_merge($recipient, [
            'sender_id' => $sender?->id,
            'sender_email' => $sender?->email,
            'mail_log_id' => $mailLog->id,
        ]);
    }
}
