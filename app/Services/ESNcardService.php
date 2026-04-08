<?php

namespace App\Services;

use Illuminate\Http\Client\Pool;
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
     * Validate multiple ESNcard codes in parallel.
     * Returns an associative array of code => bool.
     * Codes already in cache are resolved immediately; uncached codes are fetched concurrently.
     *
     * @param  string[]  $codes
     * @return array<string, bool>
     */
    public function validateMany(array $codes): array
    {
        $codes = array_values(array_unique(array_filter(array_map('trim', $codes))));

        if (empty($codes)) {
            return [];
        }

        $results = [];
        $uncached = [];

        foreach ($codes as $code) {
            $cacheKey = 'esncard_valid_' . md5($code);
            $cached = Cache::get($cacheKey);
            if ($cached !== null) {
                $results[$code] = $cached;
            } else {
                $uncached[] = $code;
            }
        }

        if (!empty($uncached)) {
            $responses = Http::pool(function (Pool $pool) use ($uncached): array {
                return array_map(
                    fn(string $code) => $pool->as($code)->timeout(5)->get(self::API_URL, ['code' => $code]),
                    $uncached
                );
            });

            foreach ($uncached as $code) {
                try {
                    $response = $responses[$code];
                    if ($response instanceof \Throwable) {
                        throw $response;
                    }

                    if ($response->successful()) {
                        $data = $response->json();
                        if (is_array($data) && count($data) > 0) {
                            $card = $data[0];
                            $isValid = isset($card['status']) && $card['status'] === 'available';
                            Cache::put('esncard_valid_' . md5($code), $isValid, $isValid ? self::CACHE_TTL : 60);
                            $results[$code] = $isValid;
                            continue;
                        }
                    }

                    Log::warning('ESNcard API returned non-success or empty response', [
                        'code' => $code,
                        'status' => $response->status(),
                    ]);
                    Cache::put('esncard_valid_' . md5($code), false, 60);
                    $results[$code] = false;
                } catch (\Throwable $e) {
                    Log::error('ESNcard API error', ['code' => $code, 'error' => $e->getMessage()]);
                    $results[$code] = false;
                }
            }
        }

        return $results;
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
