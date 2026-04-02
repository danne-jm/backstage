<?php

namespace App\Http\Controllers\Backstage\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleController extends Controller
{
    /**
     * Redirect to Google to connect an existing account.
     * Requires the user to already be authenticated.
     */
    public function redirectToConnect(): RedirectResponse
    {
        session(['google_intent' => 'connect']);

        return Socialite::driver('google')
            ->scopes([
                'email',
                'profile',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/spreadsheets',
            ])
            ->with(['access_type' => 'offline', 'prompt' => 'consent'])
            ->redirect();
    }

    /**
     * Handle the Google OAuth callback for account connection.
     */
    public function handleConnectCallback(): RedirectResponse
    {
        $intent = session()->pull('google_intent');

        // --- Connect flow (must be logged in) ---
        if ($intent === 'connect') {
            if (!Auth::check()) {
                return redirect()->route('login');
            }

            try {
                $googleUser = Socialite::driver('google')->user();
            } catch (\Exception) {
                return redirect()->route('settings.google')
                    ->with('error', 'Google authorisation failed. Please try again.');
            }

            /** @var User $user */
            $user = Auth::user();
            $user->update([
                'gmail_provider_id' => $googleUser->getId(),
                'gmail_provider_email' => $googleUser->getEmail(),
                'gmail_refresh_token' => $googleUser->refreshToken,
            ]);

            return redirect()->route('settings.google')
                ->with('success', 'Google account connected successfully.');
        }

        // --- Login flow (must NOT be logged in) ---
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception) {
            return redirect()->route('login')
                ->with('error', 'Google sign-in failed. Please try again.');
        }

        // Only allow sign-in if the Google account is connected to a local user
        $user = User::where('gmail_provider_id', $googleUser->getId())->first();

        if (!$user) {
            return redirect()->route('login')
                ->with('error', 'No account is connected to this Google account. Please sign in with your email and password first, then connect your Google account in Settings.');
        }

        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Redirect to Google to sign in (no existing session needed).
     */
    public function redirectToLogin(): RedirectResponse
    {
        session(['google_intent' => 'login']);

        return Socialite::driver('google')
            ->scopes(['email', 'profile'])
            ->redirect();
    }

    /**
     * Disconnect the current user's Google account.
     */
    public function disconnect(): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();
        $user->update([
            'gmail_provider_id' => null,
            'gmail_provider_email' => null,
            'gmail_refresh_token' => null,
        ]);

        return redirect()->route('settings.google')
            ->with('success', 'Google account disconnected.');
    }
}
