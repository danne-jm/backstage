# Email System - Code Structure Reference

## File Organization

```
app/
├── Services/
│   ├── GmailSenderService.php          ⭐ NEW - Gmail OAuth implementation
│   ├── EmailDistributionService.php    ✓ Orchestration layer
│   ├── EmailQueueService.php           ✓ Queue management
│   ├── EmailFormattingService.php      ✓ HTML normalization
│   └── AttendeeService.php             ✓ Data fetching
│
├── Jobs/
│   └── SendDistributionEmail.php       ✏️ UPDATED - Now uses GmailSenderService
│
├── Http/Controllers/
│   ├── DistributionController.php      ✓ HTTP endpoint
│   ├── EmailDistributorController.php  ✓ UI data provider
│   └── Auth/GoogleController.php       ✓ OAuth callback handler
│
├── Http/Requests/
│   └── DistributeEmailsRequest.php     ✓ Validation & authorization
│
├── Models/
│   ├── Mail.php                        ✓ Mail log (ULID)
│   ├── Ticket.php                      ✓ QR tickets (ULID)
│   ├── User.php                        ✓ Gmail OAuth fields
│   └── Sellable.php                    ✓ Base sellable model
│
├── Mail/
│   └── DistributionMail.php            ✓ Email mailable class
│
└── Events/
    ├── InventoryUpdated.php            ✓ Events
    └── ...
```

## Service Dependencies

```
GmailSenderService
├── Depends on: Google\Client, Google\Service\Gmail
├── Used by: SendDistributionEmail Job
└── Responsibility: Gmail API OAuth sending

EmailQueueService
├── Depends on: GmailSenderService, EmailFormattingService
├── Used by: EmailDistributionService
└── Responsibility: Queue job creation

EmailDistributionService
├── Depends on: EmailQueueService, AttendeeService, QrCodeGenerationService
├── Used by: DistributionController
└── Responsibility: Workflow orchestration

EmailFormattingService
├── Depends on: None (standalone)
├── Used by: EmailQueueService
└── Responsibility: HTML normalization

AttendeeService
├── Depends on: GoogleSheetsService, EmailVerificationService
├── Used by: EmailDistributionService
└── Responsibility: Attendee data fetching

SendDistributionEmail Job
├── Depends on: GmailSenderService, Mail facade, MailModel
├── Used by: Queue worker
└── Responsibility: Job execution
```

## Data Flow Diagram

```
┌─────────────────────────────────────────┐
│   Frontend: email-distributor.tsx       │
│   - Select event & template             │
│   - Configure fields & nullable         │
│   - Generate preview                    │
│   - Trigger distribution                │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ HTTP POST /distribution/distribute      │
│ DistributionController::distribute()    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ DistributeEmailsRequest                 │
│ - Validate recipients                   │
│ - Authorize (always true for now)       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ EmailDistributionService                │
│ ::processDistribution()                 │
├─────────────────────────────────────────┤
│ 1. Generate tickets (QR codes)          │
│    ├─ AttendeeService::getAttendees()   │
│    └─ QrCodeGenerationService::gen()    │
│ 2. Queue emails                         │
│    └─ EmailQueueService::queueEmail()   │
│       ├─ Embed QR codes                 │
│       ├─ Format HTML                    │
│       ├─ Create Mail log entry          │
│       └─ Dispatch job                   │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ Laravel Queue (database)                │
│ jobs table                              │
└──────────────────┬──────────────────────┘
                   │
         [Queue Worker Process]
                   │
                   ▼
┌─────────────────────────────────────────┐
│ SendDistributionEmail::handle()         │
├─────────────────────────────────────────┤
│ 1. Try Gmail API (PRIMARY)              │
│    └─ GmailSenderService::send()        │
│       ├─ Ensure valid OAuth token       │
│       ├─ Refresh token if needed        │
│       ├─ Build Gmail message            │
│       └─ Send via Gmail API             │
│                                         │
│ 2. Fallback to SMTP (if Gmail fails)    │
│    └─ Mail::to()->send()                │
│       └─ Uses Laravel Mail driver       │
│                                         │
│ 3. Log result to mails table            │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ mails table                             │
│ - success: true/false                   │
│ - error_message: null/"error details"   │
│ - metadata: JSON                        │
└─────────────────────────────────────────┘
```

## API Endpoints

### Email Distribution
```
POST /distribution/distribute
├─ Headers: Content-Type: application/json
├─ Middleware: auth, verified
├─ Request: DistributeEmailsRequest
│  {
│    "recipients": [
│      {
│        "email": "user@example.com",
│        "subject": "Email subject",
│        "body": "<p>HTML body</p>",
│        "first_name": "John",
│        "last_name": "Doe",
│        "event_id": 1,
│        "event_name": "Event",
│        "event_date": "2026-03-23",
│        "__ticket_code": "TICKET-CODE" // Optional QR
│      }
│    ]
│  }
│
└─ Response: JSON
  {
    "queued_count": 1,
    "tickets_created": 1,
    "sent_count": 1,
    "queued": true,
    "received_count": 1,
    "dispatch_errors": []
  }
```

## Database Schema

