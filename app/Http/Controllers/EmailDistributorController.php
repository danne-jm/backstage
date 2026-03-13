<?php

namespace App\Http\Controllers;

use App\Models\Sellable;
use App\Models\sellables\Event;
use App\Services\EmailDistributionService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller for Email Distributor page
 * Handles fetching events and attendees for email distribution
 */
class EmailDistributorController extends Controller
{
    public function __construct(
        private readonly EmailDistributionService $distributionService
    ) {
    }

    /**
     * Display the email distributor page
     */
    public function index(): Response
    {
        // Get upcoming events within the next 14 days
        $events = $this->distributionService->getUpcomingEvents(14);
        
        // Get email templates if they exist
        $templates = $this->distributionService->getEmailTemplates();

        return Inertia::render('email-distributor', [
            'events' => $events,
            'templates' => $templates,
        ]);
    }

    /**
     * Fetch attendees for a specific event from Google Sheets
     */
    public function getAttendees(Request $request, string $event)
    {
        $validated = $request->validate([
            'refresh' => 'sometimes|boolean',
        ]);

        $useCache = !($validated['refresh'] ?? false);

        // Find the event by ID - use the concrete Event model
        $eventModel = Event::find($event);
        if (!$eventModel) {
            return response()->json([
                'success' => false,
                'error' => 'Event not found'
            ], 404);
        }

        try {
            $attendees = $this->distributionService->getEventAttendees(
                $eventModel,
                $useCache
            );

            return response()->json([
                'success' => true,
                'rows' => $attendees,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'rows' => [],
            ], 500);
        }
    }
}
