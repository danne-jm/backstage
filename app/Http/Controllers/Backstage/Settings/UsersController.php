<?php

namespace App\Http\Controllers\Backstage\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('password.confirm', only: ['index']),
        ];
    }

    public function index(): Response
    {
        return Inertia::render('settings/users', [
            'users' => User::orderBy('first_name')->get([
                'id',
                'first_name',
                'last_name',
                'email',
                'role',
                'is_locked',
                'permissions',
                'last_seen_at',
            ]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'role' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:8'],
            'permissions' => ['nullable', 'array'],
            'is_locked' => ['boolean']
        ]);

        $user = new User();
        $user->first_name = $validated['first_name'];
        $user->last_name = $validated['last_name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'] ?? '';
        $user->password_hash = Hash::make($validated['password']);
        $user->permissions = $validated['permissions'] ?? [];
        $user->is_locked = $validated['is_locked'] ?? false;
        $user->save();

        return redirect()->back()->with('success', 'User created successfully.');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'role' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string', 'min:8'],
            'permissions' => ['nullable', 'array'],
            'is_locked' => ['boolean']
        ]);

        $user->first_name = $validated['first_name'];
        $user->last_name = $validated['last_name'];
        $user->email = $validated['email'];
        $user->role = $validated['role'] ?? '';
        if (!empty($validated['password'])) {
            $user->password_hash = Hash::make($validated['password']);
        }
        $user->permissions = $validated['permissions'] ?? [];
        $user->is_locked = $validated['is_locked'] ?? false;
        
        if ($user->is_locked) {
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }

        $user->save();

        return redirect()->back()->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        if (auth()->id() === $user->id) {
            return back()->withErrors(['error' => 'You cannot delete yourself.']);
        }

        $user->delete();

        return redirect()->back()->with('success', 'User deleted successfully.');
    }
}
