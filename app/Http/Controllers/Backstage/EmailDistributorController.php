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

        // Dispatch one queued job per recipient
        foreach ($emails as $emailData) {
            SendBulkDistributionEmailJob::dispatch(
                sender: $sender,
                recipientEmail: $emailData['email'],
                subject: $subject,
                htmlBody: $emailData['body'],
            )->onQueue('distributions');
        }

        return back()->with('success', "Queued {$emails->count()} email(s) for distribution.");
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
