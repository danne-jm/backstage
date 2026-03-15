<?php

namespace App\Http\Controllers;

use App\Models\sellables\Event;
use App\Services\EmailDistributionService;
use App\Services\AttendeeService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Controller for Email Distributor page
 * Handles fetching events and rendering the email distribution UI
 * 
 * Delegates attendee fetching and filtering to AttendeeService
 * Delegates email distribution logic to EmailDistributionService
 */
class EmailDistributorController extends Controller
{
    public function __construct(
        private readonly EmailDistributionService $distributionService,
        private readonly AttendeeService $attendeeService
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
     * Fetch filtered attendees for a specific event from Google Sheets
     * Returns data that passes the attendee filters configured in the attendee management page
     * 
     * Delegates to AttendeeService::getAttendeeData which handles all filtering logic
     */
    public function getAttendees(Request $request, string $event)
    {
        $eventModel = Event::find($event);
        if (!$eventModel) {
            return response()->json([
                'success' => false,
                'error' => 'Event not found'
            ], 404);
        }

        try {
            $sheetName = $eventModel->google_sheet_name;
            $data = $this->attendeeService->getAttendeeData($eventModel, $sheetName, false);

            return response()->json([
                'success' => true,
                'rows' => $data,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'rows' => [],
            ], 500);
        }
    }

    /**
     * Fetch all unfiltered attendees for a specific event from Google Sheets
     * Used by frontend to detect if filtering is active
     * 
     * Delegates to AttendeeService::getAttendeeData with unfiltered=true
     */
    public function getAllAttendees(Request $request, string $event)
    {
        $eventModel = Event::find($event);
        if (!$eventModel) {
            return response()->json([
                'success' => false,
                'error' => 'Event not found'
            ], 404);
        }

        try {
            $sheetName = $eventModel->google_sheet_name;
            $data = $this->attendeeService->getAttendeeData($eventModel, $sheetName, true);

            return response()->json([
                'success' => true,
                'rows' => $data,
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
