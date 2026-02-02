<?php

namespace App\Http\Controllers\Backstage\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Get Permissions
        $allPermissions = Permission::all();
        $availablePermissions = $allPermissions->map(function ($p) {
            return ['value' => $p->name, 'label' => ucwords(str_replace('_', ' ', $p->name))];
        })->values()->toArray();

        // Get Presets from Roles
        $roles = Role::with('permissions')->get();
        $presets = [];
        foreach ($roles as $role) {
            $presets[$role->name] = $role->permissions->pluck('name')->toArray();
        }

        $userRoles = $user->getRoleNames();
        
        if ($userRoles->isNotEmpty()) {
            $permissionDisplay = $userRoles->join(', ');
        } else {
            $direct = $user->getDirectPermissions()->pluck('name');
            $permissionDisplay = $direct->isEmpty() ? 'No permissions' : $direct->join(', ');
        }

        return Inertia::render('Backstage/settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            // Pass available permissions and presets so the frontend can render the same preview string
            'availablePermissions' => $availablePermissions,
            'rolePresets' => $presets,
            'permission_display' => $permissionDisplay,
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $data = $request->validated();

        // If a single `name` string is provided, map it to first_name and last_name
        // so the database columns are updated. First word => first_name, remainder => last_name.
        if (isset($data['name'])) {
            $name = trim((string) $data['name']);
            if ($name === '') {
                $data['first_name'] = null;
                $data['last_name'] = null;
            } else {
                $parts = preg_split('/\s+/', $name, 2);
                $data['first_name'] = $parts[0] ?? null;
                $data['last_name'] = $parts[1] ?? null;
            }

            unset($data['name']);
        }

        $request->user()->fill($data);

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Update the authenticated user's pinned footer items (JSON array).
     */
    public function updatePinned(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'pinned' => ['required', 'array'],
            'pinned.*.title' => ['required', 'string', 'max:191'],
            'pinned.*.href' => ['required', 'string', 'max:2000'],
            'pinned.*.icon' => ['nullable', 'string', 'max:191'],
        ]);

        $request->user()->forceFill([
            'pinned' => $data['pinned'],
        ])->save();

        // After updating pinned footer items, stay on the footer editor page
        // so the user remains in the settings area instead of being redirected
        // to the general profile edit page.
        return to_route('profile.footer.edit');
    }

    /**
     * Show the footer quick links editor page.
     */
    public function editPinned(Request $request): Response
    {
        return Inertia::render('Backstage/settings/footer', [
            'pinned' => $request->user()->pinned ?? [],
        ]);
    }
}
