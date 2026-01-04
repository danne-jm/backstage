<?php

namespace App\Console\Commands;

use App\Models\Event;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PopulateExistingEventsAttendees extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events:populate-attendees';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create attendee tables for all existing events in the attendees database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $events = Event::all();

        if ($events->isEmpty()) {
            $this->info('No events found.');

            return self::SUCCESS;
        }

        $this->info("Found {$events->count()} events. Creating attendee tables...");

        foreach ($events as $event) {
            $tableName = \App\Models\EventAttendee::generateTableName($event);

            // Skip if table already exists
            if (Schema::hasTable($tableName)) {
                $this->warn("Table {$tableName} already exists. Skipping.");

                continue;
            }

            // Create table
            Schema::create($tableName, function ($table) {
                $table->id();
                $table->string('first_name');
                $table->string('last_name');
                $table->string('nationality')->nullable();
                $table->boolean('esn_card')->default(false);
                $table->string('email');
                $table->timestamps();
            });

            // Populate with dummy data
            $dummyData = [
                ['first_name' => 'Daniel', 'last_name' => 'Meyer', 'nationality' => 'DE', 'esn_card' => true, 'email' => 'danieljaurell@gmail.com'],
                ['first_name' => 'Daniel', 'last_name' => 'Mevo', 'nationality' => 'DE', 'esn_card' => true, 'email' => 'danieljaurell@gmail.com'],
                ['first_name' => 'Daniel', 'last_name' => 'Meyer', 'nationality' => 'DE', 'esn_card' => true, 'email' => 'danieljaurell@gmail.com'],
                ['first_name' => 'Daniel', 'last_name' => 'Ahmad', 'nationality' => 'DE', 'esn_card' => true, 'email' => 'danieljaurell@gmail.com'],
                ['first_name' => 'Daniel', 'last_name' => 'Meyer', 'nationality' => 'DE', 'esn_card' => true, 'email' => 'danieljaurell@gmail.com'],
            ];

            foreach ($dummyData as $data) {
                DB::table($tableName)->insert(array_merge($data, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }

            $this->info("Created table {$tableName} with dummy data.");
        }

        $this->info('Done!');

        return self::SUCCESS;
    }
}
