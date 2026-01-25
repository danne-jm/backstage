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
                $start = Carbon::now()->subHours(24)->startOfHour();
                $end = Carbon::now()->startOfHour();
            } elseif ($days === 1) {
                // For daily view with 1 day, include yesterday and today to capture full 24 hours
                $start = Carbon::now()->subHours(24)->startOfDay();
                $end = Carbon::now()->endOfDay();
            } else {
                $start = (clone $end)->subDays($days - 1)->startOfDay();
                $end = Carbon::now()->endOfDay();
            }
        }

        if ($hourly) {
            // Prepare empty hour map (24 hours)
            $hours = [];
            $cursor = clone $start;
            while ($cursor->lt($end)) {
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

            return response()->json([
                'data' => array_values($hours),
            ]);
        } else {
            // Prepare empty date map - only for the actual date range
            $dates = [];

            // For lastShift (when from param exists), use hourly grouping to avoid empty days
            if ($fromParam) {
                $cursor = (clone $start)->startOfHour();
                $endCursor = (clone $end);

                while ($cursor->lt($endCursor)) {
                    $dateKey = $cursor->format('Y-m-d H:00:00');
                    $dates[$dateKey] = [
                        'date' => $dateKey,
                        'office_total' => 0.0,
                        'online_total' => 0.0,
                    ];
                    $cursor->addHour();
                }

                // Office sales - hourly for lastShift
                $office = OfficeShiftSale::query()
                    ->whereBetween('sold_at', [$start, $end])
                    ->selectRaw('DATE_FORMAT(sold_at, "%Y-%m-%d %H:00:00") as hour, SUM(amount) as total')
                    ->groupBy('hour')
                    ->get();

                foreach ($office as $row) {
                    $h = $row->hour;
                    if (isset($dates[$h])) {
                        $dates[$h]['office_total'] = (float) $row->total;
                    }
                }

                // Online sales - hourly for lastShift
                $online = OnlineSale::query()
                    ->whereBetween('sold_at', [$start, $end])
                    ->selectRaw('DATE_FORMAT(sold_at, "%Y-%m-%d %H:00:00") as hour, SUM(amount) as total')
                    ->groupBy('hour')
                    ->get();

                foreach ($online as $row) {
                    $h = $row->hour;
                    if (isset($dates[$h])) {
                        $dates[$h]['online_total'] = (float) $row->total;
                    }
                }
            } else {
                // Daily aggregation for multi-day periods
                $cursor = (clone $start);
                while ($cursor->lte($end)) {
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
            }

            return response()->json([
                'data' => array_values($dates),
            ]);
        }
    }
}
