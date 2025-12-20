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
        $refreshTokenEncrypted = $user->gmail_refresh_token ?? null;
        if (! $refreshTokenEncrypted) {
            throw new \RuntimeException('User has not connected Gmail.');
        }

        $refreshToken = decrypt($refreshTokenEncrypted);

        // Prepare client
        $client = $this->googleClient;
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessType('offline');
        $client->setScopes(['https://www.googleapis.com/auth/gmail.send']);

        // Provide the refresh token and refresh to get a valid access token
        $client->refreshToken($refreshToken);

        $service = new GmailService($client);

        // Build a Symfony Email and render to raw RFC-2822 string
        $email = (new Email)
            ->from($user->email)
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
            $service->users_messages->send('me', $gmailMessage);

            return true;
        } catch (\Throwable $e) {
            $this->logger->error('GmailSender send failed: '.$e->getMessage(), ['user_id' => $user->id]);

            return false;
        }
    }
}
