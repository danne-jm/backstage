<?php

namespace App\Services;

use App\Models\User;
use Google\Client;
use Google\Service\Gmail;
use Illuminate\Support\Facades\Log;
use Swift_Message;

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

    public function __construct()
    {
        $this->googleClient = new Client();
        $this->googleClient->setApplicationName('Backstage Email Distributor');
        $this->googleClient->setClientId(config('services.google.client_id'));
        $this->googleClient->setClientSecret(config('services.google.client_secret'));
        $this->googleClient->setScopes([
            'https://www.googleapis.com/auth/gmail.send',
        ]);
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
        if (!$user->gmail_refresh_token) {
            return false;
        }

        try {
            // Set the refresh token
            $this->googleClient->setRefreshToken($user->gmail_refresh_token);

            // Get a fresh access token
            $accessToken = $this->googleClient->fetchAccessTokenWithRefreshToken();

            if (isset($accessToken['access_token'])) {
                $this->googleClient->setAccessToken($accessToken);
                return true;
            }

            Log::warning('GmailSenderService: No access token in response', [
                'user_id' => $user->id,
            ]);
            return false;
        } catch (\Throwable $e) {
            Log::error('GmailSenderService: Token refresh failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Build a Gmail message object
     */
    private function buildMessage(string $to, string $subject, string $body, User $user): Gmail\Message
    {
        $from = $user->gmail_provider_email ?? config('mail.from.address');
        
        // Create a Swift message
        $swiftMessage = new Swift_Message();
        $swiftMessage
            ->setSubject($subject)
            ->setFrom($from)
            ->setTo($to)
            ->setBody($body, 'text/html');

        // Convert to Gmail message format
        $rawMessage = $this->encodeMessage($swiftMessage);

        $message = new Gmail\Message();
        $message->setRaw($rawMessage);

        return $message;
    }

    /**
     * Encode message for Gmail API
     */
    private function encodeMessage(Swift_Message $message): string
    {
        return rtrim(strtr(base64_encode($message->toString()), '+/', '-_'), '=');
    }
}
