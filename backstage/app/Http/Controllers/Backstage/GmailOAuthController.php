<?php

namespace App\Http\Controllers\Backstage;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;

class GmailOAuthController extends Controller
{
    /**
     * Redirect to Google OAuth for Sign-In (public, unauthenticated login flow).
     * SECURITY: This route is PUBLIC and should ONLY be used for login/registration.
     */
    public function redirectToGoogle(Request $request)
    {
        try {
            if ($request->has('return_to')) {
                session()->put('url.intended', $request->input('return_to'));
            }

            // SECURITY FIX: Set oauth_intent to 'login' to prevent account linking via public route
            session()->put('oauth_intent', 'login');

            $user = Auth::user();

            // Default options
            $options = [
                'access_type' => 'offline',
            ];

            // LOGIC: Only force the "Consent" screen if we are missing the token.
            // This prevents annoying users who are just logging in normally.
            // But ensures we fix the "Split-Brain" issue if the DB is empty.
            if (! $user || empty($user->gmail_refresh_token)) {
                $options['prompt'] = 'consent';
            }

            return Socialite::driver('google')
                ->scopes([
                    'https://www.googleapis.com/auth/gmail.send',
                    'https://www.googleapis.com/auth/userinfo.profile',
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/spreadsheets',
                ])
                ->with($options)
                ->redirect();

        } catch (\Throwable $e) {
            Log::error('Socialite redirect failed: '.$e->getMessage());

            return redirect()->route('home')->withErrors('Unable to start Google authentication');
        }
    }

    public function handleGoogleCallback(Request $request)
    {
        try {
            // Use the normal user() call so Socialite validates state stored in the session.
            $socialUser = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            Log::error('Socialite callback failed: '.$e->getMessage());

            return redirect()->route('home')->withErrors('Google authentication failed');
        }

        $refreshToken = $socialUser->refreshToken ?? null;
        $providerId = $socialUser->id ?? null;
        $email = $socialUser->getEmail();

        // Security: Enforce allowed domains for Google Login
        $allowedOrigins = array_filter(array_map('trim', explode(',', env('EMAIL_ALLOWED_ORIGINS', ''))));
        if (! empty($allowedOrigins)) {
            $domain = substr(strrchr($email, '@'), 1);
            if (! in_array($domain, $allowedOrigins)) {
                Log::warning("Google Login blocked for domain: $domain (Email: $email)");

                return redirect()->route('home')->withErrors('Login is restricted to authorized domains only.');
            }
        }

        // Try to pull first/last name from raw user data if available
        $firstName = $socialUser->user['given_name'] ?? null;
        $lastName = $socialUser->user['family_name'] ?? null;
        if (empty($firstName) && ! empty($socialUser->getName())) {
            // Fallback: attempt to split the full name
            $parts = explode(' ', $socialUser->getName(), 2);
            $firstName = $parts[0] ?? null;
            $lastName = $parts[1] ?? null;
        }

        $current = Auth::user();
        $oauthIntent = session()->pull('oauth_intent'); // Consume the intent

        if ($current) {
            // SECURITY FIX: Reject account linking via public callback unless intent is 'connect'
            // This prevents authorization bypass and CSRF account takeover attacks.
            if ($oauthIntent !== 'connect') {
                Log::warning("OAuth account linking rejected: user {$current->id} attempted link via public callback with intent: {$oauthIntent}");

                return redirect()->route('dashboard')->withErrors('Invalid OAuth flow. Please use the settings page to connect your Google account.');
            }

            // Connecting an existing authenticated user: store token/provider and provider email
            $fill = [];
            if ($refreshToken) {
                $fill['gmail_refresh_token'] = $refreshToken;
            }
            if ($providerId) {
                $fill['gmail_provider_id'] = $providerId;
            }
            if ($email) {
                $fill['gmail_provider_email'] = $email;
            }

            $current->forceFill($fill)->save();

            return redirect()->intended(route('settings.google'))->with('status', 'Gmail connected successfully');
        }

        // Not authenticated: sign-in / register flow
        // Find by provider id or email first
        $userQuery = \App\Models\User::query();
        $found = null;
        if ($providerId) {
            $found = $userQuery->where('gmail_provider_id', $providerId)->first();
        }
        if (! $found && $email) {
            $found = $userQuery->where('email', $email)->first();
        }

        if (! $found) {
            // Create a new user using Google-provided info. Generate a random password.
            try {
                $createData = [
                    'first_name' => $firstName ?? '',
                    'last_name' => $lastName ?? '',
                    'email' => $email ?? '',
                    // Generate a random password_hash for Google sign-in users
                    'password_hash' => \Illuminate\Support\Facades\Hash::make(\Illuminate\Support\Str::random(64)),
                    'gmail_provider_email' => $email ?? null,
                    'gmail_provider_id' => $providerId ?? null,
                ];

                if ($refreshToken) {
                    $createData['gmail_refresh_token'] = $refreshToken;
                }

                $created = \App\Models\User::create($createData);
            } catch (\Throwable $e) {
                Log::error('Failed creating user from Google: '.$e->getMessage());

                return redirect()->route('login')->withErrors('Unable to create account from Google login');
            }

            $user = $created;
        } else {
            $user = $found;
            // Update missing names from Google if present
            $updated = [];
            if (empty($user->first_name) && ! empty($firstName)) {
                $updated['first_name'] = $firstName;
            }
            if (empty($user->last_name) && ! empty($lastName)) {
                $updated['last_name'] = $lastName;
            }
            if (empty($user->gmail_provider_email) && ! empty($email)) {
                $updated['gmail_provider_email'] = $email;
            }
            if (! empty($updated)) {
                $user->forceFill($updated)->save();
            }
        }

        // Store provider/token information if available
        $tokenFill = [];
        if ($refreshToken) {
            $tokenFill['gmail_refresh_token'] = $refreshToken;
        }
        if ($providerId) {
            $tokenFill['gmail_provider_id'] = $providerId;
        }
        if (! empty($tokenFill)) {
            // ensure provider email is saved too
            if (! empty($email) && empty($user->gmail_provider_email)) {
                $tokenFill['gmail_provider_email'] = $email;
            }
            $user->forceFill($tokenFill)->save();
        }

        // Log the user in and redirect to intended destination
        Auth::login($user, true);

        return redirect()->intended('/dashboard');
    }

