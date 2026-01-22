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
     * Return aggregated daily sales for the last N days (default 30).
     */
    public function summary(Request $request)
    {
        $days = (int) $request->query('days', 30);
        $end = Carbon::now()->endOfDay();
        $start = (clone $end)->subDays($days - 1)->startOfDay();

        // Prepare empty date map
        $dates = [];
        $cursor = (clone $start);
        while ($cursor->lte($end)) {
            $dates[$cursor->format('Y-m-d')] = [
                'date' => $cursor->format('Y-m-d'),
                'office_total' => 0.0,
                'online_total' => 0.0,
            ];
            $cursor->addDay();
        }

        // Office sales
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

        // Online sales
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

        return response()->json([
            'data' => array_values($dates),
        ]);
    }
}
