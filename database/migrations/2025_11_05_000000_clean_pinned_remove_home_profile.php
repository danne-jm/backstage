<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Remove any pinned entries that represent Home/Profile (icon name "Home" or "User" or title "Home"/"Profile").
        $users = DB::table('users')->select('id', 'pinned')->get();

        foreach ($users as $u) {
            if (empty($u->pinned)) {
                continue;
            }

            $items = json_decode($u->pinned, true);
            if (! is_array($items)) {
                continue;
            }

            $filtered = array_values(array_filter($items, function ($it) {
                $title = isset($it['title']) ? (string) $it['title'] : '';
                $icon = isset($it['icon']) ? (string) $it['icon'] : '';

                $badTitles = ['Home', 'Profile'];
                $badIcons = ['Home', 'User'];

                if (in_array($title, $badTitles, true) || in_array($icon, $badIcons, true)) {
                    return false;
                }

                return true;
            }));

            // Only update if we removed something
            if (count($filtered) !== count($items)) {
                DB::table('users')->where('id', $u->id)->update(['pinned' => json_encode($filtered)]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // no-op: this migration is a one-off data cleanup
    }
};
