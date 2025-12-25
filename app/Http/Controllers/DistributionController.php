<?php

namespace App\Http\Controllers;

use App\Jobs\SendDistributionEmail;
use App\Models\Event;
use App\Models\Mail;
use App\Models\Ticket;
use BaconQrCode\Renderer\Image\ImagickImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DistributionController extends Controller
{
    protected \App\Services\DistributionService $distributionService;

    public function __construct(\App\Services\DistributionService $distributionService)
    {
        $this->distributionService = $distributionService;
    }

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
            'recipients.*.unique_trait' => ['nullable', 'string'],
            'recipients.*.scan_count' => ['nullable', 'integer'],
            'recipients.*.scan_details' => ['nullable'],
        ]);

        $recipients = $data['recipients'];
        $sender = Auth::user();

        $result = $this->distributionService->processDistribution($recipients, $sender);

        return response()->json([
            'queued_count' => $result['queued'],
            'tickets_created' => $result['tickets_created'],
            'sent_count' => $result['queued'], // backward-compatible alias
            'queued' => $result['queued'] > 0,
            'received_count' => count($recipients),
            'dispatch_errors' => $result['dispatch_errors'],
        ]);
    }
}
