<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::firstOrCreate(
            ['email' => 'it@esnleuven.com'],
            [
                // User model stores first_name / last_name primarily.
                'first_name' => 'Daniel',
                'last_name' => 'J M',
                'password' => 'xghQ7lIGwEWP+5i28cPG',
                'email_verified_at' => now(),
            ]
        );

        // Populate products and events used by the Office UI
        $this->call([
            ProductSeeder::class,
            EventSeeder::class,
            MailTemplateSeeder::class,
            \Database\Seeders\EventTicketsSeeder::class,
        ]);
    }
}
