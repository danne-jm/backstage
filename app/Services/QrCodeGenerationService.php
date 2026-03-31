<?php

namespace App\Services;

use App\Events\TicketSold;
use App\Models\Sellable;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use App\Models\Ticket;
use App\Models\User;
use BaconQrCode\Common\ErrorCorrectionLevel;
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
    public function generateQrImageTag(string $ticketCode, ?string $logoBase64 = null): string
    {
        $qrString = $this->writer->writeString(
            $ticketCode,
            'utf-8',
            ErrorCorrectionLevel::H()
        );

        if ($logoBase64) {
            $qrString = $this->embedLogoInQr($ticketCode, $qrString, $logoBase64);
        }

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
     * Embed logo in the center of the QR code using Imagick
     */
    private function embedLogoInQr(string $ticketCode, string $qrBlob, string $logoBase64): string
    {
        try {
            // Strip data uri scheme if present
            $logoData = preg_replace('#^data:image/[^;]+;base64,#', '', $logoBase64);
            $logoBlob = base64_decode($logoData);

            if (!$logoBlob) {
                return $qrBlob;
            }

            $qrImage = new \Imagick();
            $qrImage->readImageBlob($qrBlob);

            // Generate Matrix logic to calculate exact mathematical module boundaries safely
            $qrCode = \BaconQrCode\Encoder\Encoder::encode($ticketCode, \BaconQrCode\Common\ErrorCorrectionLevel::H(), 'utf-8');
            $matrixSize = $qrCode->getMatrix()->getWidth();

            $qrWidth = $qrImage->getImageWidth();
            $marginModules = 1; // BaconQrCode ImageRenderer natively processes with margin=1
            $totalModules = $matrixSize + ($marginModules * 2);

            $moduleSize = $qrWidth / $totalModules;
            $marginPixels = $marginModules * $moduleSize;
            $realEyeSizeForCrop = ceil(7 * $moduleSize) + 1; // 7x7 modules are the structural standard for finding eyes

            $logoImage = new \Imagick();
            $logoImage->readImageBlob($logoBlob);

            // Crop the uploaded poster specifically tracking the data box (avoiding quiet zone margins)
            $innerBoxSize = (int) ceil($qrWidth - (2 * $marginPixels));
            $logoImage->cropThumbnailImage($innerBoxSize, $innerBoxSize);

            // Darken the logo by 40% globally. This aggressively protects the contrast parity so scanners
            // can safely identify the modules even if the uploaded art contains perfectly white elements!
            $blackLayer = new \Imagick();
            $blackLayer->newImage($innerBoxSize, $innerBoxSize, new \ImagickPixel('rgba(0,0,0,0.4)'));
            $logoImage->compositeImage($blackLayer, \Imagick::COMPOSITE_OVER, 0, 0);

            // Strip out the quiet margin from our B/W tracking matrix
            $innerQr = clone $qrImage;
            $innerQr->cropImage($innerBoxSize, $innerBoxSize, $marginPixels, $marginPixels);

            // SCREEN composite maps the masked texture into the QR. White areas stay firmly White.
            // Black areas become directly linked to the poster tracking layer structure.
            $logoImage->compositeImage($innerQr, \Imagick::COMPOSITE_SCREEN, 0, 0);

            // Extract pure intact Finder Patterns (the Big Corners) heavily preserved from unmodified QR layout.
            $eyeTL = clone $qrImage;
            $eyeTL->cropImage($realEyeSizeForCrop, $realEyeSizeForCrop, $marginPixels, $marginPixels);

            $eyeTR = clone $qrImage;
            $eyeTR->cropImage($realEyeSizeForCrop, $realEyeSizeForCrop, $qrWidth - $marginPixels - (7 * $moduleSize), $marginPixels);

            $eyeBL = clone $qrImage;
            $eyeBL->cropImage($realEyeSizeForCrop, $realEyeSizeForCrop, $marginPixels, $qrWidth - $marginPixels - (7 * $moduleSize));

            // Pin the tracking eyes precisely back down over the poster layer!
            $logoImage->compositeImage($eyeTL, \Imagick::COMPOSITE_OVER, 0, 0);
            $logoImage->compositeImage($eyeTR, \Imagick::COMPOSITE_OVER, $innerBoxSize - (7 * $moduleSize), 0);
            $logoImage->compositeImage($eyeBL, \Imagick::COMPOSITE_OVER, 0, $innerBoxSize - (7 * $moduleSize));

            // Paste our flawless Scanova rendering back into the generic canvas bounds to safely attach original margins
            $qrImage->compositeImage($logoImage, \Imagick::COMPOSITE_OVER, $marginPixels, $marginPixels);

            $qrImage->setImageFormat('png');
            $resultBlob = $qrImage->getImageBlob();

            // Clear buffers carefully
            $qrImage->clear();
            $logoImage->clear();
            $blackLayer->clear();
            $innerQr->clear();

            return $resultBlob;
        } catch (\Throwable $e) {
            \Log::warning('Failed to embed logo into QR code', ['error' => $e->getMessage()]);
            return $qrBlob;
        }
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
