# Backstage — Backend Architecture Walkthrough

## 1. System Overview

**Backstage** is an internal operations platform for **ESN Leuven** (Erasmus Student Network). It manages product/event sales (office POS + online store), ticket scanning, email distribution, inventory tracking, financial ledger, and user/permission management. This organization membership discount cards are called "ESNcards". However, this project should not be tailred specifically to this organization. ESN Leuven and ESNcard are just examples of how this platform could be used. Don't hard code those exact names.

### Tech Stack

| Layer         | Technology                                                 |
| ------------- | ---------------------------------------------------------- |
| Framework     | Laravel 12 (PHP 8.2+)                                      |
| Frontend      | React + Inertia.js (SSR-capable)                           |
| Database      | SQLite (dev) — **target: PostgreSQL**                      |
| Queue         | Database driver — **target: Redis**                        |
| Cache         | Database driver — **target: Redis**                        |
| Session       | Database driver                                            |
| Media         | Spatie Media Library (local disk)                          |
| Auth          | Laravel Fortify (session-based) + Socialite (Google OAuth) |
| Activity Log  | Spatie Activity Log                                        |
| Payments      | SumUp API                                                  |
| External APIs | Google Sheets API, Gmail API, ESNcard API                  |

### Dual-Domain Architecture

The app serves two domains from one codebase via `HandleInertiaRequests` middleware:

| Domain                  | Purpose                                 | Auth Required |
| ----------------------- | --------------------------------------- | ------------- |
| `backstage.example.com` | Admin panel (POS, management, settings) | Yes           |
| `store.example.com`     | Public online shop (browse, checkout)   | No            |

The middleware switches the Blade root view (`backstage` vs `store`) and shared Inertia props based on the request host.

---

## 2. Data Model Reference

### 2.1 User

| Attribute                        | Type       | Notes                                    |
| -------------------------------- | ---------- | ---------------------------------------- |
| id                               | ULID       | Primary key                              |
| first_name, last_name            | string     |                                          |
| email                            | string     | Unique                                   |
| password_hash                    | hashed     | Custom auth password name                |
| role                             | string     | Cosmetic role label                        |
| permission                       | string     | Cosmetic permission label                  |
| is_locked                        | boolean    | Blocks login when true                     |
| gmail_provider_id                | string     | Google OAuth ID                            |
| gmail_provider_email             | string     | Connected Google email                     |
| gmail_refresh_token              | string     | For Gmail/Sheets API                       |
| pinned                           | JSON array | Sidebar links (defaults provided)          |
| last_seen_at                     | datetime   |                                            |
| two_factor_secret/recovery_codes | encrypted  | Fortify 2FA                                |

**Traits:** `HasFactory`, `Notifiable`, `TwoFactorAuthenticatable`, `HasRoles` (Spatie), `HasUlids`, `LogsActivity`

> **Note:** Actual RBAC is handled relationally via `spatie/laravel-permission` (`HasRoles` trait).

### 2.2 ✅ Sellable (Abstract) -> Refactored to `Purchasable` Interface + Traits

> **Refactor Target:** Transition from Inheritance to Composition. Replace this abstract base class with a `Purchasable` interface and specific traits (`HasVariants`, `HasStockPools`, `HasESNCardPricing`) to avoid bloated God-models and logic leakage between Events and Products.

Base class for `Event` and `Product`. Uses polymorphic variants.

| Attribute                                   | Type    | Notes                                   |
| ------------------------------------------- | ------- | --------------------------------------- |
| name, description                           | string  |                                         |
| variants_config                             | JSON    | Frontend variant selector config        |
| is_variant_based                            | boolean |                                         |
| quantity                                    | integer | Universal stock pool (null = unlimited) |
| unlimited_quantity                          | boolean |                                         |
| quantity_with_card / without_card           | integer | Split stock pools for ESNcard pricing   |
| unlimited_quantity_with_card / without_card | boolean |                                         |
| variable_amount                             | boolean | Enables ESNcard dual-pricing mode       |
| is_online_sellable                          | boolean | Show in public store                    |
| hide_until_sale                             | boolean | Hide until start_sell_date              |
| instagram_link                              | string  |                                         |

