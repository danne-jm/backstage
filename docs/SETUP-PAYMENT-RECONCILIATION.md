# 🚀 Quick Setup: Payment Reconciliation System

## ⚡ TL;DR - What You Need to Do

**Your payment reconciliation command is NOT running yet.** You need to set up the Laravel scheduler.

### Option 1: Automatic Setup (Recommended)
```bash
./scripts/setup-scheduler.sh
```

### Option 2: Manual Setup
```bash
crontab -e
```
Add this line:
```
* * * * * cd /path/to/your/project && php artisan schedule:run >> /dev/null 2>&1
```

### Verify It's Working
```bash
# Check scheduled tasks
php artisan schedule:list

# Test manually
php artisan payments:verify-pending

# Watch logs
tail -f storage/logs/laravel.log | grep "Payment reconciliation"
```

---

## 📋 What Was Fixed

### ✅ 1. Hardcoded Processing Fee → Configuration File
**Before:**
```php
$processingFee = round($subtotal * 0.02, 2); // Hardcoded!
```

**After:**
```php
$processingFee = round($subtotal * config('services.sumup.processing_fee_rate', 0.02), 2);
```

**To change fee rate:**
```env
# .env
SUMUP_PROCESSING_FEE_RATE=0.0169
```

---

### ⚠️ 2. 15-Minute Stock Hold → Documented & Configurable
**What happens:**
- User starts checkout → stock decremented
- User abandons SumUp screen → stock held for 15 minutes
- Reconciliation runs → stock released if payment failed

**Why this design:**
- Prevents overselling on Raspberry Pi
- Safer when server might go offline
- Simple reconciliation logic

**How to tune:**
```php
// routes/console.php

// Default (standard events)
Schedule::command('payments:verify-pending')->everyFifteenMinutes();

// High-demand events (faster stock release)
Schedule::command('payments:verify-pending')->everyTenMinutes();

// Aggressive (minimum safe value)
Schedule::command('payments:verify-pending')->everyFiveMinutes();

// ❌ NEVER < 5 minutes (risks false failures)
```

---

### ✅ 3. Race Condition Protection → Already Implemented
**Protection mechanism:**
```php
// Uses SELECT ... FOR UPDATE during checkout
DB::transaction(function () {
    $allocation = $this->allocator->allocate($items, $codes, true); // ← useLock = true
    // ...
});
```

**What this prevents:**
- Two users buying the last item simultaneously
- Stock overselling during concurrent checkouts
- TOCTOU (Time-of-Check-Time-of-Use) vulnerabilities

**Verified by tests:**
```bash
php artisan test --filter=RaceCondition
# ✓ All 3 tests pass
```

---

### ✅ 4. Memory Optimization → Bot Attack Protection
**Protection mechanism:**
```php
// Processes transactions in batches of 100
OnlineTransaction::with('sales')
    ->where(/* ... */)
    ->chunk(100, function ($staleTransactions) {
        // Process each batch
    });
```

**What this prevents:**
- OOM (Out of Memory) killer on Raspberry Pi
- RAM exhaustion from bot attacks creating thousands of pending transactions
- System crashes when processing large reconciliation runs

**Why this matters:**
- Raspberry Pi has limited RAM (~4GB usable)
- If a bot creates 5,000 pending transactions, `get()` would load all into memory
- Chunking processes 100 at a time, keeping memory usage constant

**Trade-off:**
- Slightly slower for massive datasets (batched queries)
- But prevents complete system crash
- Better to be slow than dead

---

## 🔍 Is This Normal for Laravel?

**Yes!** Laravel's scheduler is the standard way to run recurring tasks.

### How It Works
```
System Cron (every minute)
  ↓
php artisan schedule:run
  ↓
Laravel's internal scheduler
  ↓
payments:verify-pending (every 15 min)
```

### Comparison with Other Frameworks

| Framework | Scheduler Type | Needs Cron? |
|-----------|---------------|-------------|
| **Laravel** | External (system cron) | ✅ Yes |
| Spring Boot | Internal (`@Scheduled`) | ❌ No (app must run 24/7) |
| Express | Internal (`node-cron`) | ❌ No (app must run 24/7) |
| Django | Both (Celery Beat or crontab) | ⚠️ Depends |

**Why Laravel uses cron:**
- PHP is request-based (not a long-running process)
- More robust on Raspberry Pi (auto-restarts after crash)
- Industry standard for PHP applications

---

## 📊 Test Results

All improvements have comprehensive test coverage:

```bash
php artisan test --filter="PaymentGateway|PaymentReconciliation|RaceCondition"
```

**Results:**
```
✓ PaymentGatewayTest .............. 21 tests
✓ PaymentReconciliationTest ....... 7 tests
✓ RaceConditionTest ............... 3 tests

Tests:    31 passed (93 assertions)
Duration: 1.95s
```

---

## 🎯 Action Items

### Required (Right Now)
- [ ] Run `./scripts/setup-scheduler.sh` to configure cron
- [ ] Verify scheduler is running: `php artisan schedule:list`
- [ ] Test reconciliation: `php artisan payments:verify-pending`

### Optional (Later)
- [ ] Update `.env` if SumUp changes fee rate
- [ ] Tune reconciliation frequency for high-demand events
- [ ] Monitor logs for first week: `tail -f storage/logs/laravel.log`

### Future Enhancements
- [ ] Admin dashboard for reconciliation metrics
- [ ] Email alerts when reconciliation fixes payments
- [ ] Automated stock release monitoring

---

## 📚 Documentation

Detailed documentation available:
- `docs/payment-reconciliation.md` - Full system overview
- `docs/security-improvements.md` - Detailed fix descriptions
- `scripts/setup-scheduler.sh` - Automated setup script

---

## ❓ FAQ

**Q: Is the backup verify-payment command running on my system?**
**A:** No, not yet. You must set up the cron job (see above).

**Q: How do I know if it's working?**
**A:** 
```bash
# Check scheduled tasks
php artisan schedule:list

# Watch for reconciliation in logs
tail -f storage/logs/laravel.log | grep "Payment reconciliation"
```

**Q: Can I change the 15-minute interval?**
**A:** Yes! Edit `routes/console.php` and change `everyFifteenMinutes()` to `everyTenMinutes()` or `everyFiveMinutes()`. Never go below 5 minutes.

**Q: What if I don't set up the cron job?**
**A:** The reconciliation command won't run automatically. Stale pending transactions won't be checked, and stock won't be released from failed payments.

**Q: Is this safe for production?**
**A:** Yes! All changes are:
- ✅ Backwards compatible
- ✅ Fully tested (31 tests pass)
- ✅ Code-formatted with Laravel Pint
- ✅ Well-documented

---

## 🆘 Troubleshooting

**Cron not running?**
```bash
# Check cron logs
sudo grep CRON /var/log/syslog

# Verify Laravel logs are being written
ls -la storage/logs/
```

**Scheduler not executing?**
```bash
# Run manually to see errors
php artisan schedule:run

# Check for specific task
php artisan schedule:list | grep payments
```

**Still having issues?**
Check the detailed documentation in `docs/security-improvements.md` or reach out for support.

---

**Created:** January 25, 2026  
**Status:** ✅ Ready for Production  
**Breaking Changes:** None
