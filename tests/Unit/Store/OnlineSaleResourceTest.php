<?php

namespace Tests\Unit\Store;

use App\Http\Resources\OnlineSaleResource;
use App\Models\OnlineSale;
use App\Models\sellables\Product;
use Tests\TestCase;

class OnlineSaleResourceTest extends TestCase
{
    public function test_it_exposes_code_used_for_variant_online_sales_without_with_card_ticket_type(): void
    {
        $sale = new OnlineSale([
            'id' => 'sale-1',
            'product_id' => 'product-1',
            'event_id' => null,
            'amount' => 15.00,
            'ticket_type' => null,
            'reference_id' => 'REF-123',
            'sold_at' => now(),
            'details' => [
                'code_used' => 'ESN-ABC',
                'options' => [
                    'size' => 'L',
                    'color' => 'Black',
                ],
            ],
        ]);

        $sale->setRelation('product', new Product(['name' => 'Variant Hoodie']));

        $payload = (new OnlineSaleResource($sale))->toArray(request());

        $this->assertSame('ESN-ABC', $payload['code_used']);
        $this->assertTrue($payload['with_esncard']);
        $this->assertSame('ESNcard', $payload['ticket_type_label']);
    }
}