**Traits:** `HasFactory`, `InteractsWithMedia`, `HasSellableStock`, `HasUlids`, `LogsActivity`

**Relationships:** `variants()` (morphMany → SellableVariant), `sales()` (hasMany → OfficeShiftSale), `onlineSales()` (hasMany → OnlineSale), `tickets()` (hasMany → Ticket)

**Stock logic:** `checkHasStock()`, `computedSoldCount()` — overridden by Event/Product with cache-backed live counting.

### 2.3 ✅ Event (implements Purchasable)

| Extra Attribute                 | Type     | Notes                                   |
| ------------------------------- | -------- | --------------------------------------- |
| event_date                      | datetime |                                         |
| price_with_membership / without | decimal  | Membership vs regular price             |
| start_sell_date / end_sell_date | datetime | Sale window                             |
| google_spreadsheet_id           | string   | Attendee sheet link                     |
| google_sheet_name               | string   |                                         |
| attendee_filter_config          | JSON     | Column filter rules                     |
| responsible_user_ids            | JSON     |                                         |

**Stock methods:** Legacy 30-second Cache logic deprecated. Replaced by `HasStockPools` trait utilizing the `inventory_movements` ledger for real-time accurate atomic counts.

### 2.4 ✅ Product (implements Purchasable)

| Extra Attribute                 | Type     | Notes        |
| ------------------------------- | -------- | ------------ |
| price                           | decimal  | Base price   |
| price_with_membership / without | decimal  |              |
| member_price                    | decimal  | Legacy field |
| start_sell_date / end_sell_date | datetime |              |
| responsible_user_ids            | JSON     |              |

**Stock methods:** Same real-time ledger logic as Event via `HasStockPools`.

### 2.5 ✅ Variant (formerly SellableVariant)

| Attribute                      | Type        | Notes                                 |
| ------------------------------ | ----------- | ------------------------------------- |
| id                             | ULID        |                                       |
| purchasable_id / type          | polymorphic | → Event or Product                    |
| options                        | JSON        | e.g. `{"size": "M", "color": "blue"}` |
| quantity                       | integer     | null = unlimited                      |

**Stock:** Migrating to `inventory_movements` ledger counting.

### 2.6 ✅ Transaction (Unified Order)

Replaces `OnlineTransaction` and aggregates physical POS sales.

| Attribute                       | Type     | Notes                                                         |
| ------------------------------- | -------- | ------------------------------------------------------------- |
| id                              | ULID     |                                                               |
| channel                         | string   | `online`, `pos`                                               |
| status                          | string   | `pending`, `completed`, `failed`, `refunded`                  |
| office_shift_id                 | FK       | Nullable. Strictly for `pos` channel.                         |
| customer_email                  | string   | Nullable (required for online)                                |
| total_amount / discount_total   | decimal  |                                                               |
| payment_method                  | string   | `sumup_online`, `pos_card`, `pos_cash`                        |
| external_payment_id             | string   | Gateway reference (e.g. SumUp checkout ID)                    |
| cash_tendered_amount            | decimal  | POS Cash: exact amount handed by customer                     |
| cash_change_amount              | decimal  | POS Cash: exact amount handed back                            |
| cash_tendered_breakdown         | JSON     | POS Cash: exact bills/coins handed by customer                |
| cash_change_breakdown           | JSON     | POS Cash: exact bills/coins handed back                       |
| completed_at                    | datetime |                                                               |

### 2.7 ✅ Sale (Order Line Item)

Replaces both `OfficeShiftSale` and `OnlineSale`. 

| Attribute             | Type        | Notes                                                              |
| --------------------- | ----------- | ------------------------------------------------------------------ |
| id                    | ULID        |                                                                    |
| transaction_id        | FK          | → Transaction                                                      |
| purchasable_id / type | polymorphic | → Event or Product                                                 |
| variant_id            | FK          | Nullable → Variant                                                 |
| unit_price / quantity | decimal/int |                                                                    |
| subtotal              | decimal     | `unit_price * quantity`                                            |
| ticket_type           | string      | `with_membership` or `regular`                                     |
| snapshot              | JSON        | Immutable snapshot (name, options selected at time of sale)        |
| discount_code_used    | string      | Nullable                                                           |

