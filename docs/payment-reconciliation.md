# Payment Reconciliation System

## Overview

The payment reconciliation system provides a safety net for handling payment failures when your Raspberry Pi server goes offline during the checkout process. It addresses the "distributed system" problem where a user successfully pays on SumUp's servers, but your local database doesn't get updated due to server downtime, network issues, or webhook failures.

## The Problem

When a user checks out:

1. **User Checkout**: Your Pi creates a transaction (STATUS_PENDING) and redirects the user to SumUp
2. **Server Crash**: Your Pi goes offline (OOM/crash/network issue)
3. **Payment Success**: The user pays successfully on SumUp's servers (which are still online)
4. **Redirect Failure**: SumUp tries to redirect back to `/payment/callback`, but your Pi is offline
5. **Webhook Failure**: SumUp tries to send a webhook to `/payment/webhook`, but your Pi is offline
6. **Result**: You have money in your SumUp account, but your database still says PENDING

## The Solution: Dual Safety Net

### 1. Primary: SumUp Webhook Retries (Push)

SumUp automatically retries webhooks for up to 24 hours with exponential backoff:
- T+0m: Webhook fails (Pi is offline)
- T+1m: SumUp retries
- T+1.1m: SumUp retries again (if Pi is back online, this succeeds)

**Retry Schedule**: ~1 minute, 5 minutes, 20 minutes, then 2 hours

### 2. Secondary: Scheduled Reconciliation Command (Pull)

The `payments:verify-pending` command runs every 15 minutes as a failsafe:

```bash
php artisan payments:verify-pending
```

This command:
- Finds transactions with `payment_status = 'pending'` that are older than 15 minutes
- Must have an `external_payment_id` (checkout was created)
- Calls SumUp API to check the actual payment status
- Updates the database accordingly
- Releases stock for failed/expired payments

## Why Both?

| Scenario | Webhook Retry (Push) | Scheduled Command (Pull) |
|----------|---------------------|--------------------------|
| Server Offline (1 min) | ✅ Fixes it (Retries succeed) | ⚠️ Late (Fixes it 15m later) |
| Cloudflare Error | ❌ Fails (Cloudflare might block) | ✅ Fixes it |
| Tunnel ID Change | ❌ Fails (Wrong URL) | ✅ Fixes it |
| Max Retries Exceeded | ❌ Fails (~4 hours) | ✅ Fixes it (Even days later) |

**Webhooks (Push)**: Rely on SumUp reaching YOUR server (Ingress)
**Scheduled Command (Pull)**: Rely on YOU reaching SumUp's servers (Egress)

Since your Raspberry Pi is behind Cloudflare Tunnel on residential internet, **Egress is more reliable than Ingress**.

## Implementation

### Command

File: `app/Console/Commands/VerifyPendingPayments.php`

```bash
# Run manually
php artisan payments:verify-pending

# Run with custom age threshold (default is 15 minutes)
php artisan payments:verify-pending --min-age=10
```

### Scheduled Execution

File: `routes/console.php`

```php
Schedule::command('payments:verify-pending')->everyFifteenMinutes();
```

To enable the scheduler, ensure your cron is configured:

```bash
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1
```

Or use Laravel Horizon/Supervisor for the queue worker which includes scheduling.

### What It Does

For each stale pending transaction:

1. **Queries SumUp**: Calls `GET /v0.1/checkouts/{checkout_id}` to check status
2. **Status Mapping**:
   - `PAID` → Updates transaction to `completed`, sends confirmation email
   - `FAILED`/`EXPIRED` → Updates to `failed`, **releases reserved stock**
   - `PENDING` → Leaves as pending (user might still be paying)
3. **Stock Release**: Decrements `sold_count` for products/events when payment fails
4. **Logging**: Records all reconciliation activity for audit

## Testing

Run the test suite:

```bash
php artisan test --filter=PaymentReconciliation
```

Tests cover:
- Ignoring recent transactions (< 15 minutes)
- Successful payment reconciliation
- Failed payment with stock release
- Event ticket stock release
- Multiple transactions in one run
- Custom age thresholds
- Skipping transactions without external payment IDs

## Monitoring

Check the logs for reconciliation activity:

```bash
# View recent log entries
php artisan pail

# Filter for reconciliation
grep "Payment reconciliation" storage/logs/laravel.log
```

Log entries include:
- Number of transactions checked
- Confirmed payments
- Failed payments
- Exceptions/errors

## Manual Recovery

If you need to manually trigger reconciliation:

```bash
# Check all pending transactions older than 5 minutes
php artisan payments:verify-pending --min-age=5

# View detailed output
php artisan payments:verify-pending -v
```

## Important Notes

1. **Minimum Age**: Default 15 minutes prevents checking transactions that are actively being paid
2. **External Payment ID Required**: Transactions must have reached SumUp (have a checkout ID)
3. **Stock Safety**: Stock is only released when payment definitively fails (not for pending)
4. **Idempotent**: Safe to run multiple times - won't double-process transactions

## Future Enhancements

Potential improvements:
- Email notifications when reconciliation fixes a payment
- Admin dashboard showing reconciled transactions
- Metrics/alerting for high reconciliation rates
- Retry limits for permanently failed webhooks
