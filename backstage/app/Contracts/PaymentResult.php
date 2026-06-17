<?php

namespace App\Contracts;

/**
 * Payment Result Data Transfer Object
 *
 * Represents the result of a payment gateway operation.
 */
class PaymentResult
{
    public const STATUS_PENDING = 'pending';

    public const STATUS_PROCESSING = 'processing';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_REFUNDED = 'refunded';

    public function __construct(
        public readonly string $status,
        public readonly ?string $paymentId = null,
        public readonly ?string $checkoutUrl = null,
        public readonly ?string $message = null,
        public readonly ?string $errorCode = null,
        public readonly array $metadata = [],
    ) {}

    /**
     * Check if the payment was successful.
     */
    public function isSuccessful(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if the payment is still pending.
     */
    public function isPending(): bool
    {
        return in_array($this->status, [self::STATUS_PENDING, self::STATUS_PROCESSING]);
    }

    /**
     * Check if the payment failed.
     */
    public function isFailed(): bool
    {
        return in_array($this->status, [self::STATUS_FAILED, self::STATUS_CANCELLED]);
    }

    /**
     * Create a successful result.
     */
    public static function success(?string $paymentId = null, ?string $message = null, array $metadata = []): self
    {
        return new self(
            status: self::STATUS_COMPLETED,
            paymentId: $paymentId,
            message: $message,
            metadata: $metadata,
        );
    }

    /**
     * Create a pending result with checkout URL.
     */
    public static function pending(string $paymentId, ?string $checkoutUrl = null, array $metadata = []): self
    {
        return new self(
            status: self::STATUS_PENDING,
            paymentId: $paymentId,
            checkoutUrl: $checkoutUrl,
            metadata: $metadata,
        );
    }

    /**
     * Create a failed result.
     */
    public static function failed(?string $message = null, ?string $errorCode = null, array $metadata = []): self
    {
        return new self(
            status: self::STATUS_FAILED,
            message: $message,
            errorCode: $errorCode,
            metadata: $metadata,
        );
    }

    /**
     * Convert to array for JSON responses.
     */
    public function toArray(): array
    {
        return [
            'status' => $this->status,
            'payment_id' => $this->paymentId,
            'checkout_url' => $this->checkoutUrl,
            'message' => $this->message,
            'error_code' => $this->errorCode,
            'metadata' => $this->metadata,
        ];
    }
}
