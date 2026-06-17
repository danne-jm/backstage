<?php

namespace App\Http\Controllers\Backstage\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller implements HasMiddleware
{
    /**
     * Get the middleware that should be assigned to the controller.
     */
    public static function middleware(): array
    {
        return [
            new Middleware('password.confirm', only: ['index']),
        ];
    }

    /**
     * Display a listing of all users (admin only).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Authorization
        if (! $user || (! $user->can('manage_users') && ! $user->hasRole('Administrator'))) {
            abort(403, 'Unauthorized');
        }

        // Get Permissions
        $allPermissions = \Spatie\Permission\Models\Permission::all();
        $availablePermissions = $allPermissions->map(function ($p) {
            return ['value' => $p->name, 'label' => ucwords(str_replace('_', ' ', $p->name))];
        })->values()->toArray();

        // Get Presets from Roles
        $roles = \Spatie\Permission\Models\Role::with('permissions')->get();
        $presets = [];
        foreach ($roles as $role) {
            $presets[$role->name] = $role->permissions->pluck('name')->toArray();
        }

        $users = User::with('roles', 'permissions')->get()->map(function ($u) {
            $roles = $u->getRoleNames();

            if ($roles->isNotEmpty()) {
                $display = $roles->join(', ');
            } else {
                // Guests: show list of direct permissions
                // Use the simplified permission names (e.g. 'view_dashboard' -> 'View Dashboard')?
                // The prompt says "showcase all individual selected permissions".
                // Let's keep raw names or formatted. Raw names are clearer for debugging, but user might prefer formatted.
                // Existing code used raw names joined. Let's stick to that but cleaner.
                $direct = $u->getDirectPermissions()->pluck('name');
                $display = $direct->isEmpty() ? 'No permissions' : $direct->join(', ');
            }

            return [
                'id' => $u->id,
                'first_name' => $u->first_name ?? '',
                'last_name' => $u->last_name ?? '',
                'email' => $u->email ?? '',
                'role' => $u->role ?? '',
                'permissions' => $u->getAllPermissions()->pluck('name')->toArray(),
                'permission_display' => $display,
            ];
        });

        return Inertia::render('Backstage/settings/users', [
            'users' => $users,
            'availablePermissions' => $availablePermissions,
            'rolePresets' => $presets,
        ]);
    }

    /**
     * Store a newly created user (admin only).
     */
    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'nullable|string|max:100', // Job title
            'password' => 'required|string|min:8',
            'permissions' => 'array',
            'permissions.*' => 'string',
        ]);

        $data['password_hash'] = Hash::make($data['password']);
        unset($data['password']);

        // Extract permissions
        $permissions = $data['permissions'] ?? [];
        $role = isset($data['role']) ? trim((string) $data['role']) : '';
        if ($role === '') {
            $role = 'Anonymous';
        }
        unset($data['permissions'], $data['role']);

        $user = User::create($data);
        $user->forceFill([
            'role' => $role,
            'password_hash' => $data['password_hash'],
        ])->save();

        $user->syncPermissions($permissions);

        return back();
    }

    /**
     * Update the specified user (admin only).
     */
    public function update(Request $request, $id)
    {
        $this->authorizeAdmin($request);

        $target = User::findOrFail($id);
        $data = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,'.$id,
            'role' => 'nullable|string|max:100',
            'password' => 'nullable|string|min:8',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
            'permission_level' => 'nullable|string|in:Administrator,Board,Guest',
        ]);

        if (! empty($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
        }
        unset($data['password']);

        $permissions = $data['permissions'] ?? null;
        $role = $data['role'] ?? null;
        $permissionLevel = $data['permission_level'] ?? null;
        unset($data['permissions'], $data['role'], $data['permission_level']);

        $target->update($data);

        $privilegedUpdates = [];
        if ($role !== null) {
            $privilegedUpdates['role'] = $role;
        }
        if (isset($data['password_hash'])) {
            $privilegedUpdates['password_hash'] = $data['password_hash'];
        }

        if (! empty($privilegedUpdates)) {
            $target->forceFill($privilegedUpdates);
        }

        if ($target->isDirty()) {
            $target->save();
        }

        // Sync Spatie roles based on permission_level
        if ($permissionLevel !== null) {
            if ($permissionLevel === 'Administrator') {
                $target->syncRoles(['Administrator']);
            } elseif ($permissionLevel === 'Board') {
                $target->syncRoles(['Board']);
            } else {
                // Guest - remove all roles
                $target->syncRoles([]);
            }
        }

        if ($permissions !== null) {
            $target->syncPermissions($permissions);
        }

        return back();
    }

    /**
     * Remove the specified user (admin only).
     */
    public function destroy(Request $request, $id)
    {
        $this->authorizeAdmin($request);
        $target = User::findOrFail($id);
        $target->delete();

        return back();
    }

    private function authorizeAdmin($request)
    {
        $user = $request->user();
        if (! $user || (! $user->can('manage_users') && ! $user->hasRole('Administrator'))) {
            abort(403, 'Unauthorized');
        }
    }
}
