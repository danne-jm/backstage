<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backstage\SendDistributionRequest;
use App\Jobs\SendBulkDistributionEmailJob;
use App\Models\Event;
use App\Models\MailLog;
use App\Models\Ticket;
use App\Models\User;
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
        return Inertia::render('backstage/email-distributor/index', [
            'events' => Event::orderByDesc('event_date')
                ->get(['id', 'name', 'event_date']),
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
        $htmlBody = $request->string('body')->toString();
        $eventId = $request->input('event_id');

        // Resolve recipient list
        $recipients = collect();

        if ($eventId) {
            // Target all ticket holders of the given event
            $recipients = Ticket::where('event_id', $eventId)
                ->whereNotNull('email')
                ->pluck('email')
                ->unique();
        } elseif ($request->filled('recipient_emails')) {
            $recipients = collect(
                array_filter(array_map('trim', explode(',', $request->input('recipient_emails'))))
            )->unique();
        }

        if ($recipients->isEmpty()) {
            return back()->withErrors(['recipients' => 'No valid recipients found.']);
        }

        // Dispatch one queued job per recipient
        foreach ($recipients as $email) {
            SendBulkDistributionEmailJob::dispatch(
                sender: $sender,
                recipientEmail: $email,
                subject: $subject,
                htmlBody: $htmlBody,
            )->onQueue('distributions');
        }

        return back()->with('success', "Queued {$recipients->count()} email(s) for distribution.");
    }
}
