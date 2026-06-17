<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use Carbon\Carbon;
use Illuminate\Http\Request;

class SalesController extends Controller
{
    /**
     * Return aggregated sales data for the last N days (default 30) or from a specific date.
     * Supports hourly granularity for 24-hour periods.
     */
    public function summary(Request $request)
    {
        $hourly = $request->query('hourly') === 'true';
        $end = Carbon::now();

        // Check if 'from' parameter is provided (for lastShift)
        $fromParam = $request->query('from');
        if ($fromParam) {
            try {
                $start = Carbon::parse($fromParam);
                $end = Carbon::now();

                // Auto-enable hourly for lastShift if duration is less than 48 hours
                $hoursDiff = $start->diffInHours($end);
                if ($hoursDiff <= 48) {
                    $hourly = true;
                }
            } catch (\Exception $e) {
                // Fallback to default if parsing fails
                $days = (int) $request->query('days', 30);
                $start = (clone $end)->subDays($days - 1)->startOfDay();
                $end = Carbon::now()->endOfDay();
            }
        } else {
            $days = (int) $request->query('days', 30);
            // For hourly view, show last 24 hours
            if ($hourly) {
                $start = Carbon::now()->subHours(24);
                $end = Carbon::now();
            } elseif ($days === 1) {
                // For daily view with 1 day, use hourly for better granularity
                $hourly = true;
                $start = Carbon::now()->subHours(24);
                $end = Carbon::now();
            } else {
                $start = (clone $end)->subDays($days - 1)->startOfDay();
                $end = Carbon::now()->endOfDay();
            }
        }

        if ($hourly) {
            $cacheKey = 'sales_summary_hourly_'.md5(json_encode([$start->toString(), $end->toString()]));

            $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 30, function () use ($start, $end) {
                // Prepare hour buckets
                $hours = [];
                $cursor = (clone $start)->startOfHour();
                $endCursor = (clone $end)->startOfHour()->addHours(2); // Include current hour + 1 future hour

                while ($cursor->lt($endCursor)) {
                    $hours[$cursor->format('Y-m-d H:00:00')] = [
                        'date' => $cursor->format('Y-m-d H:00:00'),
                        'office_total' => 0.0,
                        'online_total' => 0.0,
                    ];
                    $cursor->addHour();
                }

                // Office sales - hourly
                $office = OfficeShiftSale::query()
                    ->whereBetween('sold_at', [$start, $end])
                    ->selectRaw('DATE_FORMAT(sold_at, "%Y-%m-%d %H:00:00") as hour, SUM(amount) as total')
                    ->groupBy('hour')
                    ->get();

                foreach ($office as $row) {
                    $h = $row->hour;
                    if (isset($hours[$h])) {
                        $hours[$h]['office_total'] = (float) $row->total;
                    }
                }

                // Online sales - hourly
                $online = OnlineSale::query()
                    ->whereHas('transaction', fn ($q) => $q->where('payment_status', 'completed'))
                    ->whereBetween('sold_at', [$start, $end])
                    ->selectRaw('DATE_FORMAT(sold_at, "%Y-%m-%d %H:00:00") as hour, SUM(amount) as total')
                    ->groupBy('hour')
                    ->get();

                foreach ($online as $row) {
                    $h = $row->hour;
                    if (isset($hours[$h])) {
                        $hours[$h]['online_total'] = (float) $row->total;
                    }
                }

                return array_values($hours);
            });

            return response()->json([
                'data' => $data,
            ]);
        } else {
            $cacheKey = 'sales_summary_'.md5(json_encode([$start->toString(), $end->toString()]));

            $data = \Illuminate\Support\Facades\Cache::remember($cacheKey, 30, function () use ($start, $end) {
                // Prepare empty date map - only for the actual date range
                $dates = [];
                $cursor = (clone $start)->startOfDay();
                $endCursor = (clone $end)->endOfDay();

                while ($cursor->lte($endCursor)) {
                    $dates[$cursor->format('Y-m-d')] = [
                        'date' => $cursor->format('Y-m-d'),
                        'office_total' => 0.0,
                        'online_total' => 0.0,
                    ];
                    $cursor->addDay();
                }

                // Office sales - daily
                $office = OfficeShiftSale::query()
                    ->whereBetween('sold_at', [$start, $end])
                    ->selectRaw('DATE(sold_at) as day, SUM(amount) as total')
                    ->groupBy('day')
                    ->get();

                foreach ($office as $row) {
                    $d = $row->day;
                    if (isset($dates[$d])) {
                        $dates[$d]['office_total'] = (float) $row->total;
                    }
                }

                // Online sales - daily
                $online = OnlineSale::query()
                    ->whereHas('transaction', fn ($q) => $q->where('payment_status', 'completed'))
                    ->whereBetween('sold_at', [$start, $end])
                    ->selectRaw('DATE(sold_at) as day, SUM(amount) as total')
                    ->groupBy('day')
                    ->get();

                foreach ($online as $row) {
                    $d = $row->day;
                    if (isset($dates[$d])) {
                        $dates[$d]['online_total'] = (float) $row->total;
                    }
                }

                return array_values($dates);
            });

            return response()->json([
                'data' => $data,
            ]);
        }
    }
}
