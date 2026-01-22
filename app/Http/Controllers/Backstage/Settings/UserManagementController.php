<?php

namespace App\Http\Controllers\Backstage\Settings;

use App\Enums\UserPermission;
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
        $permissions = $user ? $user->permissions : [];

        // Check for 'admin' OR 'manage_users'
        if (! $user || (! in_array('admin', $permissions) && ! in_array('manage_users', $permissions))) {
            abort(403, 'Unauthorized');
        }

        $presets = UserPermission::rolePresets();

        $users = User::all()->map(function ($u) use ($presets) {
            // Determine permission display label
            $currentPerms = $u->permissions ?? [];
            sort($currentPerms);

            $permissionDisplay = null;

            // Check against Admin/Board exact matches
            foreach (['Administrator', 'Board'] as $presetName) {
                $presetPerms = $presets[$presetName] ?? [];
                sort($presetPerms);
                if ($currentPerms == $presetPerms) {
                    $permissionDisplay = $presetName;
                    break;
                }
            }

            // If no match (or Guest), build the custom string
            if (! $permissionDisplay) {
                // Filter out the 'guest' and 'view_dashboard' tags to just show the "extra" stuff
                $extras = array_filter($currentPerms, fn ($p) => ! in_array($p, ['guest', 'view_dashboard']));

                // Human readable labels for extras
                $extraLabels = array_map(function ($val) {
                    return UserPermission::tryFrom($val)?->label() ?? $val;
                }, $extras);

                $permissionDisplay = '[Guest] '.(empty($extraLabels) ? '' : implode(', ', $extraLabels));
            }

            return [
                'id' => $u->id,
                'first_name' => $u->first_name ?? '',
                'last_name' => $u->last_name ?? '',
                'email' => $u->email ?? '',
                'role' => $u->role ?? '', // Use as Job Title/Description
                'permissions' => $u->permissions ?? [],
                'permission_display' => $permissionDisplay,
            ];
        });

        return Inertia::render('Backstage/settings/users', [
            'users' => $users,
            'availablePermissions' => UserPermission::allWithLabels(),
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

        // Extract privileged fields before mass assignment
        $permissions = $data['permissions'] ?? [];
        $role = isset($data['role']) ? trim((string) $data['role']) : '';
        if ($role === '') {
            $role = 'Anonymous';
        }
        unset($data['permissions'], $data['role']);

        // Create user with safe fields only, then forceFill privileged fields
        $user = User::create($data);
        $user->forceFill([
            'permissions' => $permissions,
            'role' => $role,
        ])->save();

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
        ]);

        if (! empty($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
        }
        unset($data['password']);

        // Extract privileged fields before mass assignment
        $permissions = $data['permissions'] ?? null;
        $role = $data['role'] ?? null;
        unset($data['permissions'], $data['role']);

        // Update safe fields via mass assignment
        $target->update($data);

        // Update privileged fields via forceFill (if provided)
        $privilegedUpdates = [];
        if ($permissions !== null) {
            $privilegedUpdates['permissions'] = $permissions;
        }
        if ($role !== null) {
            $privilegedUpdates['role'] = $role;
        }
        if (!empty($privilegedUpdates)) {
            $target->forceFill($privilegedUpdates)->save();
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
        $permissions = $user ? $user->permissions : [];
        if (! $user || (! in_array('admin', $permissions) && ! in_array('manage_users', $permissions))) {
            abort(403, 'Unauthorized');
        }
    }
}