### 2.8 ✅ OfficeShift (Cash Drawer Reconciliation)

Strictly for physical worker drawer tracking. Online sales bypass this.

| Attribute                   | Type      | Notes                                                       |
| --------------------------- | --------- | ----------------------------------------------------------- |
| id                          | ULID      |                                                             |
| started_by / ended_by       | FK → User |                                                             |
| started_at / ended_at       | datetime  |                                                             |
| status                      | string    | `open` or `closed`                                          |
| start_cash_breakdown        | JSON      | Opening float (exact bills/coins)                           |
| expected_cash_total         | decimal   | Dynamically derived: `start_cash` + `tendered` - `change`   |
| end_of_shift_cash_breakdown | JSON      | Final manually counted breakdown                            |
| discrepancy_amount          | decimal   | Difference between expected and actual end of shift         |
| notes                       | text      |                                                             |

### 2.10 Other Models

| Model                    | Purpose                       | Key Fields                                                                                          |
| ------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------- |
| **Ticket**               | QR-code event tickets         | event_id, ticket_code, email, first/last_name, scan_count, scan_details (JSON), scanned_at          |
| **Item**                 | Physical inventory items      | name, quantity, category (JSON), image via Media Library                                            |
| **Mail**                 | Email send log                | event_id, user_id, recipient_email, subject, body, success, error_message                           |
| **DiscountUsage**        | ESNcard discount tracking     | code, online_transaction_id, online_sale_id, product/event_id, original/paid/saved amounts          |
| **FinancialLedgerEntry** | Double-entry accounting       | entry_type, direction (credit/debit), amount, channel, payment_method, idempotency_key, source refs |
| **OfficeShiftWorker**    | Shift staffing                | office_shift_id, user_id, role                                                                      |
| **Media**                | Spatie Media Library override | Uses ULIDs                                                                                          |

---

## 3. Service Layer

### 3.1 ✅ CheckoutService (Refactored to Action Pattern)

**Core flow:** `initiateCheckout(cart, email, codes)` →

1. Builds demand array from cart items
2. Calls `DiscountAllocator::allocate()` for ESNcard code validation
3. Pre-flight stock checks (non-locking)
4. Creates `OnlineTransaction` (pending)
5. Creates `OnlineSale` rows
6. Locks rows + verifies stock (`updateStockCounts`) — pessimistic locking
7. Tracks discount usage
8. Creates payment via `PaymentGatewayInterface`

**Other methods:** `verifyPayment()`, `handleWebhook()`, `handleTransactionFailure()`, `dispatchConfirmationEmail()`, `revertDiscountUsagesForTransaction()`

**Money math:** Uses integer cents internally (`toCents()`, `calculateProcessingFeeCents()`) to avoid float errors.

> **Refactor Target:** This service violates the Single Responsibility Principle. Migrate to the **Action Pattern** (using invokable classes or `lorisleiva/laravel-actions`). Split this into discrete actions: `CalculateCartTotalsAction`, `AllocateDiscountsAction`, `ReserveStockAction`, `CreatePendingTransactionAction`, and `ProcessPaymentAction`, coordinated by a `CheckoutOrchestrator`.

### 3.2 ✅ SaleService (Refactored to Action Pattern)

Records office shift sales with full snapshot, variant resolution, stock validation.

**Key methods:** `recordOfficeSale()`, `claimStrayOnlineSales()` (links unattached online sales to current shift), `restoreStock()`, `createOfficeShiftSale()`, `resolveVariant()`

### 3.3 OfficeService (~250 lines) — Shift Management

**Methods:** `startShift()` (creates shift, claims orphaned online sales, adds worker), `endShift()`, `recordSale()`, `removeSale()`, `updateCashBreakdown()`, `updateSaleBreakdown()`, `updateSaleVariant()`, `syncTotals()`

### 3.4 DiscountAllocator (~230 lines) — ESNcard Discount Engine

Validates ESNcard codes via external API, checks usage history, allocates codes to cart units using FCFS strategy with rules:

