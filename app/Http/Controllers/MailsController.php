<?php

namespace App\Http\Controllers;

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

        $query = Mail::with(['user', 'event'])->orderBy('created_at', 'desc');

        if ($request->filled('event_id')) {
            $query->where('event_id', $request->event_id);
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->end_date);
        }

        $mails = $query->paginate(30)->withQueryString();

        return Inertia::render('mails', [
            'mails' => $mails,
            'events' => Event::orderBy('name')->get(['id', 'name']),
            'senders' => User::whereIn('id', Mail::select('user_id')->distinct())->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'email']),
            'filters' => $request->only(['event_id', 'user_id', 'start_date', 'end_date']),
        ]);
    }

    public function getTicketForMail(Mail $mail)
    {
        $ticketId = $mail->metadata['__ticket_id'] ?? null;

        if (!$ticketId) {
            return response()->json(['message' => 'No ticket associated with this mail.'], 404);
        }

        $ticket = Ticket::find($ticketId);

        if (!$ticket) {
            return response()->json(['message' => 'Ticket not found.'], 404);
        }

        return response()->json($ticket);
    }
}