<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirect(Request $request): RedirectResponse|\Symfony\Component\HttpFoundation\RedirectResponse
    {
        /** @var GoogleProvider $driver */
        $driver = Socialite::driver('google');

        return $driver
            ->scopes([
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile',
            ])
            ->with(['access_type' => 'offline', 'prompt' => 'consent'])
            ->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function callback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            /** @var User|null $user */
            $user = Auth::user();

            if ($user) {
                // Connect account to existing user
                // Google doesn't always send refreshToken unless prompt=consent is used
                // but we included it above. If we don't get one, it means they already gave consent before
                // and we'd need to force prompt again if we really need it, but let's assume we get it.
                $user->update([
                    'gmail_provider_id' => $googleUser->getId(),
                    'gmail_provider_email' => $googleUser->getEmail(),
                    'gmail_refresh_token' => $googleUser->refreshToken ?? $user->gmail_refresh_token,
                ]);

                return redirect()->route('google.edit')->with('success', 'Google account connected successfully.');
            }

            return redirect()->route('login')->with('error', 'You must be logged in to connect your Google account.');

        } catch (\Exception $e) {
            return redirect()->route('google.edit')->with('error', 'Failed to connect Google account: '.$e->getMessage());
        }
    }

    /**
     * Disconnect the Google account from the user.
     */
    public function disconnect(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        $user->update([
            'gmail_provider_id' => null,
            'gmail_provider_email' => null,
            'gmail_refresh_token' => null,
        ]);

        return redirect()->route('google.edit')->with('success', 'Google account disconnected successfully.');
    }
}
