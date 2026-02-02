<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Mail;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MailsController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'event_id' => 'nullable|integer|exists:events,id',
            'user_id' => 'nullable|integer|exists:users,id',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $mails = \Spatie\QueryBuilder\QueryBuilder::for(Mail::class)
            ->with(['user', 'event'])
            ->allowedFilters([
                'event_id',
                'user_id',
                \Spatie\QueryBuilder\AllowedFilter::callback('start_date', fn ($query, $value) => $query->where('created_at', '>=', $value)),
                \Spatie\QueryBuilder\AllowedFilter::callback('end_date', fn ($query, $value) => $query->where('created_at', '<=', $value)),
            ])
            ->defaultSort('-created_at')
            ->allowedSorts(['created_at', 'subject'])
            ->paginate(110)
            ->withQueryString();

        return Inertia::render('Backstage/mails', [
            'mails' => $mails,
            'events' => Event::orderBy('name')->get(['id', 'name']),
            'senders' => User::whereIn('id', Mail::select('user_id')->distinct())->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email']),
            'filters' => $request->only(['event_id', 'user_id', 'start_date', 'end_date']),
        ]);
    }

    public function getTicketForMail(Mail $mail)
    {
        $ticketId = $mail->metadata['__ticket_id'] ?? null;

        if (! $ticketId) {
            return response()->json(['message' => 'No ticket associated with this mail.'], 404);
        }

        $ticket = Ticket::find($ticketId);

        if (! $ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        return response()->json($ticket);
    }
}
