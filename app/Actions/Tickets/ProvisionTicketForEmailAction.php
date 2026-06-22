<?php

namespace App\Actions\Tickets;

use App\Models\Event;
use App\Models\Ticket;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProvisionTicketForEmailAction
{
    /**
     * Creates a ticket record and generates its physical QR code file.
     * Returns an array containing the Ticket model and the absolute path to the generated QR code.
     *
     * @return array{0: Ticket, 1: string}
     */
    public function handle(Event $event, string $email, ?string $firstName = null, ?string $lastName = null): array
    {
        // 1. Create a cryptographically secure, unique ticket code
        $ticketCode = 'TKT-'.strtoupper(Str::random(12));

        // 2. Provision the ticket in the database
        $ticket = Ticket::create([
            'event_id' => $event->id,
            'ticket_code' => $ticketCode,
            'email' => $email,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'scan_count' => 0,
            'scan_details' => [],
        ]);

        // 3. Generate the QR Code using BaconQrCode
        $renderer = new ImageRenderer(
            new RendererStyle(400),
            new SvgImageBackEnd
        );

        $writer = new Writer($renderer);
        $qrCodeSvgString = $writer->writeString($ticketCode);

        // 4. Save the QR code SVG temporarily
        $fileName = "tickets/{$ticket->id}.svg";
        Storage::disk('local')->put($fileName, $qrCodeSvgString);

        $absolutePath = Storage::disk('local')->path($fileName);

        return [$ticket, $absolutePath];
    }
}
