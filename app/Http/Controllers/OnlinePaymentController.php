<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\OnlineSale;
use App\Models\OnlineTransaction;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class OnlinePaymentController extends Controller
{
    /**
     * Process cart checkout and create online transaction with sales.
     */
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer'],
            'items.*.type' => ['required', 'in:product,event'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.use_member_price' => ['nullable', 'boolean'],
            'discount_codes' => ['nullable', 'array'],
            'discount_codes.*' => ['string'],
        ]);

        $items = $validated['items'];
        $discountCodes = $validated['discount_codes'] ?? [];
        $hasDiscount = count($discountCodes) > 0;

        return DB::transaction(function () use ($items, $discountCodes, $hasDiscount) {
            $subtotal = 0;
            $salesToCreate = [];

            // First pass: validate all stock and build sales list
            foreach ($items as $item) {
                $id = $item['id'];
                $type = $item['type'];
                $quantity = $item['quantity'];
                $useMemberPrice = $item['use_member_price'] ?? false;

                if ($type === 'product') {
                    $product = Product::find($id);
                    if (!$product) {
                        throw ValidationException::withMessages(['items' => "Product with ID {$id} not found."]);
                    }

                    // Check stock using the remaining attribute (which counts sales)
                    $isUnlimited = $product->unlimited_quantity || $product->unlimited_quantity_with_card;
                    $remaining = $product->remaining ?? 0;

                    if (!$isUnlimited && $remaining < $quantity) {
                        throw ValidationException::withMessages(['stock' => "{$product->name} is sold out or insufficient stock."]);
                    }

                    $price = $product->price;

                    // Create sale entries for each unit
                    for ($i = 0; $i < $quantity; $i++) {
                        $subtotal += $price;
                        $salesToCreate[] = [
                            'product_id' => $id,
                            'event_id' => null,
                            'amount' => $price,
                            'ticket_type' => null,
                            'item_name' => $product->name,
                        ];
                    }
                } else {
                    $event = Event::find($id);
                    if (!$event) {
                        throw ValidationException::withMessages(['items' => "Event with ID {$id} not found."]);
                    }

                    // Determine ticket type based on discount
                    $ticketType = ($hasDiscount && $useMemberPrice) ? 'with_card' : 'without_card';

                    // Check stock for ticket type using remaining attributes
                    if ($event->variable_amount) {
                        if ($ticketType === 'with_card') {
                            $isUnlimited = $event->unlimited_quantity_with_card;
                            $remaining = $event->remaining_with_card ?? 0;
                        } else {
                            $isUnlimited = $event->unlimited_quantity_without_card;
                            $remaining = $event->remaining_without_card ?? 0;
                        }
                    } else {
                        $isUnlimited = $event->unlimited_quantity;
                        $remaining = $event->remaining ?? 0;
                    }

                    if (!$isUnlimited && $remaining < $quantity) {
                        throw ValidationException::withMessages(['stock' => "{$event->name} is sold out or insufficient stock."]);
                    }

                    // Get price
                    if ($ticketType === 'with_card') {
                        $price = $event->price_with_card ?? $event->price_without_card;
                    } else {
                        $price = $event->price_without_card ?? $event->price_with_card;
                    }

                    // Create sale entries for each unit
                    for ($i = 0; $i < $quantity; $i++) {
                        $subtotal += $price;
                        $salesToCreate[] = [
                            'product_id' => null,
                            'event_id' => $id,
                            'amount' => $price,
                            'ticket_type' => $ticketType,
                            'item_name' => $event->name,
                        ];
                    }
                }
            }

            // Calculate processing fee (2%)
            $processingFee = round($subtotal * 0.02, 2);
            $totalAmount = $subtotal + $processingFee;

            // Generate secure token
            $token = Str::random(64);

            // Create transaction with secure token
            $transaction = OnlineTransaction::create([
                'token' => $token,
                'total_amount' => $totalAmount,
                'processing_fee' => $processingFee,
                'discount_codes' => count($discountCodes) > 0 ? $discountCodes : null,
                'completed_at' => now(),
            ]);

            // Create sales - the OnlineSale records will be counted by the remaining attribute
            // so we don't need to manually decrement quantity
            foreach ($salesToCreate as $saleData) {
                OnlineSale::create([
                    'online_transaction_id' => $transaction->id,
                    'product_id' => $saleData['product_id'],
                    'event_id' => $saleData['event_id'],
                    'method' => 'card',
                    'amount' => $saleData['amount'],
                    'ticket_type' => $saleData['ticket_type'],
                    'sold_at' => now(),
                    'details' => [
                        'item_name' => $saleData['item_name'],
                        'ticket_type' => $saleData['ticket_type'],
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'redirect_url' => '/confirmation?token=' . $token,
            ]);
        });
    }

    /**
     * Display purchase confirmation page using secure token.
     */
    public function confirmation(Request $request)
    {
        $token = $request->query('token');

        if (!$token) {
            return redirect('/')->with('error', 'Invalid confirmation link.');
        }

        $transaction = OnlineTransaction::with(['sales.product', 'sales.event'])
            ->where('token', $token)
            ->first();

        if (!$transaction) {
            return redirect('/')->with('error', 'Transaction not found.');
        }

        $items = $transaction->sales->map(function ($sale) {
            $name = $sale->product?->name ?? $sale->event?->name ?? 'Unknown Item';
            $type = $sale->product_id ? 'product' : 'event';

            return [
                'id' => $sale->id,
                'reference_id' => $sale->reference_id,
                'name' => $name,
                'type' => $type,
                'amount' => $sale->amount,
                'ticket_type' => $sale->ticket_type,
            ];
        });

        return Inertia::render('shop/confirmation', [
            'transaction' => [
                'id' => $transaction->id,
                'total_amount' => $transaction->total_amount,
                'processing_fee' => $transaction->processing_fee,
                'discount_codes' => $transaction->discount_codes,
                'completed_at' => $transaction->completed_at?->toIso8601String(),
            ],
            'items' => $items,
        ]);
    }
}
