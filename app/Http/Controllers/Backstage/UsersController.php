<?php

namespace App\Http\Controllers\Backstage;

use App\Http\Controllers\Controller;
use App\Http\Requests\Backstage\SaveUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('backstage/settings/users/index', [
            'users' => User::orderBy('last_name')->get()->map(fn (User $user) => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'role' => $user->roles->first()?->name ?? 'member',
                'is_locked' => $user->is_locked,
                'last_seen_at' => $user->last_seen_at?->toIso8601String(),
                'gmail_connected' => ! empty($user->gmail_provider_email),
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ]),
        ]);
    }

    public function store(SaveUserRequest $request): RedirectResponse
    {
        $user = User::create([
            'first_name' => $request->input('first_name'),
            'last_name' => $request->input('last_name'),
            'email' => $request->input('email'),
            'password_hash' => Hash::make($request->input('password')),
        ]);

        $user->syncRoles([$request->input('role', 'member')]);
        $user->syncPermissions($request->input('permissions', []));

        return to_route('backstage.settings.users.index')
            ->with('success', 'User created successfully.');
    }

    public function update(SaveUserRequest $request, User $user): RedirectResponse
    {
        $user->update([
            'first_name' => $request->input('first_name'),
            'last_name' => $request->input('last_name'),
            'email' => $request->input('email'),
        ]);

        if ($request->filled('password')) {
            $user->update(['password_hash' => Hash::make($request->input('password'))]);
        }

        $user->syncRoles([$request->input('role', 'member')]);
        $user->syncPermissions($request->input('permissions', []));

        return to_route('backstage.settings.users.index')
            ->with('success', 'User updated.');
    }

    /**
     * Lock / unlock a user account.
     * Locking also purges all their active sessions from the database.
     */
    public function toggleLock(User $user): RedirectResponse
    {
        /** @var User $actor */
        $actor = Auth::user();

        if ($actor->is($user)) {
            return back()->withErrors(['lock' => 'You cannot lock your own account.']);
        }

        $newLockedState = ! $user->is_locked;

        $user->update(['is_locked' => $newLockedState]);

        if ($newLockedState) {
            // Destroy all database sessions belonging to this user
            DB::table('sessions')->where('user_id', $user->id)->delete();
        }

        $message = $newLockedState
            ? "User {$user->email} has been locked."
            : "User {$user->email} has been unlocked.";

        return back()->with('success', $message);
    }

    public function destroy(User $user): RedirectResponse
    {
        /** @var User $actor */
        $actor = Auth::user();

        if ($actor->is($user)) {
            return back()->withErrors(['delete' => 'You cannot delete your own account here.']);
        }

        $user->delete();

        return to_route('backstage.settings.users.index')
            ->with('success', 'User deleted.');
    }
}
