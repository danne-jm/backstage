<?php

namespace App\Http\Controllers;

use App\Http\Requests\DistributeEmailsRequest;
use App\Services\EmailDistributionService;
use App\Services\GmailSenderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Controller for handling email distribution operations
 * Separated from EmailDistributorController for single responsibility
 */
class DistributionController extends Controller
{
    public function __construct(
        private readonly EmailDistributionService $distributionService,
        private readonly GmailSenderService $gmailSender
    ) {
    }

    /**
     * Distribute emails to provided recipients
     */
    public function distribute(DistributeEmailsRequest $request): JsonResponse
    {
        $recipients = $request->validated('recipients');
        $sender = Auth::user();

        if (!$sender || !$sender->gmail_refresh_token) {
            return response()->json([
                'message' => 'Connect your Google account to send emails.',
                'dispatch_errors' => [['recipient' => 'all', 'error' => 'Google account not connected']],
            ], 422);
        }

        // Preflight: validate refresh token so we fail fast instead of queueing doomed jobs
        if (!$this->gmailSender->canSend($sender)) {
            $error = method_exists($this->gmailSender, 'getLastError') ? $this->gmailSender->getLastError() : null;
            return response()->json([
                'message' => $error ?? 'Google token invalid or expired. Please reconnect your Google account in Settings.',
                'dispatch_errors' => [['recipient' => 'all', 'error' => $error ?? 'Google token invalid or expired']],
            ], 422);
        }

        $qrLogo = $request->validated('qr_logo') ?? null;

        $result = $this->distributionService->processDistribution(
            $recipients,
            $sender,
            $qrLogo
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
