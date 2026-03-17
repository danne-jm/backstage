<?php

namespace App\Services;

use App\Models\User;
use Google\Client;
use Google\Service\Gmail;
use Illuminate\Support\Facades\Log;
use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Exception\ClientException;

/**
 * Service for sending emails via Gmail API using OAuth
 * 
 * Handles:
 * - Token refresh and management
 * - Email composition and sending via Gmail API
 * - Error handling and logging
 */
class GmailSenderService
{
    private Client $googleClient;
    private ?string $lastError = null;

    public function __construct()
    {
        $this->googleClient = new Client();
        $this->googleClient->setApplicationName('Backstage Email Distributor');
        $this->googleClient->setClientId(config('services.google.client_id'));
        $this->googleClient->setClientSecret(config('services.google.client_secret'));
        $this->googleClient->setScopes([
            'https://www.googleapis.com/auth/gmail.send',
        ]);
        $this->googleClient->setAccessType('offline');
    }

    /**
     * Lightweight check to ensure we can obtain an access token for the user.
     */
    public function canSend(User $user): bool
    {
        return $this->ensureValidToken($user);
    }

    /**
     * Send email via Gmail API
     * 
     * @param string $to Recipient email
     * @param string $subject Email subject
     * @param string $body Email body (HTML)
     * @param User $user User whose account will send the email
     * @return bool True if sent successfully
     */
    public function send(string $to, string $subject, string $body, User $user): bool
    {
        try {
            // Refresh token if needed
            if (!$this->ensureValidToken($user)) {
                Log::warning('GmailSenderService: Failed to get valid token', [
                    'user_id' => $user->id,
                    'error' => $this->lastError,
                ]);
                return false;
            }

            // Create Gmail service with user's credentials
            $gmail = new Gmail($this->googleClient);

            // Build the email message
            $message = $this->buildMessage($to, $subject, $body, $user);

            // Send via Gmail API
            $result = $gmail->users_messages->send('me', $message);

            Log::info('GmailSenderService: Email sent successfully', [
                'message_id' => $result->getId(),
                'recipient' => $to,
                'user_id' => $user->id,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('GmailSenderService: Failed to send email', [
                'recipient' => $to,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Ensure user has a valid Gmail access token
     */
    private function ensureValidToken(User $user): bool
    {
        $this->lastError = null;

        if (!$user->gmail_refresh_token) {
            $this->lastError = 'No refresh token on file';
            return false;
        }

        try {
            $refreshToken = $this->normalizeRefreshToken($user->gmail_refresh_token);

            if (!$refreshToken) {
                $this->lastError = 'Invalid or missing refresh token';
                Log::warning('GmailSenderService: Refresh token missing after normalization', [
                    'user_id' => $user->id,
                ]);
                return false;
            }

            // Use direct HTTP call to Google OAuth endpoint
            $http = new HttpClient();

            try {
                $response = $http->post('https://oauth2.googleapis.com/token', [
                    'form_params' => [
                        'client_id' => config('services.google.client_id'),
                        'client_secret' => config('services.google.client_secret'),
                        'grant_type' => 'refresh_token',
                        'refresh_token' => $refreshToken,
                    ],
                    'timeout' => 10,
                ]);

                $token = json_decode((string) $response->getBody(), true) ?? [];

                if (!is_array($token)) {
                    $this->lastError = 'Invalid token response format';
                    Log::warning('GmailSenderService: Invalid token response format', [
                        'user_id' => $user->id,
                    ]);
                    return false;
                }

                if (isset($token['access_token'])) {
                    // Set the full token with refresh token
                    $token['refresh_token'] = $refreshToken;
                    $this->googleClient->setAccessToken($token);
                    Log::info('GmailSenderService: Token refreshed successfully', [
                        'user_id' => $user->id,
                    ]);
                    return true;
                }

                $this->lastError = $token['error_description'] ?? $token['error'] ?? 'No access_token in response';
                Log::warning('GmailSenderService: No access token in refresh response', [
                    'user_id' => $user->id,
                    'error' => $token['error'] ?? null,
                    'error_description' => $token['error_description'] ?? null,
                ]);
                return false;
            } catch (ClientException $e) {
                $body = (string) optional($e->getResponse())->getBody();
                $parsed = $this->extractErrorFromBody($body);

                $this->lastError = $parsed['description'] ?? $e->getMessage();

                Log::error('GmailSenderService: Token refresh HTTP error', [
                    'user_id' => $user->id,
                    'http_error' => $e->getCode(),
                    'error' => $parsed['error'] ?? null,
                    'error_description' => $parsed['description'] ?? null,
                ]);
                return false;
            }
        } catch (\Throwable $e) {
            $this->lastError = $e->getMessage();
            Log::error('GmailSenderService: Token refresh failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    private function normalizeRefreshToken(?string $raw): ?string
    {
        if (!$raw) {
            return null;
        }

        $trimmed = trim($raw);

        // Some installs may have stored the entire token payload as JSON; extract refresh_token if so
        if (str_starts_with($trimmed, '{')) {
            $decoded = json_decode($trimmed, true);
            if (is_array($decoded) && isset($decoded['refresh_token']) && is_string($decoded['refresh_token'])) {
                return trim($decoded['refresh_token']);
            }
        }

        return $trimmed !== '' ? $trimmed : null;
    }

    private function extractErrorFromBody(?string $body): array
    {
        if (!$body) {
            return [];
        }

        $decoded = json_decode($body, true);
        if (!is_array($decoded)) {
            return [];
        }

        return [
            'error' => $decoded['error'] ?? null,
            'description' => $decoded['error_description'] ?? null,
        ];
    }

    public function getLastError(): ?string
    {
        return $this->lastError;
    }

    /**
     * Build a Gmail message object
     */
    private function buildMessage(string $to, string $subject, string $body, User $user): Gmail\Message
    {
        $from = $user->gmail_provider_email ?? config('mail.from.address');

        // Build Symfony Email
        $email = (new \Symfony\Component\Mime\Email())
            ->from($from)
            ->to($to)
            ->subject($subject);

        // Add Plain Text Alternative for rich structure trust
        $email->text(trim(preg_replace('/\s+/', ' ', strip_tags($body))));

        // Convert any data:image base64 inline images to CID attachments for Gmail compatibility

        $body = preg_replace_callback(
            '/<img\s+([^>]*?)src="data:image\/(png|jpeg|gif);base64,([^"]+)"([^>]*?)\/?>/i',
            function ($matches) use ($email) {
                $type = $matches[2]; // png, jpeg, etc.
                $base64 = $matches[3];
                // Clean up whitespace to avoid multiple spaces
                $attributesBefore = rtrim($matches[1]);
                $attributesAfter = trim($matches[4]);

                $cid = 'ii_' . substr(md5($base64), 0, 16) . '@gmail.com'; // Mimic native Gmail inline ID
    
                $filename = 'qr_code';
                if (preg_match('/alt="([^"]+)"/i', $attributesBefore . ' ' . $attributesAfter, $altMatches)) {
                    $filename = $altMatches[1];
                }

                // Use DataPart with custom Content-ID to bypass fragile random hashes
                $part = new \Symfony\Component\Mime\Part\DataPart(base64_decode($base64), $filename . '.' . $type, 'image/' . $type);
                $part->setContentId($cid);
                $part->asInline();

                $email->addPart($part);

                // Reconstruct the tag with CID source
                return '<img ' . ($attributesBefore ? $attributesBefore . ' ' : '') . 'src="cid:' . $cid . '"' . ($attributesAfter ? ' ' . $attributesAfter : '') . ' />';
            },
            $body
        );


        $email->html($body);

        $emailString = $email->toString();

        // Convert to Gmail message format
        $rawMessage = $this->encodeMessage($emailString);



        $message = new Gmail\Message();
        $message->setRaw($rawMessage);

        return $message;
    }


    /**
     * Encode message for Gmail API (base64url)
     */
    private function encodeMessage(string $message): string
    {
        return rtrim(strtr(base64_encode($message), '+/', '-_'), '=');
    }
}
