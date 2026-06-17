<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use Illuminate\Http\Request;

class TicketApiController extends Controller
{
    public function tickets(Request $request)
    {
        $eventId = $request->query('event_id');
        $query = Ticket::query();
        if ($eventId) {
            $query->where('event_id', $eventId);
        }
        $tickets = $query->orderBy('created_at', 'desc')->limit(200)->get();

        return response()->json(['tickets' => $tickets]);
    }
}
