<?php

namespace App\Http\Controllers;

use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OnlineSalesController extends Controller
{
    public function __construct(protected SaleService $saleService) {}

    /**
     * Record a new online sale.
     *
     * @todo Implement when online sales are introduced.
     *       Validate the incoming webhook/request payload, call
     *       $this->saleService->createOnlineSale($data), and dispatch
     *       a SellableUpdated / StoreUpdated broadcast event.
     */
    public function store(Request $request): JsonResponse
    {
        abort(501, 'Online sales are not yet implemented.');
    }
}