- One code per item-type per session
- Code cannot be reused for same item globally
- Stock-aware (checks member-price pool availability)

### 3.5 FinancialLedgerService (~220 lines) — Append-Only Ledger

Creates idempotent double-entry records: `recordOnlineTransactionCompleted()`, `recordOfficeSale()`, `recordOnlineTransactionReversal()`, `recordOfficeSaleRemoved()`. All use `firstOrCreate` with idempotency keys.

### 3.6 Payment Gateway

**Interface:** `PaymentGatewayInterface` — `createPayment()`, `verifyPayment()`, `getPaymentStatus()`, `handleWebhook()`, `refund()`, `isWebhookSignatureValid()`

**Result DTO:** `PaymentResult` (status, paymentId, checkoutUrl, message, errorCode, metadata)

| Implementation              | Purpose                                                        |
| --------------------------- | -------------------------------------------------------------- |
| `SumUpPaymentGateway`       | Production — SumUp Checkout API with HMAC webhook verification |
| `DevelopmentPaymentGateway` | Dev — auto-completes payments immediately                      |

### 3.7 ✅ Email Services (Refactored to Adapter Pattern)

> **Refactor Target:** ✅ Implemented the **Adapter Pattern** (`EmailTransportInterface`) with `SmtpEmailTransport` for automated receipts and `GmailOAuthEmailTransport` (via `google/apiclient`) for bulk distributions, heavily relying on Queued Jobs to prevent rate limiting.

| Service / Job                          | Responsibility                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------- |
| `SendBulkDistributionEmailJob`         | Orchestrates batch email distribution via Gmail API on behalf of employee              |
| `SendOrderConfirmationJob`             | Sends automated SMTP receipt to buyers                                                 |
| `ProvisionTicketForEmailAction`        | Provisions the `Ticket` row and generates the QR code SVG via `BaconQrCode`            |

### 3.8 Other Services

| Service                   | Responsibility                                                                           |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `SellablesService`        | Normalizes input (unlimited/quantity semantics), syncs variants                          |
| ✅ `ScanTicketAction`    | **(Refactored)** QR ticket verification (atomic scan) with pessimistic locking to prevent double scans           |
| `AttendeeService`         | Reads Google Sheets attendee data, validates purchases against sales, email verification |
| `GoogleSheetsService`     | Google Sheets API wrapper (read, write, batch update, cell formatting)                   |
| `QrCodeGenerationService` | QR code generation with optional logo overlay                                            |
| `CustomQrPosterService`   | Generates QR poster images                                                               |
| `ESNcardService`          | Validates ESNcard numbers against external API (cached)                                  |

---

## 4. Authentication & Authorization Architecture

### 4.1 Authentication

**Provider:** Laravel Fortify (session-based, cookie auth)

**Enabled features:**

- ✅ Email/password login (rate-limited: 5/min per email+IP)
- ✅ Password reset
- ❌ Email verification
- ✅ Two-factor authentication (TOTP, with confirmation + password confirm)

**Google OAuth (Socialite):**

- **Login flow:** Guest → Google → match by `gmail_provider_id` → `Auth::login()`
- **Connect flow:** Authenticated user → Google → stores `gmail_provider_id`, `gmail_provider_email`, `gmail_refresh_token`
- Google is used for **login convenience** AND **Gmail/Sheets API access** (offline refresh token with `gmail.send` + `spreadsheets` scopes)

**Password storage:** Custom column name `password_hash` (via `getAuthPasswordName()` override), cast as `hashed`.

**Session:** Database driver, 120min lifetime.

### 4.2 Authorization

**Model:** Flat permission array stored as JSON on the User model.

```php
// User.permissions = ["view_dashboard", "view_inventory", "create_item", ...]
$user->hasPermission('view_dashboard'); // true/false
```

**Middleware:** `RequirePermission` — registered as `permission` alias.

```php
// Single permission
Route::get(...)->middleware('permission:view_inventory');

// OR logic (any one grants access)
Route::get(...)->middleware('permission:view_dashboard,view_store_manager');
```

