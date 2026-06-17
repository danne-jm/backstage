<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalesController extends Controller
{
    /**
     * Returns hourly revenue bucket data for a chart.
     *
     * Supports ?channel=online|pos, ?date=YYYY-MM-DD
     */
    public function summary(Request $request): JsonResponse
    {
        $channel = $request->input('channel');
        $date = $request->input('date', now()->toDateString());

        $query = Transaction::query()
            ->where('status', 'completed')
            ->whereDate('completed_at', $date);

        if ($channel) {
            $query->where('channel', $channel);
        }

        // Build hour-bucket expression portably across SQLite and Postgres
        $hourBucket = $this->hourBucketExpression();

        $buckets = $query
            ->selectRaw("{$hourBucket} as hour, SUM(total_amount) as revenue, COUNT(*) as transaction_count")
            ->groupByRaw($hourBucket)
            ->orderByRaw($hourBucket)
            ->get();

        return response()->json([
            'date' => $date,
            'channel' => $channel ?? 'all',
            'buckets' => $buckets,
            'total_revenue' => $buckets->sum('revenue'),
            'total_transactions' => $buckets->sum('transaction_count'),
        ]);
    }

    /**
     * Returns the correct SQL hour-bucket expression for the active driver.
     */
    private function hourBucketExpression(): string
    {
        return match (config('database.default')) {
            'pgsql' => "TO_CHAR(DATE_TRUNC('hour', completed_at), 'HH24:00')",
            default => "strftime('%H:00', completed_at)",
        };
    }
}
