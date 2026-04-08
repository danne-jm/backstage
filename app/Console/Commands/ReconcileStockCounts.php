<?php

namespace App\Console\Commands;

use App\Models\OfficeShiftSale;
use App\Models\OnlineSale;
use App\Models\SellableVariant;
use App\Models\sellables\Event;
use App\Models\sellables\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReconcileStockCounts extends Command
{
    protected $signature = 'stock:reconcile
                            {--fix : Apply corrections to the database}
                            {--chunk=200 : How many records to process per batch}';

    protected $description = 'Compare cached sold_count columns against actual sale records and report (or fix) any drift.';

    public function handle(): int
    {
        $fix = $this->option('fix');
        $chunk = (int) $this->option('chunk');
        $drifted = 0;

        $this->info('Reconciling Product sold_count...');
        $drifted += $this->reconcileProducts($fix, $chunk);

        $this->info('Reconciling Event sold counts...');
        $drifted += $this->reconcileEvents($fix, $chunk);

        $this->info('Reconciling SellableVariant sold_count...');
        $drifted += $this->reconcileVariants($fix, $chunk);

        if ($drifted === 0) {
            $this->info('All stock counts are in sync.');
        } else {
            $verb = $fix ? 'corrected' : 'detected (run with --fix to correct)';
            $this->warn("{$drifted} discrepanc(ies) {$verb}.");
            Log::warning('stock:reconcile found drift', ['count' => $drifted, 'fixed' => $fix]);
        }

        return $drifted > 0 && !$fix ? self::FAILURE : self::SUCCESS;
    }

    private function reconcileProducts(bool $fix, int $chunk): int
    {
        $drifted = 0;

        Product::orderBy('id')->chunk($chunk, function ($products) use ($fix, &$drifted) {
            foreach ($products as $product) {
                $office = OfficeShiftSale::where('product_id', $product->id)->count();
                // Include pending sales: sold_count is incremented at checkout initiation
                // and only decremented on failure/abandonment.  Filtering to 'completed'
                // only would undercount during active sessions and corrupt the count when
                // --fix runs while transactions are still in flight.
                $online = OnlineSale::where('product_id', $product->id)
                    ->whereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed']))
                    ->count();
                $computed = $office + $online;

                if ($computed !== (int) $product->sold_count) {
                    $drifted++;
                    $this->line(sprintf(
                        '  [Product] %s (%s): cached=%d computed=%d',
                        $product->name,
                        $product->id,
                        $product->sold_count,
                        $computed
                    ));

                    if ($fix) {
                        Product::where('id', $product->id)->update(['sold_count' => $computed]);
                    }
                }
            }
        });

        return $drifted;
    }

    private function reconcileEvents(bool $fix, int $chunk): int
    {
        $drifted = 0;

        Event::orderBy('id')->chunk($chunk, function ($events) use ($fix, &$drifted) {
            foreach ($events as $event) {
                $officeWithCard = OfficeShiftSale::where('event_id', $event->id)
                    ->whereJsonContains('snapshot->ticket_type', 'with_card')
                    ->count();
                $onlineWithCard = OnlineSale::where('event_id', $event->id)
                    ->where('ticket_type', 'with_card')
                    ->whereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed']))
                    ->count();
                $computedWithCard = $officeWithCard + $onlineWithCard;

                $officeWithout = OfficeShiftSale::where('event_id', $event->id)
                    ->where(fn($q) => $q->whereJsonDoesntContain('snapshot->ticket_type', 'with_card')->orWhereNull('snapshot->ticket_type'))
                    ->count();
                $onlineWithout = OnlineSale::where('event_id', $event->id)
                    ->where(fn($q) => $q->where('ticket_type', '!=', 'with_card')->orWhereNull('ticket_type'))
                    ->whereHas('transaction', fn($q) => $q->whereIn('payment_status', ['pending', 'completed']))
                    ->count();
                $computedWithout = $officeWithout + $onlineWithout;

                $cachedWithCard = (int) $event->sold_count_with_card;
                $cachedWithout = (int) $event->sold_count_without_card;

                if ($computedWithCard !== $cachedWithCard || $computedWithout !== $cachedWithout) {
                    $drifted++;
                    $this->line(sprintf(
                        '  [Event] %s (%s): with_card cached=%d computed=%d | without_card cached=%d computed=%d',
                        $event->name,
                        $event->id,
                        $cachedWithCard,
                        $computedWithCard,
                        $cachedWithout,
                        $computedWithout
                    ));

                    if ($fix) {
                        Event::where('id', $event->id)->update([
                            'sold_count_with_card' => $computedWithCard,
                            'sold_count_without_card' => $computedWithout,
                        ]);
                    }
                }
            }
        });

        return $drifted;
    }

    private function reconcileVariants(bool $fix, int $chunk): int
    {
        $drifted = 0;

        SellableVariant::orderBy('id')->chunk($chunk, function ($variants) use ($fix, &$drifted) {
            foreach ($variants as $variant) {
                $computed = $variant->computedSoldCount();

                if ($computed !== (int) $variant->sold_count) {
                    $drifted++;
                    $this->line(sprintf(
                        '  [Variant] %s: cached=%d computed=%d',
                        $variant->id,
                        $variant->sold_count,
                        $computed
                    ));

                    if ($fix) {
                        SellableVariant::where('id', $variant->id)->update(['sold_count' => $computed]);
                    }
                }
            }
        });

        return $drifted;
    }
}
