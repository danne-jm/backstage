<?php

namespace App\Services;

class EmailVerificationService
{
    /**
     * Verify an email address.
     * Returns an array with results for each stage.
     */
    public function verify(string $email): array
    {
        $email = trim($email);

        // 1. Syntax Check
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                'valid' => false,
                'reason' => 'Invalid syntax',
                'stage' => 'syntax'
            ];
        }

        // 2. DNS Check
        $domain = substr(strrchr($email, "@"), 1);
        if (!checkdnsrr($domain, 'MX')) {
            // Check for A record as a fallback (some servers accept mail via A record)
            if (!checkdnsrr($domain, 'A')) {
                return [
                    'valid' => false,
                    'reason' => 'Domain has no MX or A records',
                    'stage' => 'dns'
                ];
            }
        }

        return [
            'valid' => true,
            'reason' => 'Valid syntax and DNS records found',
            'stage' => 'dns'
        ];
    }
}
