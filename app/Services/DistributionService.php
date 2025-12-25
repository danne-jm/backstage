<?php

namespace App\Services;

use App\Jobs\SendDistributionEmail;
use App\Models\Event;
use App\Models\Mail;
use App\Models\User;
use BaconQrCode\Renderer\Image\ImagickImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DistributionService
{
    protected ?Writer $writer = null;

    public function __construct()
    {
        // Prepare QR Writer lazily or in constructor
        $renderer = new ImageRenderer(
            new RendererStyle(300, 1), // 300px size, 1px margin
            new ImagickImageBackEnd
        );
        $this->writer = new Writer($renderer);
    }

    public function processDistribution(array $recipients, ?User $sender): array
    {
        $originalRecipients = $recipients;
        $queued = 0;
        $ticketsCreated = 0;
        $dispatchErrors = [];

        foreach ($recipients as $key => &$recipient) {
            // Only generate tickets for QR mails
            if (! (isset($recipient['body']) && str_contains($recipient['body'], '{{qr}}'))) {
                continue;
            }

            $eventId = $recipient['event_id'] ?? null;
            $event = $eventId ? Event::find($eventId) : null;
            if (! $event) {
                continue;
            }
            $unique = Str::random(8);
            $first = $recipient['first_name'] ?? '';
            $last = $recipient['last_name'] ?? '';
            $eventName = $recipient['event_name'] ?? $event->name;
            $eventDate = $recipient['event_date'] ?? $event->event_date;
            $email = $recipient['email'] ?? '';
            $uniqueTrait = $recipient['unique_trait'] ?? $unique;
            $scanCount = $recipient['scan_count'] ?? 0;
            $scanDetails = $recipient['scan_details'] ?? null;

            // Convert event_date to MySQL datetime format
            $mysqlEventDate = null;
            $datePart = 'nodate';
            if ($eventDate) {
                try {
                    $mysqlEventDate = (new \DateTime($eventDate))->format('Y-m-d H:i:s');
                    $datePart = (new \DateTime($eventDate))->format('d-m-Y');
                } catch (\Throwable $e) {
                    $mysqlEventDate = null;
                    $datePart = str_replace([' ', ':', '-'], '', (string) $eventDate);
                }
            }

            // Sanitize for new format: dashes for event and names
            $sanitizedEvent = preg_replace('/[^A-Za-z0-9]+/', '-', (string) $eventName);
            $sanitizedFirst = preg_replace('/[^A-Za-z0-9]+/', '-', (string) $first);
            $sanitizedLast = preg_replace('/[^A-Za-z0-9]+/', '-', (string) $last);
            $sanitizedFullName = trim($sanitizedFirst.'-'.$sanitizedLast, '-');
            $sanitizedEmail = preg_replace('/[^A-Za-z0-9@._\-]+/', '', (string) $email);

            $ticketCode = sprintf('%s_%s_to_%s_via_%s_%s',
                $sanitizedEvent,
                $datePart,
                $sanitizedFullName,
                $sanitizedEmail,
                $unique
            );

            // Create ticket using Eloquent relationship, store all fields directly
            $ticket = $event->tickets()->create([
                'user_id' => $sender->id ?? null,
                'ticket_code' => $ticketCode,
                'first_name' => $first,
                'last_name' => $last,
                'email' => $email,
                'event_name' => $eventName,
                'event_date' => $mysqlEventDate,
                'unique_trait' => $uniqueTrait,
                'scan_count' => $scanCount,
                'scan_details' => $scanDetails,
                'metadata' => [
                    'first_name' => $first,
                    'last_name' => $last,
                    'email' => $email,
                    'event_name' => $eventName,
                    'event_date' => $mysqlEventDate,
                ],
                'scanned_at' => null,
            ]);

            $ticketsCreated++;

            // Attach ticket_code and ticket_id to recipient for QR generation
            $recipient['__ticket_code'] = $ticketCode;
            $recipient['__event_name'] = $eventName;
            $recipient['__ticket_id'] = $ticket->id;
        }
        unset($recipient);

        foreach ($recipients as $key => &$r) {
            try {
                $originalBody = $originalRecipients[$key]['body'] ?? '';

                // Check if we need to embed a QR code
                if (isset($r['body']) && str_contains($r['body'], '{{qr}}')) {
                    // Use the ticket_code for QR generation (not just the id)
                    $ticketCode = $r['__ticket_code'] ?? null;

                    if ($ticketCode) {
                        $qrString = $this->writer->writeString($ticketCode);
                        $base64 = base64_encode($qrString);

                        $imgTag = sprintf(
                            '<img src="data:image/png;base64,%s" alt="Ticket QR" style="display:block; margin:0; max-width: 200px;" />',
                            $base64
                        );

                        $r['body'] = str_replace('{{qr}}', $imgTag, $r['body']);
                    } else {
                        Log::warning('No ticket_code found for QR generation', ['recipient' => $r['email'] ?? 'unknown']);
                        $r['body'] = str_replace('{{qr}}', '<p>QR code unavailable</p>', $r['body']);
                    }
                }

                // Normalize body to remove default margins in email clients
                if (isset($r['body'])) {
                    $r['body'] = $this->applyInlineReset((string) $r['body']);
                }

                $mailLog = Mail::create([
                    'event_id' => $r['event_id'] ?? null,
                    'user_id' => $sender?->id,
                    'recipient_email' => $r['email'],
                    'subject' => $r['subject'] ?? null,
                    'body' => $originalBody, // Store original composed body
                    'success' => false,
                    'metadata' => $r, // Store processed recipient data for sending
                ]);

                $payload = array_merge($r, [
                    'sender_id' => $sender?->id,
                    'sender_email' => $sender?->email,
                    'mail_log_id' => $mailLog->id,
                ]);

                SendDistributionEmail::dispatch($payload)->onQueue('distributions');
                $queued++;

            } catch (\Throwable $e) {
                Log::error('Distribution error', ['error' => $e->getMessage()]);
                $dispatchErrors[] = ['recipient' => $r, 'error' => $e->getMessage()];
            }
        }
        unset($r);

        return [
            'queued' => $queued,
            'tickets_created' => $ticketsCreated,
            'dispatch_errors' => $dispatchErrors,
        ];
    }

    protected function applyInlineReset(string $html): string
    {
        if (! $html) {
            return $html;
        }
        // Use DOMDocument to add inline styles to common block elements
        libxml_use_internal_errors(true);
        $doc = new \DOMDocument;
        // Ensure proper encoding
        $loaded = $doc->loadHTML('<?xml encoding="utf-8"?>'.$html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        if (! $loaded) {
            libxml_clear_errors();

            return $html;
        }

        $tags = ['p', 'ul', 'li', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        foreach ($tags as $tag) {
            $nodes = $doc->getElementsByTagName($tag);
            // iterate in reverse to avoid live node list issues
            for ($i = $nodes->length - 1; $i >= 0; $i--) {
                $n = $nodes->item($i);
                if (! $n) {
                    continue;
                }
                $existing = $n->getAttribute('style') ?? '';
                // Build required inline reset pieces
                $pieces = [];
                if (stripos($existing, 'margin:') === false) {
                    $pieces[] = 'margin:0;';
                }
                if ($tag === 'ul') {
                    if (stripos($existing, 'padding-left:') === false) {
                        $pieces[] = 'padding-left:20px;';
                    }
                    if (stripos($existing, 'list-style') === false) {
                        $pieces[] = 'list-style-type:disc;';
                    }
                }
                if ($tag === 'li') {
                    if (stripos($existing, 'display:') === false) {
                        $pieces[] = 'display:list-item;';
                    }
                }
                // Preserve existing styles but ensure reset pieces are appended
                if (! empty($pieces)) {
                    $append = implode('', $pieces);
                    $existing = $existing ? rtrim($existing, ';').';'.$append : $append;
                }
                $n->setAttribute('style', $existing);
            }
        }

        $body = '';
        $children = $doc->getElementsByTagName('body');
        if ($children->length > 0) {
            $bodyNode = $children->item(0);
            // get innerHTML of body
            foreach ($bodyNode->childNodes as $child) {
                $body .= $doc->saveHTML($child);
            }
        } else {
            $body = $doc->saveHTML();
        }
        libxml_clear_errors();

        return $body;
    }
}
