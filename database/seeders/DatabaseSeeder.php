<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $role = Role::create(['name' => 'admin']);

        $user = User::create([
            'first_name' => 'Daniel',
            'last_name' => 'J. M',
            'email' => 'it@esnleuven.be',
            'password_hash' => Hash::make('xghQ7lIGwEWP+5i28cPG'),
        ]);

        $user->assignRole($role);
    }
}
