<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function createUserWithPermissions(array $permissions = [], array $attributes = []): \App\Models\User
    {
        $user = \App\Models\User::factory()->create($attributes);

        foreach ($permissions as $permissionName) {
            \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => 'web']);
        }

        if (! empty($permissions)) {
            $user->givePermissionTo($permissions);
        }

        return $user;
    }
}