### mails table
```sql
CREATE TABLE mails (
    id                CHAR(26) PRIMARY KEY,    -- ULID
    event_id          BIGINT UNSIGNED,         -- Foreign key to events
    user_id           BIGINT UNSIGNED,         -- Foreign key to users
    recipient_email   VARCHAR(255),
    subject           VARCHAR(255),
    body              LONGTEXT,
    success           BOOLEAN DEFAULT FALSE,
    error_message     TEXT,
    metadata          JSON,
    created_at        TIMESTAMP,
    updated_at        TIMESTAMP,
    
    CONSTRAINT fk_event FOREIGN KEY (event_id) REFERENCES events(id),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_email (recipient_email),
    INDEX idx_success (success),
    INDEX idx_created (created_at)
);
```

### users table (OAuth fields)
```sql
ALTER TABLE users ADD COLUMN gmail_provider_id VARCHAR(255);
ALTER TABLE users ADD COLUMN gmail_provider_email VARCHAR(255);
ALTER TABLE users ADD COLUMN gmail_refresh_token TEXT;
```

## Configuration Files

### config/services.php
```php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('GOOGLE_REDIRECT_URI'),
],
```

### config/queue.php (extract)
```php
'default' => env('QUEUE_CONNECTION', 'database'),

'connections' => [
    'database' => [
        'driver' => 'database',
        'connection' => env('DB_QUEUE_CONNECTION'),
        'table' => env('QUEUE_TABLE', 'jobs'),
        'queue' => env('QUEUE_DEFAULT', 'default'),
        'retry_after' => env('QUEUE_RETRY_AFTER', 60),
        'after_commit' => false,
    ],
],
```

### .env Variables
```
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost/google/callback

# Queue (optional - defaults shown)
QUEUE_CONNECTION=database
QUEUE_TABLE=jobs
QUEUE_DEFAULT=default

# Mail (for SMTP fallback)
MAIL_MAILER=log
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS=hello@example.com
MAIL_FROM_NAME="App Name"
```

## Key Classes Reference

### GmailSenderService
```php
class GmailSenderService {
    public function send(
        string $to,
        string $subject,
        string $body,
        User $user
    ): bool

    private function ensureValidToken(User $user): bool
    private function buildMessage(...): Gmail\Message
    private function encodeMessage(Swift_Message $msg): string
}
```

### SendDistributionEmail Job
```php
class SendDistributionEmail implements ShouldQueue {
    public int $tries = 3;
    public int $backoff = 60;
    
    public function handle(GmailSenderService $gmailSender): void
    private function tryGmailSend(...): bool
    private function sendViaSmtp(...): void
}
```

### EmailDistributionService
```php
class EmailDistributionService {
    public function processDistribution(
        array $recipients,
        ?User $sender
    ): array

    private function processTicketGeneration(...): array
}
```

## Testing Commands

```bash
# Start queue worker
php artisan queue:work

# Check queue status
php artisan queue:monitor

# Process specific queue
php artisan queue:work --queue=distributions

# Retry failed jobs
php artisan queue:retry all

# Clear all jobs
php artisan queue:clear

# Check database
sqlite3 database/database.sqlite "SELECT COUNT(*) FROM jobs;"
sqlite3 database/database.sqlite "SELECT COUNT(*) FROM mails WHERE success=1;"

# View logs
tail -f storage/logs/laravel.log | grep -i gmail
tail -f storage/logs/laravel.log | grep -i distribution
```

## Debugging Tips

### 1. Check Gmail Token
```bash
php artisan tinker
>>> $user = App\Models\User::find(1)
>>> $user->gmail_refresh_token
>>> $user->gmail_provider_email
```

### 2. Test Gmail Service
```bash
php artisan tinker
>>> $service = app(App\Services\GmailSenderService::class)
>>> $service->send('test@example.com', 'Test', '<p>Test</p>', $user)
```

### 3. Monitor Queue
```bash
# Watch queue processing
watch -n 1 'sqlite3 database/database.sqlite "SELECT COUNT(*) FROM jobs;"'

# Watch mail log
watch -n 1 'sqlite3 database/database.sqlite "SELECT COUNT(*) as total, SUM(success) as sent FROM mails;"'
```

### 4. Check Logs
```bash
# Real-time log following
tail -f storage/logs/laravel.log

# Filter for errors
grep -i "error\|exception" storage/logs/laravel.log | tail -20

# Filter for Gmail/Distribution
grep -i "gmail\|distribution" storage/logs/laravel.log | tail -30
```

## Performance Considerations

- **Queue Driver**: Database (good for small-medium volumes)
- **Batch Size**: Process emails one-by-one (allows selective retry)
- **Token Refresh**: Cached per request (minimize API calls)
- **Logging**: Comprehensive but performant
- **Scalability**: Can migrate to Redis for high volume

## Security Considerations

- ✅ OAuth tokens encrypted at rest (via Laravel)
- ✅ Tokens refreshed automatically
- ✅ HTTPS enforced for OAuth
- ✅ User authorization required for distribution
- ✅ Mail audit trail in database
- ✅ Error messages don't expose sensitive data
