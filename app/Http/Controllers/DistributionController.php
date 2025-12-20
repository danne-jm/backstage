<?php

namespace App\Http\Controllers;

use App\Jobs\SendDistributionEmail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class DistributionController extends Controller
{
    /**
     * Distribute emails to provided recipients.
     * Accepts JSON body with `recipients` array where each entry contains at least `email`, `subject`, `body`.
     * Uses PHPMailer if available, otherwise falls back to PHP mail().
     */
    public function distribute(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recipients' => ['required', 'array'],
            'recipients.*.email' => ['required', 'string', 'email'],
            'recipients.*.subject' => ['nullable', 'string'],
            'recipients.*.body' => ['nullable', 'string'],
        ]);

        $recipients = $data['recipients'];

        // Log incoming payload for debugging when queued_count is unexpectedly 0
        try {
            Log::info('DistributionController::distribute received', ['count' => is_array($recipients) ? count($recipients) : 0]);
            if (is_array($recipients) && count($recipients) > 0) {
                Log::info('DistributionController::distribute sample recipient', ['sample' => array_slice($recipients, 0, 3)]);
            }
        } catch (\Throwable $e) {
            Log::warning('DistributionController::distribute logging failed', ['error' => $e->getMessage()]);
        }

        // Dispatch a queued job for each recipient. The jobs will use the configured mail driver.
        $queued = 0;
        $dispatchErrors = [];
        if (is_array($recipients)) {
            $sender = Auth::user();
            foreach ($recipients as $r) {
                try {
                    // Attach sender context so jobs can decide whether to use Gmail API for this user
                    $payload = array_merge($r, [
                        'sender_id' => $sender?->id,
                        'sender_email' => $sender?->email,
                    ]);

                    SendDistributionEmail::dispatch($payload)->onQueue('distributions');
                    $queued++;
                } catch (\Throwable $e) {
                    Log::error('DistributionController::distribute dispatch error', ['recipient' => $r, 'error' => $e->getMessage()]);
                    $dispatchErrors[] = ['recipient' => $r, 'error' => $e->getMessage()];
                }
            }
        }

        return response()->json([
            'queued_count' => $queued,
            'queued' => $queued > 0,
            'received_count' => is_array($recipients) ? count($recipients) : 0,
            'dispatch_errors' => $dispatchErrors,
        ]);
    }
}
