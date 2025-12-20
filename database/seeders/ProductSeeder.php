<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // Clear all existing products
        DB::table('products')->delete();

        $products = [
            ['name' => 'ESN card', 'price' => 15.00],
        ];

        foreach ($products as $p) {
            DB::table('products')->insert([
                'name' => $p['name'],
                'price' => $p['price'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