**Account lockout:** `EnforceLockout` middleware — if `user.is_locked`, force logout + invalidate session. Locking a user in UsersController also deletes all their sessions from DB.

**There are no roles-based gates.** The `role` field is cosmetic. All access control is permission-array based.

### 4.3 Permissions Inventory

From route definitions, the system uses ~30+ granular permissions:

`view_dashboard`, `view_inventory`, `create_item`, `update_item`, `delete_item`, `view_sellables`, `create_product`, `update_product`, `delete_product`, `create_event`, `update_event`, `delete_event`, `view_event_attendees`, `update_event_attendee`, `update_event_attendee_config`, `view_office`, `manage_office`, `record_sale`, `manage_sale`, `view_online_sales`, `manage_online_sales`, `view_ticket_scanner`, `import_tickets`, `scan_tickets`, `view_email_distributor`, `send_emails`, `view_store_manager`, `view_audit_log`, `view_settings_*`, `update_settings_*`, `create_user`, `update_user`, `delete_user`, `delete_account`

---

## 5. Queue, Events & Scheduled Tasks

### 5.1 Queue Jobs

| Job                     | Queue           | Retries                      | Purpose                                   |
| ----------------------- | --------------- | ---------------------------- | ----------------------------------------- |
| `SendConfirmationEmail` | `confirmations` | 3 (60s, 5min, 15min backoff) | Sends order confirmation via Laravel Mail |
| `SendDistributionEmail` | `distributions` | 3 (60s backoff)              | Sends bulk emails via Gmail API           |

### 5.2 Broadcasting Events

| Event              | Channel                     | Trigger               |
| ------------------ | --------------------------- | --------------------- |
| `InventoryUpdated` | `private:inventory`         | Stock changes         |
| `SellableUpdated`  | `private:store-stats`       | Product/event updates |
| `TicketScanned`    | `private:tickets.{eventId}` | QR scan               |
| `TicketSold`       | `private:tickets.{eventId}` | Ticket creation       |

### 5.3 Scheduled Commands

| Command                                       | Schedule     | Purpose                                                                       |
| --------------------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| `transactions:cleanup-abandoned --minutes=30` | Every 15 min | Fails stale pending transactions, reverts discounts, records ledger reversals |
| `ledger:backfill --chunk=500`                 | Daily 02:45  | Safety-net: backfills missing ledger entries (idempotent)                     |
| `stock:reconcile`                             | Daily 03:00  | Stock reconciliation                                                          |

---

## 6. Feature-by-Feature Refactoring Assessment

### 6.1 Replace with Ready-Made Dependencies

| Current Implementation                               | Recommendation                                       | Package/Approach                                                                                                               |
| ---------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Flat JSON permissions** on User model              | ✅ Replace with **Spatie Permission**                | `spatie/laravel-permission` — gives roles, permissions, middleware, caching, Blade directives. Already using Spatie packages.  |
| **Custom financial ledger** (FinancialLedgerService) | Keep custom but consider **ledger packages**         | `scottlaurent/accounting` or keep custom. Your idempotent firstOrCreate pattern is solid.                                      |
| **Email formatting** (DOMDocument manipulation)      | Replace with **MJML** or **Maizzle**                 | Templated responsive email framework instead of runtime DOM manipulation.                                                      |
| **QR code generation** (custom service)              | ✅ **Use BaconQrCode directly**                        | Leveraged the already-installed `bacon/bacon-qr-code` to generate SVG tickets instantly.                                                 |
| **ESNcard validation** (raw HTTP)                    | Keep as-is                                           | No standard package exists for ESNcard API. Wrap in a proper SDK class.                                                        |
| **Email verification** (DNS check)                   | Use **egulias/email-validator**                      | Already a Laravel transitive dep; use it directly for RFC + DNS validation.                                                    |
| **Cache-based stock counting**                       | ✅ **Migrated to Event-Sourced Ledger**                | Eliminated 30s cache TTL. Created `inventory_movements` table and refactored `HasStockPools` to compute exact counts. |
| **Unstructured data passing / arrays**               | ✅ **Use strongly typed DTOs**                 | Created pure PHP readonly DTOs (`TransactionPayload`, `SaleLinePayload`) for strict typing.                       |

