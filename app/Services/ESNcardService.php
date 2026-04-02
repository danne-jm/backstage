<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ESNcardService
{
    private const API_URL = 'https://esncard.org/services/1.0/card.json';

    private const CACHE_TTL = 300; // Cache valid results for 5 minutes

    /**
     * Validate an ESNcard code against the official API.
     * Returns true if the card exists and has status "available".
     */
    public function validate(string $code): bool
    {
        $code = trim($code);

        if (empty($code)) {
            return false;
        }

        $cacheKey = 'esncard_valid_'.md5($code);
        $cached = Cache::get($cacheKey);

        if ($cached !== null) {
            return $cached;
        }

        try {
            $response = Http::timeout(5)
                ->get(self::API_URL, ['code' => $code]);

            if (! $response->successful()) {
                Log::warning('ESNcard API returned non-success status', [
                    'code' => $code,
                    'status' => $response->status(),
                ]);

                return false;
            }

            $data = $response->json();

            if (is_array($data) && count($data) > 0) {
                $card = $data[0];
                $isValid = isset($card['status']) && $card['status'] === 'available';

                Cache::put($cacheKey, $isValid, $isValid ? self::CACHE_TTL : 60);

                return $isValid;
            }

            Cache::put($cacheKey, false, 60);

            return false;

        } catch (\Exception $e) {
            Log::error('ESNcard API error', [
                'code' => $code,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Get full card details from the API.
     */
    public function getCardDetails(string $code): ?array
    {
        $code = trim($code);

        if (empty($code)) {
            return null;
        }

        try {
            $response = Http::timeout(5)
                ->get(self::API_URL, ['code' => $code]);

            if ($response->successful()) {
                $data = $response->json();
                if (is_array($data) && count($data) > 0) {
                    return $data[0];
                }
            }
        } catch (\Exception $e) {
            Log::error('ESNcard API error getting details', [
                'code' => $code,
                'error' => $e->getMessage(),
            ]);
        }

        return null;
    }
}
