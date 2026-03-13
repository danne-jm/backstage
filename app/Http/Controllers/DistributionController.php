<?php

namespace App\Http\Controllers;

use App\Http\Requests\DistributeEmailsRequest;
use App\Services\EmailDistributionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Controller for handling email distribution operations
 * Separated from EmailDistributorController for single responsibility
 */
class DistributionController extends Controller
{
    public function __construct(
        private readonly EmailDistributionService $distributionService
    ) {
    }

    /**
     * Distribute emails to provided recipients
     */
    public function distribute(DistributeEmailsRequest $request): JsonResponse
    {
        $recipients = $request->validated('recipients');
        $sender = Auth::user();

        $result = $this->distributionService->processDistribution(
            $recipients,
            $sender
        );

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
