<?php

namespace App\Http\Controllers\Backstage;
use App\Http\Controllers\Controller;

use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class SalesController extends Controller
{
    /**
     * Return aggregated sales data for the given period.
     * Supports hourly granularity for 24-hour periods.
     */
    public function summary(Request $request): JsonResponse
    {
        $hourly = $request->query('hourly') === 'true';
        $end = Carbon::now();

        $fromParam = $request->query('from');

        if ($fromParam) {
            try {
                $start = Carbon::parse($fromParam);
                $hoursDiff = $start->diffInHours($end);
                if ($hoursDiff <= 48) {
                    $hourly = true;
                }
            } catch (\Exception) {
                $days  = (int) $request->query('days', 30);
                $start = (clone $end)->subDays($days - 1)->startOfDay();
                $end   = Carbon::now()->endOfDay();
            }
        } else {
            $days = (int) $request->query('days', 30);

            if ($hourly || $days === 1) {
                $hourly = true;
                $start  = Carbon::now()->subHours(24);
                $end    = Carbon::now();
            } else {
                $start = (clone $end)->subDays($days - 1)->startOfDay();
                $end   = Carbon::now()->endOfDay();
            }
        }

        if ($hourly) {
            $cacheKey = 'sales_summary_hourly_' . md5(json_encode([$start->toString(), $end->toString()]));

            $data = Cache::remember($cacheKey, 30, function () use ($start, $end) {
                $hourBucketExpression = $this->hourBucketExpression('sold_at');

                $hours = [];
                $cursor    = (clone $start)->startOfHour();
                $endCursor = (clone $end)->startOfHour()->addHours(2);

                while ($cursor->lt($endCursor)) {
                    $hours[$cursor->format('Y-m-d H:00:00')] = [
                        'date'         => $cursor->format('Y-m-d H:00:00'),
                        'office_total' => 0.0,
                        'online_total' => 0.0,
                    ];
                    $cursor->addHour();
                }

                $office = OfficeShiftSale::query()
                    ->whereBetween('sold_at', [$start, $end])
                    ->selectRaw("{$hourBucketExpression} as hour, SUM(amount) as total")
                    ->groupBy('hour')
                    ->get();

                foreach ($office as $row) {
                    if (isset($hours[$row->hour])) {
                        $hours[$row->hour]['office_total'] = (float) $row->total;
                    }
                }

                $online = OnlineSale::query()
                    ->whereBetween('sold_at', [$start, $end])
                    ->selectRaw("{$hourBucketExpression} as hour, SUM(amount) as total")
                    ->groupBy('hour')
                    ->get();

                foreach ($online as $row) {
                    if (isset($hours[$row->hour])) {
                        $hours[$row->hour]['online_total'] = (float) $row->total;
                    }
                }

                return array_values($hours);
            });

            return response()->json(['data' => $data]);
        }

        $cacheKey = 'sales_summary_' . md5(json_encode([$start->toString(), $end->toString()]));

        $data = Cache::remember($cacheKey, 30, function () use ($start, $end) {
            $dates  = [];
            $cursor    = (clone $start)->startOfDay();
            $endCursor = (clone $end)->endOfDay();

            while ($cursor->lte($endCursor)) {
                $dates[$cursor->format('Y-m-d')] = [
                    'date'         => $cursor->format('Y-m-d'),
                    'office_total' => 0.0,
                    'online_total' => 0.0,
                ];
                $cursor->addDay();
            }

            $office = OfficeShiftSale::query()
                ->whereBetween('sold_at', [$start, $end])
                ->selectRaw('DATE(sold_at) as day, SUM(amount) as total')
                ->groupBy('day')
                ->get();

            foreach ($office as $row) {
                if (isset($dates[$row->day])) {
                    $dates[$row->day]['office_total'] = (float) $row->total;
                }
            }

            $online = OnlineSale::query()
                ->whereBetween('sold_at', [$start, $end])
                ->selectRaw('DATE(sold_at) as day, SUM(amount) as total')
                ->groupBy('day')
                ->get();

            foreach ($online as $row) {
                if (isset($dates[$row->day])) {
                    $dates[$row->day]['online_total'] = (float) $row->total;
                }
            }

            return array_values($dates);
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Build a SQL expression that buckets timestamps by hour for the current DB driver.
     */
    protected function hourBucketExpression(string $column): string
    {
        return match (DB::connection()->getDriverName()) {
            'mysql', 'mariadb' => "DATE_FORMAT({$column}, '%Y-%m-%d %H:00:00')",
            'pgsql' => "TO_CHAR(DATE_TRUNC('hour', {$column}), 'YYYY-MM-DD HH24:00:00')",
            default => "strftime('%Y-%m-%d %H:00:00', {$column})",
        };
    }
}