### 6.2 Architecture Improvements for Refactor

| Area                            | Current                                      | Recommended                                                                              |
| ------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **DTOs & Form Requests**        | Manual readonly classes, unstructured arrays | ✅ **Migrated to pure PHP readonly DTOs** (e.g., `TransactionPayload`)     |
| **API Resources**               | Mix of manual arrays + Resources             | Standardize on `JsonResource` / `laravel-data` everywhere                                |
| **Service-Controller coupling** | Controllers instantiate services directly    | ✅ **Migrated to Action Pattern** (`App\Actions\Sales`, `App\Actions\Backstage`) |
| **Stock Management**            | Live-counting with 30s Cache TTL             | ✅ **Migrated to Event-Sourced Ledger** (`inventory_movements` table)    |
| **Model Architecture**          | Abstract base classes (`Sellable`)           | ✅ **Composition over Inheritance**: `Purchasable` interface + Traits                    |
| **External Integrations**       | Tightly coupled HTTP calls                   | ✅ **Adapter Pattern** implemented via Interfaces (`EmailTransportInterface`)                                  |
| **Config/secrets**              | `.env` flat file                             | For K8s: use ConfigMaps + Secrets, or Vault                                              |
| **Media storage**               | Local disk                                   | Switch to **S3/MinIO** with `spatie/media-library` S3 disk                               |
| **Broadcasting**                | Log driver (dev)                             | Use **Laravel Reverb** or **Soketi** for WebSocket in K8s                                |

### 6.3 Keep As-Is (Well-Implemented)

| Feature                                | Why Keep                                                  |
| -------------------------------------- | --------------------------------------------------------- |
| **CheckoutService** stock locking      | Proper pessimistic locking with `lockForUpdate()`         |
| **PaymentGatewayInterface**            | Clean strategy pattern with dev/prod implementations      |
| **PaymentResult** DTO                  | Immutable, well-structured                                |
| **FinancialLedgerService** idempotency | `firstOrCreate` with idempotency keys is production-grade |
| **Activity logging**                   | Spatie package is the standard                            |
| **Fortify auth**                       | Solid auth foundation                                     |

---

## 7. Deployment: Postgres + Redis + Kubernetes

### 7.1 ✅ Database Migration (SQLite → Postgres)

1. Update `config/database.php` default to `pgsql`
2. **SQL dialect changes needed:**
    - `SalesController::hourBucketExpression()` — already handles `pgsql` with `TO_CHAR(DATE_TRUNC(...))`
    - JSON queries: `whereJsonContains`/`whereJsonDoesntContain` work on Postgres natively
    - `strftime` calls in raw SQL → replace with Postgres `TO_CHAR`
3. Re-run all migrations against Postgres
4. ULIDs: work fine with Postgres `varchar` PKs

### 7.2 ✅ Redis Configuration

```env
# Queue
QUEUE_CONNECTION=redis
REDIS_QUEUE_CONNECTION=queue

# Cache (stock counts, shop index, etc.)
CACHE_STORE=redis

# Session (optional, can stay database for easier debugging)
SESSION_DRIVER=redis
```

The 30-second `Cache::remember` calls for stock counts will benefit significantly from Redis vs database cache.

### 7.3 Kubernetes Considerations

| Concern                | Solution                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------ |
| **Queue workers**      | Separate Deployment for `php artisan queue:work --queue=confirmations,distributions` |
| **Scheduler**          | Single-replica CronJob or sidecar running `php artisan schedule:run`                 |
| **Migrations**         | Init container or Job running `php artisan migrate --force`                          |
| **Media files**        | PersistentVolumeClaim or S3-compatible storage (MinIO)                               |
| **Sessions**           | Redis (stateless pods) or database                                                   |
| **Health checks**      | Add `/health` endpoint for liveness/readiness probes                                 |
| **Horizontal scaling** | Web pods scale freely; queue workers scale by queue depth                            |
| **WebSockets**         | Deploy Reverb/Soketi as separate service                                             |

### 7.4 Environment Variables for K8s

Move these to ConfigMap/Secrets:

