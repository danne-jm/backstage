<?php

namespace App\Services\Mail;

use App\Contracts\EmailTransportInterface;
use App\Models\User;
use Google\Client;
use Google\Service\Gmail;
use Google\Service\Gmail\Message;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Mime\Email;

class GmailOAuthEmailTransport implements EmailTransportInterface
{
    protected User $sender;

    public function __construct(User $sender)
    {
        $this->sender = $sender;

        if (empty($this->sender->gmail_refresh_token)) {
            throw new \InvalidArgumentException("User {$this->sender->email} does not have a Gmail OAuth token connected.");
        }
    }

    public function send(string $to, string $subject, string $htmlBody, array $attachments = [], array $inlineEmbeds = []): bool
    {
        try {
            // 1. Initialize Google Client
            $client = new Client;
            $client->setClientId(config('services.google.client_id'));
            $client->setClientSecret(config('services.google.client_secret'));
            $client->refreshToken($this->sender->gmail_refresh_token);

            // 2. Initialize Gmail Service
            $service = new Gmail($client);

            // 3. Construct raw MIME message using symfony/mime
            $email = (new Email)
                ->from($this->sender->gmail_provider_email ?? $this->sender->email)
                ->to($to)
                ->subject($subject)
                ->html($htmlBody);

            foreach ($attachments as $attachment) {
                if (file_exists($attachment)) {
                    $email->attachFromPath($attachment);
                }
            }

            foreach ($inlineEmbeds as $name => $content) {
                $email->embed($content, $name, 'image/png');
            }

            // Generate raw message string and encode to base64url
            $rawMessageString = $email->toString();
            $rawMessage = rtrim(strtr(base64_encode($rawMessageString), '+/', '-_'), '=');

            // 4. Send via API
            $message = new Message;
            $message->setRaw($rawMessage);
            $service->users_messages->send('me', $message);

            return true;

        } catch (\Exception $e) {
            Log::error("Gmail OAuth Email failed to send to {$to}: ".$e->getMessage());

            return false;
        }
    }
}
