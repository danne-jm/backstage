<?php

namespace App\Services;

use App\Models\sellables\Event;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Service for handling email distribution operations
 * 
 * Focuses exclusively on email distribution logic:
 * - Ticket generation for QR codes
 * - Email queuing and dispatch
 * - Distribution workflow orchestration
 * 
 * Delegates to other services:
 * - AttendeeService: For attendee data fetching and filtering
 * - QrCodeGenerationService: For QR code ticket generation
 * - EmailQueueService: For email queuing
 */
class EmailDistributionService
{
    public function __construct(
        private readonly QrCodeGenerationService $qrService,
        private readonly EmailQueueService $emailQueueService,
        private readonly AttendeeService $attendeeService
    ) {
    }

    /**
     * Get upcoming events within the specified number of days
     * 
     * This method is kept for backward compatibility
     * Consider moving to a dedicated EventService in the future
     */
    public function getUpcomingEvents(int $days = 14): Collection
    {
        // Show events that are within the next 2 weeks OR occurred at most 2 days ago
        $from = now()->subDays(2)->startOfDay();
        $until = now()->addDays(14)->endOfDay();

        return Event::query()
            ->where(function ($q) use ($from, $until) {
                $q->whereBetween('event_date', [$from, $until]);
            })
            ->orderBy('event_date', 'asc')
            ->get();
    }

    /**
     * Get available email templates
     * 
     * TODO: Implement when MailTemplate model exists
     * For now return empty collection
     */
    public function getEmailTemplates(): Collection
    {
        return collect([]);
    }

    /**
     * Process email distribution to recipients
     */
    public function processDistribution(array $recipients, ?User $sender, ?string $qrLogo = null): array
    {
        $queued = 0;
        $ticketsCreated = 0;
        $dispatchErrors = [];

        // First pass: Create tickets for QR-enabled emails
        $recipients = $this->processTicketGeneration(
            $recipients,
            $sender,
            $ticketsCreated
        );

        // Second pass: Queue emails for sending
        foreach ($recipients as $recipient) {
            try {
                if ($qrLogo) {
                    $recipient['__qr_logo'] = $qrLogo;
                }
                $this->emailQueueService->queueEmail($recipient, $sender);
                $queued++;
            } catch (\Throwable $e) {
                $dispatchErrors[] = [
                    'recipient' => $recipient['email'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ];
            }
        }

        return [
            'queued' => $queued,
            'tickets_created' => $ticketsCreated,
            'dispatch_errors' => $dispatchErrors,
        ];
    }

    /**
     * Process ticket generation for QR-enabled emails
     */
    private function processTicketGeneration(
        array $recipients,
        ?User $sender,
        int &$ticketsCreated
    ): array {
        foreach ($recipients as &$recipient) {
            if (!$this->needsQrCode($recipient)) {
                continue;
            }

            try {
                $ticket = $this->qrService->generateTicket(
                    $recipient,
                    $sender
                );

                $recipient['__ticket_code'] = $ticket->ticket_code;
                $recipient['__ticket_id'] = $ticket->id;
                $ticketsCreated++;
            } catch (\Throwable $e) {
                \Log::error('Ticket generation failed', [
                    'recipient' => $recipient['email'] ?? 'unknown',
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $recipients;
    }

    /**
     * Check if recipient needs a QR code
     */
    private function needsQrCode(array $recipient): bool
    {
        return isset($recipient['body']) &&
            str_contains($recipient['body'], '{{qr}}');
    }
}
