# Email Distribution System - Architecture & Implementation

## Overview

The email distribution system is designed with **separation of concerns** and **layered architecture** principles. Emails are sent via **Gmail OAuth API** with SMTP fallback.

## Architecture Layers

### 1. **Frontend Layer** (React/Inertia)
- **Location**: `resources/js/pages/email-distributor.tsx`
- **Hook**: `resources/js/hooks/use-email-distribution.ts`
- **Responsibility**: 
  - User interface for email composition
  - Event/template selection
  - Field mapping and nullable field configuration
  - Preview generation and distribution triggering
  - Error handling and success notifications

### 2. **HTTP Controller Layer**
- **Location**: `app/Http/Controllers/DistributionController.php`
- **Responsibility**:
  - Handle HTTP POST requests for email distribution
  - Validate incoming data via form requests
  - Delegate to service layer
  - Return JSON responses

### 3. **Service Layer** (Business Logic)

#### **EmailDistributionService**
- **Location**: `app/Services/EmailDistributionService.php`
- **Responsibility**:
  - Orchestrate email distribution workflow
  - Coordinate between multiple services:
    - `AttendeeService` - Fetch and filter attendee data
    - `QrCodeGenerationService` - Generate QR codes
    - `EmailQueueService` - Queue emails for sending
  - Handle ticket generation for QR-enabled emails
  - Return distribution results with error tracking

#### **EmailQueueService**
- **Location**: `app/Services/EmailQueueService.php`
- **Responsibility**:
  - Queue emails for sending via Laravel Queue
  - Create mail log entries for auditing
  - Embed QR codes into email body
  - Format email content
  - Dispatch `SendDistributionEmail` job to queue

#### **GmailSenderService** ⭐ NEW
- **Location**: `app/Services/GmailSenderService.php`
- **Responsibility**:
  - Send emails via Gmail API using OAuth
  - Handle token refresh and management
  - Build and encode Gmail messages
  - Error handling and logging
  - **Priority**: Gmail OAuth first, then SMTP fallback

#### **EmailFormattingService**
- **Location**: `app/Services/EmailFormattingService.php`
- **Responsibility**:
  - Apply inline CSS resets for email clients
  - Normalize HTML structure
  - Ensure email compatibility

### 4. **Queue/Job Layer**

#### **SendDistributionEmail Job** ⭐ UPDATED
- **Location**: `app/Jobs/SendDistributionEmail.php`
- **Responsibility**:
  - Execute queued email sending
  - Primary: Attempt Gmail API send via `GmailSenderService`
  - Fallback: Use SMTP via Laravel's Mail facade
  - Update mail log with success/failure status
  - Implement retry logic with exponential backoff
  - Log detailed information for debugging

### 5. **Data Layer**
- **Models**: 
  - `Mail` - Log of sent emails (with ULID)
  - `Ticket` - Generated QR code tickets (with ULID)
  - `User` - Gmail OAuth credentials storage
- **Storage**: Database mail log for audit trail

## Email Sending Flow

```
Frontend (email-distributor.tsx)
    ↓
HTTP POST /distribution/distribute
    ↓
DistributionController::distribute()
    ↓
DistributeEmailsRequest (validation)
    ↓
EmailDistributionService::processDistribution()
    ├── Process Ticket Generation
    ├── AttendeeService::getEventAttendees()
    ├── QrCodeGenerationService::generateTicket()
    └── EmailQueueService::queueEmail()
        ├── Embed QR codes
        ├── EmailFormattingService::applyInlineReset()
        ├── Create Mail log entry
        ├── Prepare payload
        └── SendDistributionEmail::dispatch()
            ↓
        Queue (database/sync)
            ↓
        SendDistributionEmail::handle()
            ├── PRIMARY: GmailSenderService::send()
            │   ├── Ensure valid OAuth token
            │   ├── Build Gmail message
            │   └── Send via Gmail API
            ├── FALLBACK: SMTP via Mail::to()
            └── Update Mail log (success/error)
```

## Authentication & Authorization

### Gmail OAuth Setup
1. User connects Google account via `Auth/GoogleController@handleGoogleCallback()`
2. Credentials stored in `users` table:
   - `gmail_provider_id` - Google user ID
   - `gmail_provider_email` - Google email
   - `gmail_refresh_token` - OAuth refresh token

### Sending Emails
- Uses logged-in user's Gmail account
- Token passed via `sender_id` in distribution request
- Automatic token refresh before sending

## Configuration

### Environment Variables (.env)
```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost/google/callback

MAIL_MAILER=log              # Ignored - uses Gmail API
MAIL_HOST=127.0.0.1          # For SMTP fallback
MAIL_PORT=2525               # For SMTP fallback
```

### Config Files
- `config/services.php` - Google OAuth credentials
- `config/queue.php` - Queue configuration (database driver)
- `config/mail.php` - Mail driver (unused for primary flow)

## Error Handling & Logging

### Mail Log Entry
Every email distribution attempt is logged to the `mails` table:
```php
[
    'id' => ULID,
    'event_id' => Event ID,
    'user_id' => Sender User ID,
    'recipient_email' => Email,
    'subject' => Subject,
    'body' => HTML body,
    'success' => true/false,
    'error_message' => Error details,
    'metadata' => JSON metadata,
    'created_at' => Timestamp,
    'updated_at' => Timestamp,
]
```

### Logging Levels
- **INFO**: Successful operations
- **WARNING**: Fallback to SMTP, token refresh issues
- **ERROR**: Failed sending, token errors

## Queue Processing

### Queue Driver
- Default: `database` (stored in `jobs` table)
- Manually process: `php artisan queue:work`
- Retry: 3 attempts with 60-second backoff

### Commands
```bash
# Process queue jobs
php artisan queue:work

# Check failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```

## Reusable Components & Patterns

### Service Injection
All services use dependency injection for testability:
```php
public function __construct(
    private readonly GmailSenderService $gmailSender,
    private readonly EmailFormattingService $formatter,
) {}
```

### Base Service Pattern
Services have single responsibility:
- `GmailSenderService` - Only Gmail API logic
- `EmailFormattingService` - Only HTML normalization
- `EmailQueueService` - Only queuing logic
- `EmailDistributionService` - Only orchestration

### Separation of Concerns
- Frontend doesn't know about queue implementation
- Queue job doesn't know about email composition
- Gmail service doesn't know about database logging
- Each layer can be tested independently

## Future Enhancements

1. **Batch Processing**: Group emails for better performance
2. **Template Management**: Store email templates in database
3. **Delivery Analytics**: Track opens, bounces, etc.
4. **Scheduled Distribution**: Send emails at specific times
5. **Multi-Account Support**: Send from different email accounts
6. **Webhook Integration**: Handle Gmail delivery notifications

## Testing

### Unit Tests
```bash
php artisan test --filter=GmailSenderService
php artisan test --filter=EmailDistributionService
```

### Manual Testing
1. Connect Google account in Settings
2. Create event with attendees
3. Trigger distribution from email-distributor page
4. Check `mails` table for delivery status
5. Verify email in receiving account

## Troubleshooting

### Emails Not Sending
1. Check `mails` table for error messages
2. Verify user has connected Google account
3. Check OAuth token validity
4. Run `php artisan queue:work` if using queue
5. Check logs: `storage/logs/laravel.log`

### SMTP Fallback Issues
1. Verify `MAIL_DRIVER` configuration
2. Check SMTP credentials if needed
3. Review Laravel mail configuration

### Token Refresh Failures
1. User may need to reconnect Google account
2. Check `gmail_refresh_token` in users table
3. Verify Google OAuth credentials in config
