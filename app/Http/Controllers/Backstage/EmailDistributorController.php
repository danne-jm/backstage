<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backstage\SendDistributionRequest;
use App\Jobs\SendBulkDistributionEmailJob;
use App\Models\Event;
use App\Models\MailLog;
use App\Models\Ticket;
use App\Models\User;
use App\Services\Google\GoogleSheetsAdapter;
use Google\Client;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EmailDistributorController extends Controller
{
    /**
     * Show the email distributor compose interface.
     */
    public function index(Request $request): Response
    {
        $isGoogleConnected = $this->isGoogleConnectionValid(Auth::user());

        return Inertia::render('backstage/email-distributor/index', [
            'is_google_connected' => $isGoogleConnected,
            'events' => Event::orderByDesc('event_date')
                ->get(['id', 'name', 'event_date', 'google_spreadsheet_id', 'google_sheet_name']),
            'recent_logs' => Inertia::defer(fn () => MailLog::with('event')
                ->latest()
                ->limit(50)
                ->get()
                ->map(fn (MailLog $log) => [
                    'id' => $log->id,
                    'event_name' => $log->event?->name,
                    'recipient_email' => $log->recipient_email,
                    'subject' => $log->subject,
                    'success' => $log->success,
                    'error_message' => $log->error_message,
                    'sent_at' => $log->created_at->toIso8601String(),
                ])),
        ]);
    }

    private function isGoogleConnectionValid(User $user): bool
    {
        if (empty($user->gmail_refresh_token)) {
            return false;
        }

        try {
            $client = new Client;
            $client->setClientId(config('services.google.client_id'));
            $client->setClientSecret(config('services.google.client_secret'));
            $token = $client->fetchAccessTokenWithRefreshToken($user->gmail_refresh_token);

            if (isset($token['error'])) {
                return false;
            }

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Dispatch bulk distribution emails.
     *
     * Recipients can be targeted by:
     *   - A free-form comma-separated list of emails
     *   - All ticket holders for a specific event
     */
    public function distribute(SendDistributionRequest $request): RedirectResponse
    {
        /** @var User $sender */
        $sender = Auth::user();

        $subject = $request->string('subject')->toString();
        $eventId = $request->input('event_id');
        $customEventName = $request->input('custom_event_name');

        $emails = collect($request->input('emails', []));

        if ($emails->isEmpty()) {
            return back()->withErrors(['recipients' => 'No valid recipients found.']);
        }

        if (! $this->isGoogleConnectionValid($sender)) {
            return back()->with('error', 'Google account not connected or credentials expired. Please reconnect in settings.');
        }

        $includeQr = $request->boolean('include_qr');
        $event = $eventId ? Event::find($eventId) : null;
        $eventName = $event ? $event->name : ($customEventName ?: 'General Event');
        $eventDate = $event ? $event->event_date->format('d-m-Y') : 'Unknown Date';

        // Dispatch one queued job per recipient
        foreach ($emails as $emailData) {
            $htmlBody = $emailData['body'];
            $inlineEmbedUrls = [];

            if ($includeQr) {
                $firstName = $emailData['first_name'] ?? 'Attendee';
                $lastName = $emailData['last_name'] ?? '';

                $safeEventName = str_replace(' ', '-', $eventName);
                $safeName = str_replace(' ', '-', trim("{$firstName} {$lastName}"));
                $uniqueCode = Str::random(8);

                $ticketCode = "{$safeEventName}_{$eventDate}_to_{$safeName}_via_{$emailData['email']}_{$uniqueCode}.png";

                Ticket::create([
                    'event_id' => $eventId,
                    'ticket_code' => $ticketCode,
                    'email' => $emailData['email'],
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'scan_count' => 0,
                ]);

                $qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data='.urlencode($ticketCode);
                $qrImageTag = '<img src="cid:ticket-qr.png" alt="Ticket QR Code" />';
                $htmlBody = str_replace('{{qr}}', $qrImageTag, $htmlBody);
                $inlineEmbedUrls['ticket-qr.png'] = $qrUrl;
            }

            SendBulkDistributionEmailJob::dispatch(
                sender: $sender,
                recipientEmail: $emailData['email'],
                subject: $subject,
                htmlBody: $htmlBody,
                eventId: $eventId,
                inlineEmbedUrls: $inlineEmbedUrls
            )->onQueue('distributions');
        }

        return back()->with('success', "Queued {$emails->count()} email(s) for distribution.");
    }

    /**
     * Dispatch a sample email to the currently authenticated user.
     */
    public function distributeSample(Request $request): RedirectResponse
    {
        /** @var User $sender */
        $sender = Auth::user();

        $request->validate([
            'subject' => ['required', 'string'],
            'body' => ['required', 'string'],
        ]);

        if (! $this->isGoogleConnectionValid($sender)) {
            return back()->with('error', 'Google account not connected or credentials expired. Please reconnect in settings.');
        }

        $recipientEmail = $sender->gmail_provider_email ?: $sender->email;
        $htmlBody = $request->input('body');
        $inlineEmbedUrls = [];

        // Extract QR URL for inline attachment if present
        if (preg_match('/<img[^>]*src=["\'](https:\/\/api\.qrserver\.com[^"\']+)["\'][^>]*>/i', $htmlBody, $matches)) {
            $qrUrl = html_entity_decode($matches[1]);
            $htmlBody = preg_replace('/(<img[^>]*src=["\'])https:\/\/api\.qrserver\.com[^"\']+["\']([^>]*>)/i', '${1}cid:ticket-qr.png"${2}', $htmlBody);
            $inlineEmbedUrls['ticket-qr.png'] = $qrUrl;
        }

        SendBulkDistributionEmailJob::dispatch(
            sender: $sender,
            recipientEmail: $recipientEmail,
            subject: '[SAMPLE] '.$request->input('subject'),
            htmlBody: $htmlBody,
            eventId: $request->input('event_id'),
            inlineEmbedUrls: $inlineEmbedUrls
        )->onQueue('distributions');

        return back()->with('success', "Sample email queued for {$recipientEmail}.");
    }

    /**
     * Get spreadsheet headers for a given event.
     */
    public function getHeaders(Event $event): JsonResponse
    {
        if (! $event->google_spreadsheet_id) {
            return response()->json(['headers' => []]);
        }

        /** @var User $user */
        $user = Auth::user();

        try {
            $adapter = new GoogleSheetsAdapter($user);
            $headers = $adapter->getHeaders($event->google_spreadsheet_id, $event->google_sheet_name);

            return response()->json(['headers' => $headers]);
        } catch (\Exception $e) {
            return response()->json(['headers' => [], 'error' => $e->getMessage()], 400);
        }
    }

    /**
     * Get sample rows from the spreadsheet for previewing.
     */
    public function getRows(Event $event): JsonResponse
    {
        if (! $event->google_spreadsheet_id) {
            return response()->json(['rows' => []]);
        }

        /** @var User $user */
        $user = Auth::user();

        try {
            $adapter = new GoogleSheetsAdapter($user);
            $rows = $adapter->getRows($event->google_spreadsheet_id, $event->google_sheet_name, 25);

            return response()->json(['rows' => $rows]);
        } catch (\Exception $e) {
            return response()->json(['rows' => [], 'error' => $e->getMessage()], 400);
        }
    }
}
