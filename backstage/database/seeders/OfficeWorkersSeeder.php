<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OfficeWorkersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        if (! Schema::hasColumn('users', 'is_office_worker')) {
            // Column not present; nothing to do
            return;
        }

        // Mark the first 4 users as office workers (idempotent)
        $users = DB::table('users')->orderBy('id')->limit(4)->pluck('id');

        foreach ($users as $id) {
            DB::table('users')->where('id', $id)->update(['is_office_worker' => 1]);
        }
    }
}
