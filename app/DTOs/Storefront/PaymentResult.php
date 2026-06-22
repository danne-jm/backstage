<?php

namespace App\DTOs\Storefront;

class PaymentResult
{
    /**
     * @param  array<string, mixed>  $metadata
     */
    public function __construct(
        public readonly string $status,
        public readonly ?string $paymentId = null,
        public readonly ?string $checkoutUrl = null,
        public readonly ?string $message = null,
        public readonly ?string $errorCode = null,
        public readonly array $metadata = []
    ) {}
}
