<?php

namespace App\Http\Controllers\Backstage\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    /**
     * Show the user's password settings page.
     */
    public function edit(): Response
    {
        return Inertia::render('Backstage/settings/password');
    }

    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        // Store into the `password_hash` column. Use forceFill to bypass
        // mass-assignment restrictions since the model uses `password_hash`.
        // We use 'password' here to leverage the setPasswordAttribute mutator on the User model
        $request->user()->forceFill([
            'password' => $validated['password'],
        ])->save();

        return back();
    }
}
