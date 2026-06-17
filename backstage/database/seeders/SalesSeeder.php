<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SalesSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate the tables we'll seed so the data is deterministic for this minimal dataset
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        $tables = [
            'mails',
            'mail_templates',
            'office_shift_workers',
            'office_shift_sales',
            'office_shifts',
            'tickets',
            'products',
            'items',
            'events',
        ];

        foreach ($tables as $t) {
            DB::table($t)->truncate();
        }
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Get actual seeded users to link to
        $itManager = User::where('email', 'it@esnleuven.be')->first();
        $marketingManager = User::where('email', 'marketing@esnleuven.be')->first();
        $financeManager = User::where('email', 'finance@esnleuven.be')->first();
        $president = User::where('email', 'president@esnleuven.be')->first();

        // Generate IDs for mapping
        $eventIds = [];
        for ($i = 0; $i < 10; $i++) {
            $eventIds[] = Str::ulid();
        }

        $productIds = [
            'esncard' => Str::ulid(),
        ];

        $shiftIds = [
            Str::ulid(),
            Str::ulid(),
        ];

        $templateId = Str::ulid();

        // Insert events
        DB::table('events')->insert([
            [
                'id' => $eventIds[0],
                'name' => 'D&B Rave',
                'description' => 'Drum, bass and cocktails! ESN Leuven is collaborating with Rumba for our first D&B rave. Come enjoy the beats while sipping a cocktail/mocktail!',
                'event_date' => '2026-02-06',
                'start_sell_date' => '2026-01-06',
                'end_sell_date' => '2026-02-05',
                'google_spreadsheet_id' => null,
                'google_sheet_name' => null,
                'price_with_card' => '8.00',
                'price_without_card' => '12.00',
                'quantity' => '150',
                'quantity_with_card' => null,
                'quantity_without_card' => null,
                'responsible_user_id' => $itManager->id,
                'notes' => 'Collaboration with Rumba',
                'variable_amount' => '0',
                'created_at' => '2025-12-23 15:24:59',
                'updated_at' => '2025-12-23 15:24:59',
            ],
            [
                'id' => $eventIds[1],
                'name' => 'Welcome Weekend Trip',
                'description' => 'The Welcome Weekend trip is coming! Lots of fun memories are guaranteed with fellow ESN members and international students.',
                'event_date' => '2026-01-01',
                'start_sell_date' => '2025-12-18',
                'end_sell_date' => '2026-01-23',
                'google_spreadsheet_id' => null,
                'google_sheet_name' => null,
                'price_with_card' => '75.00',
                'price_without_card' => '85.00',
                'quantity' => '80',
                'quantity_with_card' => null,
                'quantity_without_card' => null,
                'responsible_user_id' => $itManager->id,
                'notes' => 'Accommodation and transport included',
                'variable_amount' => '0',
                'created_at' => '2025-12-23 15:24:59',
                'updated_at' => '2025-12-23 18:54:30',
            ],
            [
                'id' => $eventIds[2],
                'name' => 'Flag Cantus',
                'description' => 'Represent your flag, wear the colours or bring a flag yourself! Beer, sangria and water will be provided. Predrinking is strictly forbidden! You should preferably eat before the event.',
                'event_date' => '2026-02-12',
                'start_sell_date' => '2025-12-30',
                'end_sell_date' => '2026-01-19',
                'google_spreadsheet_id' => null,
                'google_sheet_name' => null,
                'price_with_card' => '16.00',
                'price_without_card' => '19.00',
                'quantity' => '200',
                'quantity_with_card' => null,
                'quantity_without_card' => null,
                'responsible_user_id' => $itManager->id,
                'notes' => 'Drinks and snacks included',
                'variable_amount' => '0',
                'created_at' => '2025-12-23 15:24:59',
                'updated_at' => '2025-12-23 15:54:40',
            ],
            [
                'id' => $eventIds[3],
                'name' => 'Kick-off Party',
                'description' => 'We will kick off the new semester with an awesome party! Alles Kapot, together with DJ Mattic and a mysterious third guest will provide THE music of the night.',
                'event_date' => '2026-01-06',
                'start_sell_date' => '2025-12-24',
                'end_sell_date' => '2026-01-05',
                'google_spreadsheet_id' => '1Mq6QWie5twPskGcO7sXExE_GRI0u8h0OuTWB-pqTzog',
                'google_sheet_name' => 'responses',
                'price_with_card' => '10.00',
                'price_without_card' => '15.00',
                'quantity' => '-1',
                'quantity_with_card' => '85',
                'quantity_without_card' => '20',
                'responsible_user_id' => $itManager->id,
                'notes' => 'Free entrance before 23:00 with ESN card',
                'variable_amount' => '1',
                'created_at' => '2025-12-23 15:24:59',
                'updated_at' => '2025-12-23 23:32:11',
            ],
            [
                'id' => $eventIds[4],
                'name' => 'Pub Crawl',
                'description' => "The mythical and legendary ESN Leuven Pub Crawl is BACK! Explore Leuven's vibrant nightlife as we hop between the city's best bars in Oude Markt. Non-alcoholic beverages and free tap water will be available.",
                'event_date' => '2026-01-27',
                'start_sell_date' => '2026-01-06',
                'end_sell_date' => '2026-01-26',
                'google_spreadsheet_id' => null,
                'google_sheet_name' => null,
                'price_with_card' => '0.00',
                'price_without_card' => '0.00',
                'quantity' => '-1',
                'quantity_with_card' => null,
                'quantity_without_card' => null,
                'responsible_user_id' => $itManager->id,
                'notes' => 'Free event, registration required',
                'variable_amount' => '0',
                'created_at' => '2025-12-23 15:24:59',
                'updated_at' => '2025-12-23 23:39:44',
            ],
            [
                'id' => $eventIds[5],
                'name' => 'Casino Cantus',
                'description' => "Place your bets and raise your glasses, it's time for our Casino Cantus! Dress to impress and get ready for a night of high stakes and even higher spirits.",
                'event_date' => '2026-02-17',
                'start_sell_date' => '2026-01-20',
                'end_sell_date' => '2026-02-16',
                'google_spreadsheet_id' => null,
                'google_sheet_name' => null,
                'price_with_card' => '16.00',
                'price_without_card' => '19.00',
                'quantity' => '180',
                'quantity_with_card' => null,
                'quantity_without_card' => null,
                'responsible_user_id' => $itManager->id,
                'notes' => 'Formal dress code recommended',
                'variable_amount' => '0',
                'created_at' => '2025-12-23 15:24:59',
                'updated_at' => '2025-12-23 15:24:59',
            ],
            [
                'id' => $eventIds[6],
                'name' => 'Harry Potter Cantus',
                'description' => 'Join us on a journey to Hogwarts as we enter the world of Harry Potter for this Cantus!',
                'event_date' => '2026-03-03',
                'start_sell_date' => '2026-02-03',
                'end_sell_date' => '2026-03-02',
                'google_spreadsheet_id' => null,
                'google_sheet_name' => null,
                'price_with_card' => '16.00',
                'price_without_card' => '19.00',
                'quantity' => '200',
                'quantity_with_card' => null,
                'quantity_without_card' => null,
                'responsible_user_id' => $itManager->id,
                'notes' => 'Harry Potter themed costumes encouraged',
                'variable_amount' => '0',
                'created_at' => '2025-12-23 15:24:59',
                'updated_at' => '2025-12-23 15:24:59',
            ],
            [
                'id' => $eventIds[7],
                'name' => "King's Day Amsterdam",
                'description' => "Join us in the lively streets of Amsterdam to celebrate the birthday of the Dutch King Willem-Alexander on King's Day!",
                'event_date' => '2025-04-26',
                'start_sell_date' => '2026-03-15',
                'end_sell_date' => '2026-04-20',
                'google_spreadsheet_id' => null,
                'google_sheet_name' => null,
                'price_with_card' => '31.00',
                'price_without_card' => '35.00',
                'quantity' => '50',
                'quantity_with_card' => null,
                'quantity_without_card' => null,
                'responsible_user_id' => $itManager->id,
                'notes' => 'Bus transport included',
                'variable_amount' => '0',
                'created_at' => '2025-12-23 15:24:59',
                'updated_at' => '2025-12-24 00:58:37',
            ],
            [
                'id' => $eventIds[8],
                'name' => 'Enchanted Garden Gala',
                'description' => 'You are cordially invited to our ESN Leuven Gala: Enchanted Garden. We start with an exquisite reception followed by dinner and dancing.',
                'event_date' => '2025-05-10',
                'start_sell_date' => '2027-04-01',
                'end_sell_date' => '2027-05-05',
                'google_spreadsheet_id' => null,
                'google_sheet_name' => null,
                'price_with_card' => '45.00',
                'price_without_card' => '55.00',
                'quantity' => '120',
                'quantity_with_card' => null,
                'quantity_without_card' => null,
                'responsible_user_id' => $itManager->id,
                'notes' => 'Formal attire required, dinner included',
                'variable_amount' => '0',
                'created_at' => '2025-12-23 15:24:59',
                'updated_at' => '2025-12-24 00:58:52',
            ],
            [
                'id' => $eventIds[9],
                'name' => 'Horse Riding in Sint Joris Wert',
                'description' => 'Demo event',
                'event_date' => '2025-12-31',
                'start_sell_date' => '2025-12-23',
                'end_sell_date' => '2025-12-30',
                'google_spreadsheet_id' => '1Mq6QWie5twPskGcO7sXExE_GRI0u8h0OuTWB-pqTzog',
                'google_sheet_name' => null,
                'price_with_card' => '20.00',
                'price_without_card' => '25.00',
                'quantity' => '65',
                'quantity_with_card' => null,
                'quantity_without_card' => null,
                'responsible_user_id' => $president->id,
                'notes' => null,
                'variable_amount' => '0',
                'created_at' => '2025-12-23 15:28:16',
                'updated_at' => '2025-12-24 23:29:12',
            ],
        ]);

        // Insert items
        DB::table('items')->insert([
            [
                'id' => Str::ulid(),
                'name' => 'Demo',
                'quantity' => '69',
                'category' => json_encode(['alcohol', 'drinks']),
                'image' => null,
                'image_data' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAesAAACXCAYAAAA1ZHOvAAAABHNCSVQICAgIfAhkiAAAABl0RVh0U29mdHdhcmUAZ25vbWUtc2NyZWVuc2hvdO8Dvz4AAAAtdEVYdENyZWF0aW9uIFRpbWUAVHVlIDIzIERlYyAyMDI1IDExOjU4OjE5IFBNIENFVImO+\/oAAA2ASURBVHic7d17fExn4sfx7ySHkYltd2hskGqr1KpbXVp16w9bS4uipWRbFW1pKNWWJWjrR2qDuhMNGgnb19JGKVWXVkW7rK5blbq0JBoiEUlNFkkMk5nfH5v6ya52q7nMs\/p5v17+wDjnyZlkPp7nnDljczgcPgEAAGMF+HsAAADgxxFrAAAMR6wBADAcsQYAwHDEGgAAwxFrAAAMR6wBADAcsQYAwHDEGgAAwxFrAAAMR6wBADAcsQYAwHDEGgAAwxFrAAAMR6wBADAcsQYAwHDEGgAAwxFrAAAMR6wBADAcsQYAwHDEGgAAwxFrAAAMR6wBADAcsQYAwHDEGgAAwxFrAAAMR6wBADCc5e8BADcau90uh8Mhu90uyyqbHzGPxyO32638\/Hy53e4y2QcAcxBroBUXnU7Z7Xbl5eXp\/Pnz8ng8ZbIfy7IUFBQkp9Mpt9stl8tVJvsBYAabw+Hw+XsQwI0gJCREHo+n3MPpdDplWZays7PLdb8Ayg\/nrIFS4HQ6\/RJqSXK5XPJ4PHI6neW+bwDlg1gDJWS322W32\/26FO1yua6MA8CNh1gDJeRwOJSXl+fvYSgvL08Oh8PfwwBQBog1UEJ2u10FBQX+HoYKCgqYWQM3KGINlJBlWWV21ff18Hg8ZfZWMQD+RawBADAcsQYAwHDEGgAAwxFrAAAMR6wBADAcsUb5snfRwhMu5ebmFv1y6eyZdB3ZsUrTI5rqZlsZ7DOwjkZszlb21pG6K7AMtl8KbM42mvhphk7Fd1f5vPkqUHVe\/ETZrhztmdpOlYsNppoiVmXp9Ip+urm0dmcLVGBZPLfALwSxhh8UKjUhQm1btVKrVq3V9vf99MoGS49MT1Jsn9DS\/6b05urLNfGKX\/2Fcg27E74V0lhdB09W0taVeqFJUPkPwGap9sBpGnVf2d1MpeK9I7Vu93I9XYOXG+Dn4qcHfuDTpZzjOnL4sA4fPqxD+7Zp5eSRenP\/zfrdox2uMbsOUEBJvlN9Odo6L0pRc7bojLcE2yl1AarWc7LiJzyswnfGKXb35XIfge\/CNq3f\/hsNnjpcjctoSm\/d2kQtbnWIiTXw8xFrmMHnlvuiTwEVKiiwaBk2Y9kwPfb6Gu1N+1aLu9llq1xfj0cv12eHTigz84S+Sl6qqC61VFE36eG4b5T9xeu6v+L3GwzQbUM+VObJFfpD6G8UsSpLWasiVM0mSYEKaR2pOWt36Wj6aWUc36eP46P00O3\/rJUt5Cm9l5Wllf1vuRKYwNrD9fGZTCU88s\/HVLyjpyav2qkjJzJL8EV79d37Q3VP3WbqOyVZp\/1xXxXvKS0fO0W77xyuqYPu+oHPzLUU+j8v6M0Pd+vYqdM6dWyX1s4cqKY322S7qa1e35GplKQI3WFJkkPNxiYr\/ViSBtato2EbzyhjySOqVLGtph08q9zsjzW8tqHnIgCDEWuUmoDQHor9fK+W9W+iDtFbtH\/tCDWq9J\/\/nc1eVQ16R+npFpe1Z8t2uYqWqoM6j9CgSqs0uk93RW+rpn6L1mp+T6\/eHdZZLVt20chNTj2b8I7G3ntJnyS+q5Nhj6pvm6Ll3MA79WjvFjq3LlEfZBVf+w5qNlork15T6zPxGtK1vTr1n6q9t0Vq2doZ6lLlp8z\/fqWHX5urARXfVXiLetd3kP6FO\/ukTuf7d23eczxBo2ccVKM\/TtWA2\/89pI6W47VqxSjVOzBV\/R5ooQeemKtT7WKUtKCvQi9sU\/QzMTpy3yTNj6yvkAdeU9zwKlr7wvNKPHpciU82UfNRH8t9eY+mdGqouxuHKyGt8KqtB6v5mPU6sGm82jYdpBX7tmlGl1uYhQP\/glijdFh3KmL+DHX6do5i84Zp3oDLShy3UAcuXvPB+u0fP1VO0UVmrqxj2janvbLih2jIohR9\/1Luc32gmHFLtXnnlzoZ8riee7CSPpo4XLFbDuvEiUPaNH28lhy\/U+F\/uF++Xcv05wNV1C28vX4lyar\/mHo3TFdSYrLOF9t3sDpEDlaDrAS9MCxOm788ooPblmvs4Bn6IrS3hvT6KefMvSrIv6iKtZqrY+u7S3rkDHBZRxaOUWza\/RoX87iKn1qurI6DBqpu2iK9\/GqSdqekK+Xvf1ZUzCbZH+yvHjUD5D4Uq8gxn6nOpB06uuYpXYwbrNHrz8inQl3IyVTm2QL5fAU6m5GhjMwcXbi61crTnnmvark9UvMGZmpOXI56zZ6j8FrMvoGrEWuUApt+3XWcXnkgXYtijqvXhB7y\/iVasV9ds9SSvMp8d6g6tGundu3aqk3LprqrTkN1HbtWaVedtr389Vf6uuj3gTVuVXWrsjrN3q2U1FSlpqYq9ZsNGlG\/gpw1qsvhPablidsU1DlcnavadU+f3qp98G0t3e0uvusAp2rVDFZh6hEdveqvvKe+UUp+oGqGVb\/2D0VAoAKuTPfy9NGrT2j85krqPfW9n3XEjHNxn+aOeUs5HScouke1\/5\/ZBjgVVt2hCvWGa93XRcc9NVVfzO2iylaoaoQGSirUyXXx+vBUoXTpc8XH7dSF69l3\/h7Njl6loH7\/q877JmtJbidNGPNg8SvUgV847vqPUuBT7sYZmr17gyJHVNPTb2xWr0mjNOCtv2vRsWtdNOXVP9IO6sCBA\/rR07SFXn1\/PVjhyTSdKryso9Me0XMrz+rqhWPfRZf+4fMq9\/0ErX9locJ7d1dqz2raPmO5UgqlYmuq3rP69sR5BbZppPqVpL8WfViWdUdj3R3sUdq3GSr0NZBPKvahGMHNWqqBJZ2QpMAQ3VVXSo5+VItH2hVW85brPmImyvv8DUW93U3vRL8qR3aAdFqS96zS0i\/Ic3KNBnd\/Q\/uufjp9Hp3PuSzZQtRlykz1te3T3uxWGh3TUx8NWq3MoifPV\/Rk2X5obdt+t54d2VPedaO0sc5LWlrtb5o5e8v1BR+4wTGzRulwH1LskPHa3yZGLwXO0sgNt2v8guE\/6Zz1T1GYulwL1p3VfYPGqtdvb1KgzaFaHUbrL5+u1otNiqJ6brMSkrLVfupbesaxUQnvn9a\/X\/ydr+S4hdpf5SnNiRuuh1o0UtOOAzVz8QjVT1+uBWuy5D13XCnZgWoe\/rx63N9Urbq\/rLjxv9OVa9ds1fXYrA+0Zu4g3VfTD2+3Kiu+c9r6p\/F6Tw\/qoXsqFP1hnrYuXKyDVR\/TqCGtVaOSTRWqNNITszZqy\/weCvFWUJ1n4jS\n',
                'last_modified' => '2025-12-24 18:13:12',
                'changed_by' => $itManager->email,
                'created_at' => '2025-12-24 00:16:10',
                'updated_at' => '2025-12-24 18:13:12',
            ],
            [
                'id' => Str::ulid(),
                'name' => 'Bread',
                'quantity' => '5',
                'category' => json_encode(['snacks']),
                'image' => null,
                'image_data' => null,
                'last_modified' => '2025-12-24 18:13:06',
                'changed_by' => $itManager->email,
                'created_at' => '2025-12-24 00:17:07',
                'updated_at' => '2025-12-24 18:13:06',
            ],
        ]);

        // Insert mail templates
        DB::table('mail_templates')->insert([
            [
                'id' => $templateId,
                'name' => 'ESN Leuven Default',
                'html_content' => '<div style="font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fdfcf9; border: 1px solid #d4c5a9;">\n    <div style="text-align: center; padding: 40px 20px 20px; border-bottom: 1px solid #d4c5a9;">\n        <div style="font-size: 32px; font-weight: 300; letter-spacing: 4px; color: #2c2416; margin-bottom: 8px;">ESN LEUVEN</div>\n        <div style="font-size: 11px; letter-spacing: 2px; color: #8b7355; font-weight: 500;">Announcement</div>\n    </div>\n    \n    <div style="padding: 50px 40px; color: #5a4a3a; line-height: 1.8;">\n        <h1 style="font-size: 28px; font-weight: 300; color: #2c2416; margin: 0 0 20px 0; text-align: center;">{{event_name}}</h1>\n        <p style="text-align: center; color: #8b7355; font-size: 14px; margin: 0 0 30px 0;">{{event_date}}</p>\n        {{body}}\n    </div>\n    \n    <div style="padding: 30px 40px; border-top: 1px solid #d4c5a9; background-color: #f8f6f0; text-align: center;">\n        <p style="margin: 0 0 10px 0; font-size: 13px; color: #5a4a3a;">© 2025 ESN Leuven. All rights reserved.</p>\n        <div style="font-size: 13px; color: #8b7355; margin-bottom: 10px;">\n            <a href="https://www.instagram.com/esnleuven/" target="_blank" style="color: #8b7355; text-decoration: none;">Instagram</a> | \n            <a href="https://linktr.ee/esnleuven" target="_blank" style="color: #8b7355; text-decoration: none;">Linktree</a> | \n            <a href="https://www.esnleuven.be/" target="_blank" style="color: #8b7355; text-decoration: none;">Website</a>\n        </div>\n        <p style="margin: 0; font-size: 12px; color: #a39482;">You received this email because you registered for an ESN Leuven communication.</p>\n    </div>\n</div>',
                'created_at' => '2025-12-23 15:24:59',
                'updated_at' => '2025-12-23 15:24:59',
            ],
        ]);

        // Insert office shifts
        DB::table('office_shifts')->insert([
            [
                'id' => $shiftIds[0],
                'started_by' => $itManager->id,
                'started_at' => '2025-12-23 23:50:32',
                'ended_at' => '2025-12-24 00:56:11',
                'cash_total' => '25.00',
                'cash_breakdown' => '{"1c": 0, "1e": 5, "2c": 0, "2e": 1, "5c": 0, "5e": 2, "10c": 0, "10e": 0, "20c": 0, "20e": 1, "50c": 0, "50e": 0, "100e": 0, "200e": 0, "500e": 0, "token": 0}',
                'end_of_shift_cash_breakdown' => '{"1c": 0, "1e": 5, "2c": 0, "2e": 1, "5c": 0, "5e": 2, "10c": 0, "10e": 1, "20c": 0, "20e": 1, "50c": 0, "50e": 1, "100e": 0, "200e": 0, "500e": 0, "token": 0}',
                'card_total' => '50.00',
                'status' => 'closed',
                'start_cash' => '60.00',
                'start_cash_breakdown' => '{"1c": 0, "1e": 0, "2c": 0, "2e": 0, "5c": 0, "5e": 0, "10c": 0, "10e": 1, "20c": 0, "20e": 0, "50c": 0, "50e": 1, "100e": 0, "200e": 0, "500e": 0, "token": 0}',
                'start_card' => '120.00',
                'total_cash' => '85.00',
                'total_card' => '170.00',
                'notes' => null,
                'created_at' => '2025-12-23 23:50:32',
                'updated_at' => '2025-12-24 00:56:11',
            ],
            [
                'id' => $shiftIds[1],
                'started_by' => $itManager->id,
                'started_at' => '2025-12-24 00:59:18',
                'ended_at' => null,
                'cash_total' => '25.00',
                'cash_breakdown' => '{"1c": 0, "1e": 0, "2c": 0, "2e": 0, "5c": 0, "5e": 1, "10c": 0, "10e": 2, "20c": 0, "20e": 0, "50c": 0, "50e": 0, "100e": 0, "200e": 0, "500e": 0, "token": 0}',
                'end_of_shift_cash_breakdown' => null,
                'card_total' => '15.00',
                'status' => 'open',
                'start_cash' => '85.00',
                'start_cash_breakdown' => '{"1c": 0, "1e": 5, "2c": 0, "2e": 1, "5c": 0, "5e": 2, "10c": 0, "10e": 1, "20c": 0, "20e": 1, "50c": 0, "50e": 1, "100e": 0, "200e": 0, "500e": 0, "token": 0}',
                'start_card' => '170.00',
                'total_cash' => '110.00',
                'total_card' => '185.00',
                'notes' => null,
                'created_at' => '2025-12-24 00:59:18',
                'updated_at' => '2025-12-24 12:58:42',
            ],
        ]);

        // Insert products
        DB::table('products')->insert([
            ['id' => $productIds['esncard'], 'name' => 'ESNcard', 'description' => 'Membership card', 'price' => '15.00', 'quantity' => '-1', 'variable_amount' => '0', 'type' => 'product', 'created_at' => '2025-12-23 15:24:59', 'updated_at' => '2025-12-23 23:41:16'],
        ]);

        // Insert office shift sales
        DB::table('office_shift_sales')->insert([
            [
                'id' => Str::ulid(),
                'office_shift_id' => $shiftIds[0],
                'product_id' => $productIds['esncard'],
                'event_id' => null,
                'method' => 'card',
                'amount' => '15.00',
                'description' => 'Membership card',
                'snapshot' => '{"name": "ESNcard", "price": "15.00", "amount": "15.00", "method": "card", "sold_at": "2025-12-23 23:58:07", "sold_by": "it@esnleuven.be", "item_type": "product", "created_at": "2025-12-23 23:58:07", "description": "Membership card", "ticket_type": null, "ticket_label": null}',
                'breakdown' => null,
                'sold_by' => $itManager->id,
                'sold_at' => '2025-12-23 23:58:07',
                'created_at' => '2025-12-23 23:58:07',
                'updated_at' => '2025-12-23 23:58:07',
            ],
            [
                'id' => Str::ulid(),
                'office_shift_id' => $shiftIds[0],
                'product_id' => $productIds['esncard'],
                'event_id' => null,
                'method' => 'card',
                'amount' => '15.00',
                'description' => 'Membership card',
                'snapshot' => '{"name": "ESNcard", "price": "15.00", "amount": "15.00", "method": "card", "sold_at": "2025-12-24 00:39:42", "sold_by": "it@esnleuven.be", "item_type": "product", "created_at": "2025-12-24 00:39:42", "description": "Membership card", "ticket_type": null, "ticket_label": null}',
                'breakdown' => null,
                'sold_by' => $itManager->id,
                'sold_at' => '2025-12-24 00:39:42',
                'created_at' => '2025-12-24 00:39:42',
                'updated_at' => '2025-12-24 00:39:42',
            ],
            [
                'id' => Str::ulid(),
                'office_shift_id' => $shiftIds[0],
                'product_id' => $productIds['esncard'],
                'event_id' => null,
                'method' => 'cash',
                'amount' => '25.00',
                'description' => 'Membership card',
                'snapshot' => '{"name": "ESNcard", "price": 25, "amount": 25, "method": "cash", "sold_at": "2025-12-24 00:47:25", "sold_by": "it@esnleuven.be", "item_type": "product", "created_at": "2025-12-24 00:47:25", "description": "Membership card", "ticket_type": "with_card", "ticket_label": null}',
                'breakdown' => '{"1c": 0, "1e": 5, "2c": 0, "2e": 0, "5c": 0, "5e": 0, "10c": 0, "10e": 0, "20c": 0, "20e": 1, "50c": 0, "50e": 0, "token": 0}',
                'sold_by' => $itManager->id,
                'sold_at' => '2025-12-24 00:47:25',
                'created_at' => '2025-12-24 00:47:25',
                'updated_at' => '2025-12-24 00:55:38',
            ],
            [
                'id' => Str::ulid(),
                'office_shift_id' => $shiftIds[0],
                'product_id' => null,
                'event_id' => $eventIds[9],
                'method' => 'card',
                'amount' => '20.00',
                'description' => 'Demo event',
                'snapshot' => '{"name": "Horse Riding in Sint Joris Wert", "price": "20.00", "amount": "20.00", "method": "card", "sold_at": "2025-12-24 00:52:57", "sold_by": "it@esnleuven.be", "item_type": "event", "created_at": "2025-12-24 00:52:57", "description": "Demo event", "ticket_type": "with_card", "ticket_label": "With ESN Card"}',
                'breakdown' => null,
                'sold_by' => $itManager->id,
                'sold_at' => '2025-12-24 00:52:57',
                'created_at' => '2025-12-24 00:52:57',
                'updated_at' => '2025-12-24 00:52:57',
            ],
            [
                'id' => Str::ulid(),
                'office_shift_id' => $shiftIds[1],
                'product_id' => null,
                'event_id' => $eventIds[9],
                'method' => 'cash',
                'amount' => '25.00',
                'description' => 'Demo event',
                'snapshot' => '{"name": "Horse Riding in Sint Joris Wert", "price": 25, "amount": 25, "method": "cash", "sold_at": "2025-12-24 09:33:02", "sold_by": "it@esnleuven.be", "item_type": "event", "created_at": "2025-12-24 09:33:02", "description": "Demo event", "ticket_type": "without_card", "ticket_label": "Without ESN Card"}',
                'breakdown' => '{"1c": 0, "1e": 0, "2c": 0, "2e": 0, "5c": 0, "5e": 1, "10c": 0, "10e": 2, "20c": 0, "20e": 0, "50c": 0, "50e": 0, "token": 0}',
                'sold_by' => $itManager->id,
                'sold_at' => '2025-12-24 09:33:02',
                'created_at' => '2025-12-24 09:33:02',
                'updated_at' => '2025-12-24 09:33:02',
            ],
            [
                'id' => Str::ulid(),
                'office_shift_id' => $shiftIds[1],
                'product_id' => $productIds['esncard'],
                'event_id' => null,
                'method' => 'card',
                'amount' => '15.00',
                'description' => 'Membership card',
                'snapshot' => '{"name": "ESNcard", "price": "15.00", "amount": "15.00", "method": "card", "sold_at": "2025-12-24 12:58:42", "sold_by": "it@esnleuven.be", "item_type": "product", "created_at": "2025-12-24 12:58:42", "description": "Membership card", "ticket_type": null, "ticket_label": null}',
                'breakdown' => null,
                'sold_by' => $itManager->id,
                'sold_at' => '2025-12-24 12:58:42',
                'created_at' => '2025-12-24 12:58:42',
                'updated_at' => '2025-12-24 12:58:42',
            ],
        ]);

        // Online sales logic
        try {
            $service = app(\App\Services\SaleService::class);
            $cardSales = DB::table('office_shift_sales')->where('method', 'card')->get();
            foreach ($cardSales as $cs) {
                $snapshot = json_decode($cs->snapshot ?? 'null', true) ?? [];
                $payload = [
                    'product_id' => $cs->product_id,
                    'event_id' => $cs->event_id,
                    'method' => 'card',
                    'amount' => $cs->amount,
                    'ticket_type' => $snapshot['ticket_type'] ?? null,
                    'ticket_label' => $snapshot['ticket_label'] ?? null,
                    'sold_at' => $cs->sold_at ?? $cs->created_at,
                ];
                $service->createOnlineSale($payload);
            }
        } catch (\Throwable $e) {
        }

        // Insert office shift workers
        DB::table('office_shift_workers')->insert([
            ['id' => Str::ulid(), 'office_shift_id' => $shiftIds[0], 'user_id' => $itManager->id, 'role' => 'IT Manager', 'created_at' => '2025-12-23 23:50:32', 'updated_at' => '2025-12-23 23:50:32'],
            ['id' => Str::ulid(), 'office_shift_id' => $shiftIds[0], 'user_id' => $marketingManager->id, 'role' => 'Marketing Manager', 'created_at' => '2025-12-24 00:47:10', 'updated_at' => '2025-12-24 00:47:10'],
            ['id' => Str::ulid(), 'office_shift_id' => $shiftIds[0], 'user_id' => $financeManager->id, 'role' => 'Finance Manager', 'created_at' => '2025-12-24 00:53:47', 'updated_at' => '2025-12-24 00:53:47'],
            ['id' => Str::ulid(), 'office_shift_id' => $shiftIds[1], 'user_id' => $itManager->id, 'role' => 'IT Manager', 'created_at' => '2025-12-24 00:59:18', 'updated_at' => '2025-12-24 00:59:18'],
            ['id' => Str::ulid(), 'office_shift_id' => $shiftIds[1], 'user_id' => $financeManager->id, 'role' => 'Finance Manager', 'created_at' => '2025-12-24 00:59:23', 'updated_at' => '2025-12-24 00:59:23'],
        ]);

        // Insert tickets
        DB::table('tickets')->insert([
            ['id' => Str::ulid(), 'event_id' => $eventIds[9], 'user_id' => $itManager->id, 'ticket_code' => 'Horse-Riding-in-Sint-Joris-Wert_31-12-2025_to_Daniel-Meyer-Pepito_via_danieljaurell@gmail.com_7NIqlAth', 'first_name' => 'Daniel', 'last_name' => 'Meyer Pepito', 'email' => 'danieljaurell@gmail.com', 'unique_trait' => '7NIqlAth', 'scan_count' => 0, 'scan_details' => null, 'metadata' => json_encode(['email' => 'danieljaurell@gmail.com', 'last_name' => 'Meyer Pepito', 'event_date' => '2025-12-31 00:00:00', 'event_name' => 'Horse Riding in Sint Joris Wert', 'first_name' => 'Daniel']), 'scanned_at' => null, 'created_at' => '2025-12-24 09:34:31', 'updated_at' => '2025-12-24 09:34:31'],
            ['id' => Str::ulid(), 'event_id' => $eventIds[9], 'user_id' => $itManager->id, 'ticket_code' => 'Horse-Riding-in-Sint-Joris-Wert_31-12-2025_to_Pippi-longstocking_via_danieljaurell@gmail.com_XGbzULB4', 'first_name' => 'Pippi', 'last_name' => 'longstocking', 'email' => 'danieljaurell@gmail.com', 'unique_trait' => 'XGbzULB4', 'scan_count' => 4, 'scan_details' => '[{"user_id": 1, "timestamp": "2025-12-24 09:35:46", "user_email": "it@esnleuven.be"}, {"user_id": 1, "timestamp": "2025-12-24 09:35:51", "user_email": "it@esnleuven.be"}, {"user_id": 1, "timestamp": "2025-12-24 09:35:57", "user_email": "it@esnleuven.be"}, {"user_id": 1, "timestamp": "2025-12-24 09:36:05", "user_email": "it@esnleuven.be"}]', 'metadata' => json_encode(['email' => 'danieljaurell@gmail.com', 'last_name' => 'longstocking', 'event_date' => '2025-12-31 00:00:00', 'event_name' => 'Horse Riding in Sint Joris Wert', 'first_name' => 'Pippi']), 'scanned_at' => '2025-12-24 09:35:46', 'created_at' => '2025-12-24 09:34:31', 'updated_at' => '2025-12-24 09:36:05'],
        ]);
    }
}
