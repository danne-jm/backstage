<?php

namespace App\Services\Integrations;

use Illuminate\Http\Client\Pool;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ESNcardService
{
    private const API_URL = 'https://esncard.org/services/1.0/card.json';

    private const CACHE_TTL_VALID = 300; // 5 minutes

    private const CACHE_TTL_INVALID = 60; // 1 minute

    /**
     * Validate an ESNcard code against the official API.
     * Uses Cache::remember to cleanly manage the TTL logic based on validity.
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

        $isValid = $this->fetchValidityFromApi($code);

        Cache::put($cacheKey, $isValid, $isValid ? self::CACHE_TTL_VALID : self::CACHE_TTL_INVALID);

        return $isValid;
    }

    /**
     * Fetch from API, isolated so it can be used cleanly.
     */
    private function fetchValidityFromApi(string $code): bool
    {
        try {
            $response = Http::timeout(5)->get(self::API_URL, ['code' => $code]);

            if ($response->successful() && $data = $response->json()) {
                return isset($data[0]['status']) && $data[0]['status'] === 'available';
            }

            Log::warning('ESNcard API returned non-success or empty data', [
                'code' => $code,
                'status' => $response->status(),
            ]);
        } catch (Throwable $e) {
            Log::error('ESNcard API error', [
                'code' => $code,
                'error' => $e->getMessage(),
            ]);
        }

        return false;
    }

    /**
     * Validate multiple ESNcard codes concurrently.
     * Returns an associative array of [code => bool].
     */
    public function validateMany(array $codes): array
    {
        $codes = array_values(array_unique(array_filter(array_map('trim', $codes))));

        if (empty($codes)) {
            return [];
        }

        $results = [];
        $uncached = [];

        // 1. Resolve cached codes instantly
        foreach ($codes as $code) {
            $cached = Cache::get('esncard_valid_'.md5($code));
            if ($cached !== null) {
                $results[$code] = $cached;
            } else {
                $uncached[] = $code;
            }
        }

        // 2. Fetch uncached concurrently
        if (! empty($uncached)) {
            $responses = Http::pool(fn (Pool $pool) => array_map(
                fn (string $code) => $pool->as($code)->timeout(5)->get(self::API_URL, ['code' => $code]),
                $uncached
            ));

            foreach ($uncached as $code) {
                $response = $responses[$code];
                $isValid = false;

                if (! ($response instanceof Throwable) && $response->successful() && $data = $response->json()) {
                    $isValid = isset($data[0]['status']) && $data[0]['status'] === 'available';
                } else {
                    $status = $response instanceof Throwable ? 'exception' : $response->status();
                    $error = $response instanceof Throwable ? $response->getMessage() : 'bad response';
                    Log::warning('ESNcard parallel validation failed', [
                        'code' => $code,
                        'status' => $status,
                        'error' => $error,
                    ]);
                }

                Cache::put('esncard_valid_'.md5($code), $isValid, $isValid ? self::CACHE_TTL_VALID : self::CACHE_TTL_INVALID);
                $results[$code] = $isValid;
            }
        }

        return $results;
    }
}
