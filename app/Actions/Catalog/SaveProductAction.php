<?php

namespace App\Actions\Catalog;

use App\DTOs\Catalog\ProductPayload;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class SaveProductAction
{
    public function handle(ProductPayload $payload, ?Product $product = null): Product
    {
        return DB::transaction(function () use ($payload, $product) {
            $product = $product ?? new Product();

            $product->fill([
                'name' => $payload->name,
                'description' => $payload->description,
                'start_sell_date' => $payload->startSellDate,
                'end_sell_date' => $payload->endSellDate,
                'is_online_sellable' => $payload->isOnlineSellable,
                'hide_until_sale' => $payload->hideUntilSale,
                
                'price' => $payload->price,
                'price_without_membership' => $payload->priceWithoutMembership,
                'price_with_membership' => $payload->priceWithMembership,
                'variable_amount' => $payload->variableAmount,

                'unlimited_quantity' => $payload->unlimitedQuantity,
                'quantity' => $payload->quantity,
                'unlimited_quantity_with_membership' => $payload->unlimitedQuantityWithMembership,
                'quantity_with_membership' => $payload->quantityWithMembership,
                'unlimited_quantity_without_membership' => $payload->unlimitedQuantityWithoutMembership,
                'quantity_without_membership' => $payload->quantityWithoutMembership,

                'is_variant_based' => $payload->isVariantBased,
                'variants_config' => $payload->variantsConfig,
                
                'responsible_user_ids' => $payload->responsibleUserIds,
            ]);

            $product->save();
            
            return $product;
        });
    }
}
