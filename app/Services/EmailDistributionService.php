<?php

namespace App\Services;

use App\Models\Sellable;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

/**
 * Service for handling email distribution operations
 * Separates business logic from controllers
 */
class EmailDistributionService
{
    public function __construct(
        private readonly QrCodeGenerationService $qrService,
        private readonly EmailQueueService $emailQueueService,
        private readonly GoogleSheetsService $googleSheetsService
    ) {
    }

    /**
     * Get upcoming events within the specified number of days
     */
    public function getUpcomingEvents(int $days = 14): Collection
    {
        $now = now()->startOfDay();
        $end = now()->addDays($days)->endOfDay();

        // Query both Event and Product tables since they both extend Sellable
        $events = Event::query()
            ->whereNotNull('start_date')
            ->whereBetween('start_date', [$now, $end])
            ->orderBy('start_date')
            ->get();

        $products = Product::query()
            ->whereNotNull('start_date')
            ->whereBetween('start_date', [$now, $end])
            ->orderBy('start_date')
            ->get();

        // Combine and sort by start_date
        return $events->concat($products)->sortBy('start_date');
    }

    /**
     * Get available email templates
     */
    public function getEmailTemplates(): Collection
    {
        // TODO: Implement when MailTemplate model exists
        // For now return empty collection
        return collect([]);
    }

    /**
     * Get attendees for a specific event from Google Sheets
     */
    public function getEventAttendees(Sellable $event, bool $useCache = true): array
    {
        if (!$event->google_spreadsheet_id || !$event->google_sheet_name) {
            throw new \Exception('Spreadsheet not configured for this event');
        }

        $cacheKey = $this->getAttendeeCacheKey($event);

        if (!$useCache) {
            Cache::forget($cacheKey);
        }

        return Cache::remember($cacheKey, 3600, function () use ($event) {
            $rows = $this->googleSheetsService->getSheetData(
                $event->google_spreadsheet_id,
                $event->google_sheet_name
            );

            // Apply filtering if configured
            return $this->filterAttendeeRows($event, $rows);
        });
    }

    /**
     * Process email distribution to recipients
     */
    public function processDistribution(array $recipients, ?User $sender): array
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

    /**
     * Filter attendee rows based on event configuration
     */
    private function filterAttendeeRows(Sellable $event, array $rows): array
    {
        // TODO: Implement filtering logic based on event->attendee_filter_config
        // For now, return rows as-is
        return $rows;
    }

    /**
     * Generate cache key for attendees
     */
    private function getAttendeeCacheKey(Sellable $event): string
    {
        $filterHash = md5(json_encode($event->attendee_filter_config ?? []));
        return "email_distributor_attendees_{$event->id}_{$filterHash}";
    }
}
