<?php

namespace App\Services;

use Google\Client as GoogleClient;
use Google\Service\Gmail as GmailService;
use Google\Service\Gmail\Message as GmailMessage;
use Illuminate\Contracts\Auth\Authenticatable as UserContract;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mime\Email;

class GmailSender
{
    public function __construct(protected GoogleClient $googleClient, protected LoggerInterface $logger) {}

    /**
     * Send an HTML email as the given user using Gmail API.
     * The user's gmail_refresh_token must be encrypted in the DB and accessible via $user->gmail_refresh_token.
     */
    public function sendHtmlAsUser(UserContract $user, string $toEmail, string $subject, string $htmlBody, ?string $toName = null): bool
    {
        $this->logger->info('GmailSender: Attempting to send email', [
            'user_id' => $user->id,
            'user_email' => $user->email,
            'to' => $toEmail,
            'subject' => $subject,
        ]);

        $refreshTokenEncrypted = $user->gmail_refresh_token ?? null;
        if (! $refreshTokenEncrypted) {
            $this->logger->error('GmailSender: User has no gmail_refresh_token', ['user_id' => $user->id]);
            throw new \RuntimeException('User has not connected Gmail.');
        }

        $this->logger->info('GmailSender: Refresh token found, decrypting...', ['user_id' => $user->id]);

        try {
            $refreshToken = decrypt($refreshTokenEncrypted);
            $this->logger->info('GmailSender: Refresh token decrypted successfully', ['user_id' => $user->id]);
        } catch (\Throwable $e) {
            $this->logger->error('GmailSender: Failed to decrypt refresh token', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }

        // Prepare client
        $client = $this->googleClient;
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessType('offline');
        $client->setScopes(['https://www.googleapis.com/auth/gmail.send']);

        $this->logger->info('GmailSender: Google client configured, refreshing token...', ['user_id' => $user->id]);

        // Provide the refresh token and refresh to get a valid access token
        try {
            $token = $client->refreshToken($refreshToken);
            
            // CHECK: Did Google rotate the refresh token?
            if (isset($token['refresh_token']) && $token['refresh_token'] !== $refreshToken) {
                $this->logger->info('GmailSender: New refresh token received, updating user record', ['user_id' => $user->id]);
                $user->forceFill([
                    'gmail_refresh_token' => encrypt($token['refresh_token']),
                ])->save();
            }

            $this->logger->info('GmailSender: Access token refreshed successfully', ['user_id' => $user->id]);
        } catch (\Throwable $e) {
            $this->logger->error('GmailSender: Failed to refresh access token', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }

        $service = new GmailService($client);

        // Use the Gmail OAuth provider email (actual Google account) as sender, not the platform email
        $senderEmail = $user->gmail_provider_email ?? $user->email;

        // Build a Symfony Email and render to raw RFC-2822 string
        $email = (new Email)
            ->from($senderEmail)
            ->to($toEmail)
            ->subject($subject)
            ->html($htmlBody);

        if ($toName) {
            $email->to(new \Symfony\Component\Mime\Address($toEmail, $toName));
        }

        $raw = $email->toString();

        // Gmail expects base64url encoded string without padding
        $rawEncoded = rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');

        $gmailMessage = new GmailMessage;
        $gmailMessage->setRaw($rawEncoded);

        try {
            $this->logger->info('GmailSender: Sending email via Gmail API...', ['user_id' => $user->id, 'to' => $toEmail]);
            $service->users_messages->send('me', $gmailMessage);
            $this->logger->info('GmailSender: Email sent successfully via Gmail API', ['user_id' => $user->id, 'to' => $toEmail]);

            return true;
        } catch (\Throwable $e) {
            $this->logger->error('GmailSender send failed: '.$e->getMessage(), [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }
}
