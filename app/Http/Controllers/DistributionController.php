<?php

namespace App\Http\Controllers;

use App\Jobs\SendDistributionEmail;
use App\Models\Event;
use App\Models\Ticket;
use App\Models\MailTemplate;
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
        ]);

        $recipients = $data['recipients'];
        $sender = Auth::user();
        $queued = 0;
        $ticketsCreated = 0;
        $dispatchErrors = [];

        // Prepare QR Writer
        $renderer = new ImageRenderer(
            new RendererStyle(300, 1), // 300px size, 1px margin
            new ImagickImageBackEnd()
        );
        $writer = new Writer($renderer);

        if (is_array($recipients)) {
            // Group recipients by event_id to create tables once per event
            $recipientsByEvent = [];
            foreach ($recipients as $idx => &$r) {
                $eventId = $r['event_id'] ?? null;
                if ($eventId) {
                    if (!isset($recipientsByEvent[$eventId])) {
                        $recipientsByEvent[$eventId] = [];
                    }
                    $recipientsByEvent[$eventId][] = &$recipients[$idx];
                }
            }
            unset($r); // break reference

            // Create ticket tables for events that need them
            foreach ($recipientsByEvent as $eventId => &$eventRecipients) {
                try {
                    $event = Event::find($eventId);
                    if (!$event) {
                        continue;
                    }

                    $tableName = Ticket::generateTableName($event);

                    // Create table if it doesn't exist
                    if (!Schema::connection('tickets')->hasTable($tableName)) {
                        Schema::connection('tickets')->create($tableName, function ($table) {
                            $table->id();
                            $table->unsignedBigInteger('event_id')->nullable();
                            $table->string('first_name')->nullable();
                            $table->string('last_name')->nullable();
                            $table->string('email')->nullable();
                            $table->string('event_name')->nullable();
                            $table->dateTime('event_date')->nullable();
                            $table->string('unique_trait')->nullable();
                            $table->string('ticket_id')->unique();
                            $table->unsignedInteger('scan_count')->default(0);
                            $table->json('scan_details')->nullable();
                            $table->timestamps();

                            $table->index(['event_id']);
                            $table->index(['ticket_id']);
                        });
                    }

                    // Create tickets for this event and update recipient with ticket_id
                    foreach ($eventRecipients as &$r) {
                        $unique = Str::random(8);
                        $first = $r['first_name'] ?? '';
                        $last = $r['last_name'] ?? '';
                        $eventName = $r['event_name'] ?? $event->name;
                        $eventDate = $r['event_date'] ?? $event->event_date;

                        // Convert event_date to MySQL datetime format
                        $mysqlEventDate = null;
                        if ($eventDate) {
                            try {
                                $mysqlEventDate = (new \DateTime($eventDate))->format('Y-m-d H:i:s');
                            } catch (\Throwable $e) {
                                $mysqlEventDate = null;
                            }
                        }

                        $datePart = null;
                        if ($eventDate) {
                            try {
                                $datePart = (new \DateTime($eventDate))->format('YmdHis');
                            } catch (\Throwable $e) {
                                $datePart = str_replace([' ', ':', '-'], '', (string) $eventDate);
                            }
                        }

                        $sanitizedName = preg_replace('/[^A-Za-z0-9_]+/', '_', (string) $eventName);
                        $sanitizedFirst = preg_replace('/[^A-Za-z0-9_]+/', '_', (string) $first);
                        $sanitizedLast = preg_replace('/[^A-Za-z0-9_]+/', '_', (string) $last);

                        $ticketId = trim(sprintf('%s_%s_%s_%s_%s', $sanitizedName, $datePart ?? 'nodate', $sanitizedFirst, $sanitizedLast, $unique), '_');

                        // Insert ticket directly into the tickets database table
                        DB::connection('tickets')->table($tableName)->insert([
                            'event_id' => $eventId,
                            'first_name' => $first,
                            'last_name' => $last,
                            'email' => $r['email'],
                            'event_name' => $eventName,
                            'event_date' => $mysqlEventDate,
                            'unique_trait' => $unique,
                            'ticket_id' => $ticketId,
                            'scan_count' => 0,
                            'scan_details' => null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);

                        $ticketsCreated++;

                        // Attach ticket_id to recipient for QR generation
                        $r['__ticket_id'] = $ticketId;
                        $r['__event_name'] = $eventName;
                    }
                    unset($r);
                } catch (\Throwable $e) {
                    Log::error('Failed to create tickets for event', ['event_id' => $eventId, 'error' => $e->getMessage()]);
                }
            }
            unset($eventRecipients);

            // Dispatch email jobs with QR code if needed
            foreach ($recipients as &$r) {
                try {
                    // Only generate QR if {{qr}} tag is present in the body
                    if (isset($r['body']) && str_contains($r['body'], '{{qr}}')) {
                        $ticketId = $r['__ticket_id'] ?? null;
                        $eventName = $r['__event_name'] ?? '';
                        $qrContent = $ticketId ? $ticketId : ($eventName . '|' . ($r['email'] ?? ''));
                        $qrString = $writer->writeString($qrContent);
                        $base64 = base64_encode($qrString);
                        $imgTag = sprintf('<img src="data:image/png;base64,%s" alt="Ticket QR" style="display:block; margin: 20px auto; max-width: 200px;" />', $base64);
                        $r['body'] = str_replace('{{qr}}', $imgTag, $r['body']);
                    }

                    $payload = array_merge($r, [
                        'sender_id' => $sender?->id,
                        'sender_email' => $sender?->email,
                    ]);

                    SendDistributionEmail::dispatch($payload)->onQueue('distributions');
                    $queued++;
                } catch (\Throwable $e) {
                    Log::error('DistributionController::distribute dispatch error', ['recipient' => $r, 'error' => $e->getMessage()]);
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
