<?php

namespace App\Services;

use App\Events\TicketSold;
use App\Models\Sellable;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Service for generating QR codes and tickets
 * Handles ticket creation and QR code image generation
 */
class QrCodeGenerationService
{
    private ?\BaconQrCode\Writer $writer = null;

    public function __construct()
    {
        $this->initializeQrWriter();
    }

    /**
     * Initialize QR code writer
     * Prefer Imagick backend for better email client compatibility.
     * Fall back to SVG if Imagick is not available.
     */
    private function initializeQrWriter(): void
    {
        $style = new \BaconQrCode\Renderer\RendererStyle\RendererStyle(300, 1);

        $renderer = new \BaconQrCode\Renderer\ImageRenderer(
            $style,
            new \BaconQrCode\Renderer\Image\ImagickImageBackEnd()
        );

        $this->writer = new \BaconQrCode\Writer($renderer);
    }

    /**
     * Find sellable by ID (Event or Product)
     */
    private function findSellable(string $id): ?Sellable
    {
        // Try Event first, then Product
        return Event::find($id) ?? Product::find($id);
    }

    /**
     * Generate a ticket for an event
     */
    public function generateTicket(array $recipient, ?User $sender): Ticket
    {
        $eventId = $recipient['event_id'] ?? null;
        $event = $eventId ? $this->findSellable($eventId) : null;

        if (!$event) {
            throw new \Exception('Event not found for ticket generation');
        }

        $uniqueTrait = $recipient['unique_trait'] ?? Str::random(8);
        $ticketCode = $this->generateTicketCode($recipient, $event, $uniqueTrait);

        $ticket = $event->tickets()->create([
            'user_id' => $sender?->id,
            'ticket_code' => $ticketCode,
            'first_name' => $recipient['first_name'] ?? '',
            'last_name' => $recipient['last_name'] ?? '',
            'email' => $recipient['email'] ?? '',
            'event_name' => $recipient['event_name'] ?? $event->name,
            'event_date' => $this->formatEventDate($recipient, $event),
            'unique_trait' => $uniqueTrait,
            'scan_count' => $recipient['scan_count'] ?? 0,
            'scan_details' => $recipient['scan_details'] ?? null,
            'metadata' => $this->buildTicketMetadata($recipient, $event),
            'scanned_at' => null,
        ]);

        // Dispatch event for ticket scanner listeners
        TicketSold::dispatch($event->id, $ticket);

        // Clear cache
        Cache::forget("available_tickets_{$event->id}");

        return $ticket;
    }

    /**
     * Generate QR code image tag
     */
    public function generateQrImageTag(string $ticketCode): string
    {
        $qrString = $this->writer->writeString($ticketCode);
        $base64 = base64_encode($qrString);

        $mime = 'image/png';

        return sprintf(
            '<img src="data:%s;base64,%s" alt="%s" style="display:block; margin:0; max-width:200px;" />',
            $mime,
            $base64,
            htmlspecialchars($ticketCode, ENT_QUOTES, 'UTF-8')
        );
    }

    /**
     * Generate unique ticket code
     */
    private function generateTicketCode(array $recipient, Sellable $event, string $uniqueTrait): string
    {
        $sanitizedEvent = $this->sanitize($recipient['event_name'] ?? $event->name);
        $sanitizedFirst = $this->sanitize($recipient['first_name'] ?? '');
        $sanitizedLast = $this->sanitize($recipient['last_name'] ?? '');
        $sanitizedFullName = trim($sanitizedFirst . '-' . $sanitizedLast, '-');
        $sanitizedEmail = preg_replace('/[^A-Za-z0-9@._\-]+/', '', $recipient['email'] ?? '');

        $datePart = $this->formatDateForTicketCode($recipient, $event);

        return sprintf(
            '%s_%s_to_%s_via_%s_%s',
            $sanitizedEvent,
            $datePart,
            $sanitizedFullName,
            $sanitizedEmail,
            $uniqueTrait
        );
    }

    /**
     * Sanitize string for ticket code
     */
    private function sanitize(string $value): string
    {
        return preg_replace('/[^A-Za-z0-9]+/', '-', $value);
    }

    /**
     * Format event date for ticket code
     */
    private function formatDateForTicketCode(array $recipient, Sellable $event): string
    {
        $eventDate = $recipient['event_date'] ?? $event->start_date ?? $event->event_date ?? null;

        if (!$eventDate) {
            return 'nodate';
        }

        try {
            return (new \DateTime($eventDate))->format('d-m-Y');
        } catch (\Throwable $e) {
            return str_replace([' ', ':', '-'], '', (string) $eventDate);
        }
    }

    /**
     * Format event date for database
     */
    private function formatEventDate(array $recipient, Sellable $event): ?string
    {
        $eventDate = $recipient['event_date'] ?? $event->start_date ?? $event->event_date ?? null;

        if (!$eventDate) {
            return null;
        }

        try {
            return (new \DateTime($eventDate))->format('Y-m-d H:i:s');
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Build ticket metadata
     */
    private function buildTicketMetadata(array $recipient, Sellable $event): array
    {
        return [
            'first_name' => $recipient['first_name'] ?? '',
            'last_name' => $recipient['last_name'] ?? '',
            'email' => $recipient['email'] ?? '',
            'event_name' => $recipient['event_name'] ?? $event->name,
            'event_date' => $this->formatEventDate($recipient, $event),
        ];
    }
}