- `APP_KEY`, `DB_*`, `REDIS_*` → Secret
- `SUMUP_API_KEY`, `SUMUP_WEBHOOK_SECRET`, `ESNCARD_API_KEY` → Secret
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` → Secret
- `MAIL_*` → Secret
- `APP_URL`, domain configs → ConfigMap

---

## 8. Route Map Summary

### Backstage (authenticated)

| Group             | Routes                                          | Controller                                         |
| ----------------- | ----------------------------------------------- | -------------------------------------------------- |
| Dashboard         | GET /dashboard                                  | Inertia static                                     |
| Office            | GET/POST/PUT/DELETE /office/\*                  | OfficeController                                   |
| Sellables         | CRUD /sellables/products/_, /sellables/events/_ | SellablesController                                |
| Attendees         | GET/POST /sellables/events/{id}/attendees/\*    | EventAttendeeController                            |
| Ticket Scanner    | GET/POST /ticket-scanner/\*                     | TicketScannerController                            |
| Email Distributor | GET /email-distributor, POST /distribute        | EmailDistributorController, DistributionController |
| Inventory         | GET/POST/PUT/DELETE /inventory/\*               | InventoryController                                |
| Store Manager     | GET /store-manager/\*, /sales/summary           | StoreManagerController, SalesController            |
| Settings          | GET/PATCH/DELETE /settings/\*                   | Profile, Password, 2FA, Users, Footer controllers  |
| Audit Log         | GET /audit-log                                  | AuditLogController                                 |
| Google OAuth      | GET /auth/google/\*                             | GoogleController                                   |

### Store (public)

| Route                 | Controller                    | Purpose             |
| --------------------- | ----------------------------- | ------------------- |
| GET /                 | ShopController::index         | Product listing     |
| GET /item/{type}/{id} | ShopController::show          | Item detail         |
| GET /cart             | ShopController::cart          | Cart page           |
| POST /cart/sellables  | ShopController::cartSellables | Fetch cart items    |
| POST /validate-cart   | OnlinePaymentController       | Discount validation |
| POST /checkout        | OnlinePaymentController       | Initiate payment    |
| GET /confirmation     | OnlinePaymentController       | Order confirmation  |
| GET /payment/callback | OnlinePaymentController       | Gateway redirect    |
| POST /payment/webhook | OnlinePaymentController       | SumUp webhook       |
| POST /payment/verify  | OnlinePaymentController       | Frontend polling    |

---

## 9. Key Architectural Patterns

1. **Snapshot pattern** — OfficeShiftSale stores a full JSON snapshot of the sale at creation time, making it immutable for historical accuracy even if the product is later modified.

2. **Live-counted stock** — No stored `sold_count` column. Stock is computed from actual sale records with 30s cache TTL. Cache is busted on every sale/deletion.

3. **Idempotent ledger** — All financial entries use `firstOrCreate` with structured idempotency keys (`online_sale_completed:{id}`), making backfills and retries safe.

4. **Decoupled Revenue Reporting & POS Live Feed** — Online sales are never tied to an `OfficeShift`. Shifts are strictly for cash drawer reconciliation. Total revenue is queried via the `FinancialLedgerEntry`. 
   - **How to fetch the POS Feed:** To display the "shift transactions" to a worker, use a time-based query that merges their active physical sales with recent online sales:
   ```php
   $lastClosed = OfficeShift::where('status', 'closed')->latest('ended_at')->first();
   $startTime = $lastClosed ? $lastClosed->ended_at : now()->startOfDay();

   $transactions = Transaction::with('sales')
       ->where(function ($q) use ($currentShift, $startTime) {
           $q->where('office_shift_id', $currentShift->id) // Worker's physical sales
             ->orWhere(function ($sq) use ($startTime) {
                 $sq->where('channel', 'online')
                    ->where('completed_at', '>=', $startTime); // Recent online sales
             });
       })->latest('completed_at')->get();
   ```

5. **Split stock pools** — Events/products can have separate stock pools for Membership holders (`quantity_with_membership`) and regular buyers (`quantity_without_membership`), or a single universal pool.

6. ✅ **Abstract Sellable** — Refactored to `Purchasable` Interface.
