<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class EventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get first board member
        $boardUser = User::where('permissions', 'like', '%board%')->first();

        if (! $boardUser) {
            $this->command->warn('No board user found. Please create a user with board permissions first.');

            return;
        }

        // Clear all existing events
        DB::table('events')->delete();

        $now = Carbon::now();

        $events = [
            [
                'name' => 'D&B Rave',
                'description' => 'Drum, bass and cocktails! ESN Leuven is collaborating with Rumba for our first D&B rave. Come enjoy the beats while sipping a cocktail/mocktail!',
                'event_date' => $now->copy()->addDays(45)->setTime(21, 0),
                'start_sell_date' => $now->copy()->addDays(14),
                'end_sell_date' => $now->copy()->addDays(44),
                'price_with_card' => 8.00,
                'price_without_card' => 12.00,
                'quantity' => 150,
                'notes' => 'Collaboration with Rumba',
            ],
            [
                'name' => 'Welcome Weekend Trip',
                'description' => 'The Welcome Weekend trip is coming! Lots of fun memories are guaranteed with fellow ESN members and international students.',
                'event_date' => $now->copy()->addDays(21)->setTime(9, 0),
                'start_sell_date' => $now->copy()->addDays(3),
                'end_sell_date' => $now->copy()->addDays(18),
                'price_with_card' => 75.00,
                'price_without_card' => 85.00,
                'quantity' => 80,
                'notes' => 'Accommodation and transport included',
            ],
            [
                'name' => 'Flag Cantus',
                'description' => 'Represent your flag, wear the colours or bring a flag yourself! Beer, sangria and water will be provided. Predrinking is strictly forbidden! You should preferably eat before the event.',
                'event_date' => $now->copy()->addDays(28)->setTime(19, 30),
                'start_sell_date' => $now->copy()->addDays(7),
                'end_sell_date' => $now->copy()->addDays(27),
                'price_with_card' => 16.00,
                'price_without_card' => 19.00,
                'quantity' => 200,
                'notes' => 'Drinks and snacks included',
            ],
            [
                'name' => 'Kick-off Party',
                'description' => 'We will kick off the new semester with an awesome party! Alles Kapot, together with DJ Mattic and a mysterious third guest will provide THE music of the night.',
                'event_date' => $now->copy()->addDays(14)->setTime(22, 0),
                'start_sell_date' => $now->copy()->addDays(1),
                'end_sell_date' => $now->copy()->addDays(13),
                'price_with_card' => 10.00,
                'price_without_card' => 15.00,
                'quantity' => null,
                'notes' => 'Free entrance before 23:00 with ESN card',
            ],
            [
                'name' => 'Pub Crawl',
                'description' => 'The mythical and legendary ESN Leuven Pub Crawl is BACK! Explore Leuven\'s vibrant nightlife as we hop between the city\'s best bars in Oude Markt. Non-alcoholic beverages and free tap water will be available.',
                'event_date' => $now->copy()->addDays(35)->setTime(20, 0),
                'start_sell_date' => $now->copy()->addDays(14),
                'end_sell_date' => $now->copy()->addDays(34),
                'price_with_card' => 0.00,
                'price_without_card' => 0.00,
                'quantity' => null,
                'notes' => 'Free event, registration required',
            ],
            [
                'name' => 'Casino Cantus',
                'description' => 'Place your bets and raise your glasses, it\'s time for our Casino Cantus! Dress to impress and get ready for a night of high stakes and even higher spirits.',
                'event_date' => $now->copy()->addDays(56)->setTime(19, 30),
                'start_sell_date' => $now->copy()->addDays(28),
                'end_sell_date' => $now->copy()->addDays(55),
                'price_with_card' => 16.00,
                'price_without_card' => 19.00,
                'quantity' => 180,
                'notes' => 'Formal dress code recommended',
            ],
            [
                'name' => 'Harry Potter Cantus',
                'description' => 'Join us on a journey to Hogwarts as we enter the world of Harry Potter for this Cantus!',
                'event_date' => $now->copy()->addDays(70)->setTime(19, 30),
                'start_sell_date' => $now->copy()->addDays(42),
                'end_sell_date' => $now->copy()->addDays(69),
                'price_with_card' => 16.00,
                'price_without_card' => 19.00,
                'quantity' => 200,
                'notes' => 'Harry Potter themed costumes encouraged',
            ],
            [
                'name' => 'King\'s Day Amsterdam',
                'description' => 'Join us in the lively streets of Amsterdam to celebrate the birthday of the Dutch King Willem-Alexander on King\'s Day!',
                'event_date' => Carbon::create(2026, 4, 26, 8, 0),
                'start_sell_date' => Carbon::create(2026, 3, 15),
                'end_sell_date' => Carbon::create(2026, 4, 20),
                'price_with_card' => 31.00,
                'price_without_card' => 35.00,
                'quantity' => 50,
                'notes' => 'Bus transport included',
            ],
            [
                'name' => 'Enchanted Garden Gala',
                'description' => 'You are cordially invited to our ESN Leuven Gala: Enchanted Garden. We start with an exquisite reception followed by dinner and dancing.',
                'event_date' => Carbon::create(2026, 5, 10, 21, 0),
                'start_sell_date' => Carbon::create(2026, 4, 1),
                'end_sell_date' => Carbon::create(2026, 5, 5),
                'price_with_card' => 45.00,
                'price_without_card' => 55.00,
                'quantity' => 120,
                'notes' => 'Formal attire required, dinner included',
            ],
        ];

        foreach ($events as $event) {
            \App\Models\Event::create([
                'name' => $event['name'],
                'description' => $event['description'],
                'event_date' => $event['event_date'],
                'start_sell_date' => $event['start_sell_date'],
                'end_sell_date' => $event['end_sell_date'],
                'price_with_card' => $event['price_with_card'],
                'price_without_card' => $event['price_without_card'],
                'quantity' => $event['quantity'],
                'responsible_user_id' => $boardUser->id,
                'notes' => $event['notes'],
                'variable_amount' => false,
                'quantity_with_card' => null,
                'quantity_without_card' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        $this->command->info('Created '.count($events).' events');
    }
}
