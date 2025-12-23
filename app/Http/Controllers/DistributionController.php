<?php

namespace App\Http\Controllers;

use App\Jobs\SendDistributionEmail;
use App\Models\Event;
use App\Models\Mail;
use App\Models\Ticket;
use BaconQrCode\Renderer\Image\ImagickImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class DistributionController extends Controller
{
    /**
     * Distribute emails to provided recipients and generate tickets in the tickets database.
     * Accepts JSON body with `recipients` array where each entry contains at least `email`, `subject`, `body`, and `event_id`.
     * Uses Gmail OAuth if available for the authenticated user.
     */
    public function distribute(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recipients' => ['required', 'array'],
            'recipients.*.email' => ['required', 'string', 'email'],
            'recipients.*.subject' => ['nullable', 'string'],
            'recipients.*.body' => ['nullable', 'string'],
            'recipients.*.event_id' => ['nullable', 'integer'],
            'recipients.*.first_name' => ['nullable', 'string'],
            'recipients.*.last_name' => ['nullable', 'string'],
            'recipients.*.event_name' => ['nullable', 'string'],
            'recipients.*.event_date' => ['nullable', 'string'],
            'recipients.*.unique_trait' => ['nullable', 'string'],
            'recipients.*.scan_count' => ['nullable', 'integer'],
            'recipients.*.scan_details' => ['nullable'],
        ]);

        $recipients = $data['recipients'];
        $sender = Auth::user();
        $queued = 0;
        $ticketsCreated = 0;
        $dispatchErrors = [];

        // Prepare QR Writer
        $renderer = new ImageRenderer(
            new RendererStyle(300, 1), // 300px size, 1px margin
            new ImagickImageBackEnd
        );
        $writer = new Writer($renderer);

        if (is_array($recipients)) {
            foreach ($recipients as &$recipient) {
                // Only generate tickets for QR mails
                if (!(isset($recipient['body']) && str_contains($recipient['body'], '{{qr}}'))) {
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

            // Dispatch email jobs with updated QR generation logic per recipient
            // Helper to sanitize parts for QR content (preserve case, replace spaces with dashes)
            $sanitizePart = function ($s, $allowEmail = false) {
                $s = trim((string) $s);
                // replace whitespace groups with single dash
                $s = preg_replace('/\s+/', '-', $s);
                if ($allowEmail) {
                    // allow email characters too
                    return preg_replace('/[^A-Za-z0-9@._\-]/', '', $s);
                }

                return preg_replace('/[^A-Za-z0-9_\-]/', '', $s);
            };

            // Helper to ensure block elements have no default margins when sent via email
            $applyInlineReset = function (string $html): string {
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
            };

            foreach ($recipients as &$r) {
                try {
                    // Check if we need to embed a QR code
                    if (isset($r['body']) && str_contains($r['body'], '{{qr}}')) {
                        // Use the ticket_code for QR generation (not just the id)
                        $ticketCode = $r['__ticket_code'] ?? null;

                        if ($ticketCode) {
                            $qrString = $writer->writeString($ticketCode);
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
                        $r['body'] = $applyInlineReset((string) $r['body']);
                    }

                    $mailLog = Mail::create([
                        'event_id' => $r['event_id'] ?? null,
                        'user_id' => $sender?->id,
                        'recipient_email' => $r['email'],
                        'subject' => $r['subject'] ?? null,
                        'body' => $r['body'] ?? null,
                        'success' => false,
                        'metadata' => $r,
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
        }

        return response()->json([
            'queued_count' => $queued,
            'tickets_created' => $ticketsCreated,
            'sent_count' => $queued, // backward-compatible alias
            'queued' => $queued > 0,
            'received_count' => is_array($recipients) ? count($recipients) : 0,
            'dispatch_errors' => $dispatchErrors,
        ]);
    }
}
