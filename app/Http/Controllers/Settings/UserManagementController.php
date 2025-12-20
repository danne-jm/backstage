<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Enums\UserPermission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    /**
     * Display a listing of all users (admin only).
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $permissions = $user ? $user->permissions : [];
        if (!$user || !in_array('admin', $permissions ?? [])) {
            abort(403, 'Unauthorized');
        }
        $users = User::all()->map(function ($u) {
            return [
                'id' => $u->id,
                'first_name' => $u->first_name ?? '',
                'last_name' => $u->last_name ?? '',
                'email' => $u->email ?? '',
                'role' => $u->role ?? '',
                'permissions' => $u->permissions ?? [],
                // Never send password hash to frontend
            ];
        });
        // Only allow 'admin', 'board', and 'guest' permissions
        $limitedPermissions = array_filter(
            UserPermission::allWithLabels(),
            fn($perm) => in_array($perm['value'], ['admin', 'board', 'guest'])
        );
        return Inertia::render('settings/users', [
            'users' => $users,
            'availablePermissions' => array_values($limitedPermissions),
        ]);
    }

    /**
     * Store a newly created user (admin only).
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $permissions = $user ? $user->permissions : [];
        if (!$user || !in_array('admin', $permissions ?? [])) {
            abort(403, 'Unauthorized');
        }
        $data = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'role' => 'required|string',
            'password' => 'required|string|min:8',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);
        $data['password_hash'] = Hash::make($data['password']);
        unset($data['password']);
        
        // Ensure permissions is always an array
        if (!isset($data['permissions'])) {
            $data['permissions'] = [];
        }
        
        $user = User::create($data);
        
        // Return without password hash
        return back();
    }

    /**
     * Update the specified user (admin only).
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $permissions = $user ? $user->permissions : [];
        if (!$user || !in_array('admin', $permissions ?? [])) {
            abort(403, 'Unauthorized');
        }
        $target = User::findOrFail($id);
        $data = $request->validate([
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:users,email,' . $id,
            'role' => 'sometimes|required|string',
            'password' => 'nullable|string|min:8',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);
        if (!empty($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
            unset($data['password']);
        }
        
        // Ensure permissions is always an array
        if (isset($data['permissions'])) {
            $data['permissions'] = $data['permissions'];
        }
        
        $target->update($data);
        
        // Return without password hash
        return back();
    }

    /**
     * Remove the specified user (admin only).
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $permissions = $user ? $user->permissions : [];
        if (!$user || !in_array('admin', $permissions ?? [])) {
            abort(403, 'Unauthorized');
        }
        $target = User::findOrFail($id);
        $target->delete();
        return back();
    }
}