    /**
     * Redirect to Google OAuth for Account Linking (protected, authenticated users only).
     * SECURITY: This route MUST be protected by 'auth' and 'permission:update_settings_google' middleware.
     */
    public function redirectToGoogleConnect(Request $request)
    {
        try {
            // SECURITY FIX: Set oauth_intent to 'connect' to allow account linking
            session()->put('oauth_intent', 'connect');

            return Socialite::driver('google')
                ->scopes([
                    'https://www.googleapis.com/auth/gmail.send',
                    'https://www.googleapis.com/auth/userinfo.profile',
                    'https://www.googleapis.com/auth/userinfo.email',
                    'https://www.googleapis.com/auth/spreadsheets',
                ])
                ->with([
                    'access_type' => 'offline',
                    'prompt' => 'consent', // Always ask for consent when linking
                ])
                ->redirect();

        } catch (\Throwable $e) {
            Log::error('Socialite connect redirect failed: '.$e->getMessage());

            return redirect()->route('settings.google')->withErrors('Unable to start Google connection');
        }
    }

    /**
     * Disconnect Gmail for the authenticated user (delete stored refresh token)
     */
    public function disconnect(Request $request)
    {
        $user = Auth::user();
        if (! $user) {
            return redirect()->route('settings.google')->withErrors('Not authenticated');
        }

        // Optionally try to revoke at Google's revoke endpoint
        try {
            if (! empty($user->gmail_refresh_token)) {
                $refreshToken = $user->gmail_refresh_token;
                // Call Google's token revoke endpoint
                $url = 'https://oauth2.googleapis.com/revoke?token='.urlencode($refreshToken);
                // Non-blocking fire-and-forget using file_get_contents with a small timeout
                $opts = stream_context_create(['http' => ['timeout' => 2]]);
                @file_get_contents($url, false, $opts);
            }
        } catch (\Throwable $e) {
            Log::warning('Gmail disconnect revoke failed: '.$e->getMessage());
        }

        $user->forceFill([
            'gmail_refresh_token' => null,
            'gmail_provider_id' => null,
            'gmail_provider_email' => null,
        ])->save();

        return redirect()->route('settings.google')->with('status', 'Gmail disconnected');
    }

    protected function makeClient(): GoogleClient
    {
        $client = new GoogleClient;
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setRedirectUri(config('services.google.redirect'));

        return $client;
    }
}
