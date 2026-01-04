<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\MailTemplate;
use Inertia\Inertia;
use Inertia\Response;

class TicketingController extends Controller
{
    /**
     * Display the ticketing page.
     */
    public function index(): Response
    {
        $events = [];
        try {
            $events = Event::query()->orderBy('start_sell_date')->get();
        } catch (\Throwable $e) {
            // If the Event model/table isn't available yet (during some dev workflows),
            // fall back to an empty array to keep the page rendering.
            $events = [];
        }

        return Inertia::render('ticketing', [
            'events' => $events,
            'templates' => MailTemplate::all(),
        ]);
    }
}
