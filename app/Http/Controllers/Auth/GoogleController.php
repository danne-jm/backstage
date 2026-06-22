<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;

class GoogleController extends Controller
{
    /**
     * Redirect to Google's OAuth consent screen.
     * Requests offline access to get a refresh token for Gmail/Sheets API.
     */
    public function redirect(Request $request): RedirectResponse
    {
        /** @var GoogleProvider $provider */
        $provider = Socialite::driver('google');

        $provider->scopes([
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/spreadsheets',
        ])
            ->with([
                'access_type' => 'offline',
                'prompt' => 'consent',
            ]);

        // Pass through intent so callback knows what to do
        $request->session()->put('google_oauth_intent', $request->input('intent', 'login'));

        return $provider->redirect();
    }

    /**
     * Handle the Google OAuth callback.
     *
     * - intent=login  → match user by google_provider_id or email, then log in.
     * - intent=connect → store the OAuth tokens on the already-authenticated user.
     */
    public function callback(Request $request): RedirectResponse
    {
        $intent = $request->session()->pull('google_oauth_intent', 'login');

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception) {
            return redirect('/login')->withErrors(['google' => 'Google authentication failed. Please try again.']);
        }

        if ($intent === 'connect') {
            return $this->handleConnect($request, $googleUser);
        }

        return $this->handleLogin($googleUser);
    }

    /**
     * Login flow: find an existing user by Google ID or email.
     */
    private function handleLogin(\Laravel\Socialite\Contracts\User $googleUser): RedirectResponse
    {
        $user = User::where('gmail_provider_id', $googleUser->getId())->first()
            ?? User::where('email', $googleUser->getEmail())->first();

        if (! $user) {
            return redirect('/login')
                ->withErrors(['google' => 'No account found for this Google account. Contact an administrator.']);
        }

        if ($user->is_locked) {
            return redirect('/login')
                ->withErrors(['google' => 'Your account has been locked. Contact an administrator.']);
        }

        // Update Google tokens on every login to keep them fresh
        $user->update([
            'gmail_provider_id' => $googleUser->getId(),
            'gmail_provider_email' => $googleUser->getEmail(),
            'gmail_refresh_token' => $googleUser->refreshToken ?? $user->gmail_refresh_token,
        ]);

        Auth::login($user, remember: true);

        return redirect()->intended('/backstage/office');
    }

    /**
     * Connect flow: attach Google credentials to the authenticated user.
     */
    private function handleConnect(Request $request, \Laravel\Socialite\Contracts\User $googleUser): RedirectResponse
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            return redirect('/login');
        }

        $user->update([
            'gmail_provider_id' => $googleUser->getId(),
            'gmail_provider_email' => $googleUser->getEmail(),
            'gmail_refresh_token' => $googleUser->refreshToken ?? $user->gmail_refresh_token,
        ]);

        return to_route('profile.edit')
            ->with('success', "Google account ({$googleUser->getEmail()}) connected successfully.");
    }

    /**
     * Disconnect Google account from the authenticated user.
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

        return to_route('profile.edit')
            ->with('success', 'Google account disconnected.');
    }
}
