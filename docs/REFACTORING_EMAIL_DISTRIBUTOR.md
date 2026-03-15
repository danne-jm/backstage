# Email Distributor - Refactoring Documentation

## Overview

The Email Distributor feature has been refactored to follow proper **separation of concerns**, **DRY (Don't Repeat Yourself)** principles, and component reusability. The implementation now properly delegates attendee data handling to the existing `AttendeeService` rather than duplicating logic.

## Architecture

### Service Layer

#### AttendeeService (Centralized)
**Responsibility**: All attendee data operations
- `getAttendeeData(Event, ?string, bool)` - Fetch attendees with optional filtering
- `validatePurchases(Event)` - Validate purchase identifiers
- `verifyEmails(Event)` - Verify email domains
- `filterRows(array, array)` - Apply filter configuration to data

**Location**: `app/Services/AttendeeService.php`

**Used by**:
- `EventAttendeeController` - For attendee management page
- `EmailDistributorController` - For email distributor page
- Both pages share the same filtering logic and business rules

---

#### EmailDistributionService (Distribution Logic)
**Responsibility**: Email distribution workflow only
- `getUpcomingEvents(int)` - Event retrieval for distribution UI
- `getEmailTemplates()` - Template retrieval  
- `processDistribution(array, ?User)` - Orchestrate distribution process
- `processTicketGeneration(array, ?User, int)` - Generate QR code tickets
- `needsQrCode(array)` - Detect if email needs QR code

**Location**: `app/Services/EmailDistributionService.php`

**Key Design Decisions**:
- Does NOT handle attendee data fetching (delegates to AttendeeService)
- Does NOT handle Google Sheets operations (delegates to GoogleSheetsService)
- Focuses exclusively on email distribution workflow
- Removed redundant `GoogleSheetsService` dependency

---

### Controller Layer

#### EmailDistributorController
**Responsibility**: HTTP request handling for email distribution UI

**Methods**:
- `index()` - Render email distributor page
  - Fetches upcoming events via `EmailDistributionService`
  - Fetches email templates via `EmailDistributionService`

- `getAttendees(Request, string)` - Fetch filtered attendees
  - **Direct delegation to**: `AttendeeService::getAttendeeData()` with `$unfiltered=false`
  - Returns filtered data respecting attendee filter rules from `/attendee` page

- `getAllAttendees(Request, string)` - Fetch unfiltered attendees
  - **Direct delegation to**: `AttendeeService::getAttendeeData()` with `$unfiltered=true`
  - Used by frontend to detect if filtering is active

**Location**: `app/Http/Controllers/EmailDistributorController.php`

**Comparison with EventAttendeeController**:
Both controllers now follow the same pattern:
```php
// Same pattern across both controllers
$data = $this->attendeeService->getAttendeeData($event, $sheetName, $unfiltered);
```

---

#### EventAttendeeController
**Responsibility**: HTTP request handling for attendee management UI
- Uses same `AttendeeService` for data operations
- No duplication of attendee logic

**Location**: `app/Http/Controllers/EventAttendeeController.php`

---

### Frontend Hook

#### use-email-distribution.ts
**Responsibility**: State management for email distributor page

**Key Features**:
- Fetches filtered attendees from `/email-distributor/attendees/{event}`
- Fetches unfiltered attendees from `/email-distributor/attendees-all/{event}`
- Compares counts to detect if filtering is active
- Sets `isFiltered` flag for UI

**Location**: `resources/js/hooks/use-email-distribution.ts`

---

## Data Flow

### Attendee Data Retrieval

```
Frontend (email-distributor.tsx)
  ↓
Hook (use-email-distribution.ts)
  ├─ Fetches /email-distributor/attendees/{event} (filtered)
  └─ Fetches /email-distributor/attendees-all/{event} (unfiltered)
      ↓
Controller (EmailDistributorController)
  ├─ getAttendees() → calls AttendeeService::getAttendeeData(..., false)
  └─ getAllAttendees() → calls AttendeeService::getAttendeeData(..., true)
      ↓
Service (AttendeeService)
  ├─ Fetches from Google Sheets via GoogleSheetsService
  ├─ Applies filters via filterRows() if $unfiltered=false
  └─ Returns processed attendee data
      ↓
Frontend receives data and compares counts to determine if filtering is active
```

---

## Component Reusability

### Shared Components
Both `/attendee` and `/email-distributor` pages share the following components:

#### Base Components (email-distributor directory)
- `base-data-preview.tsx` - Generic data table preview
- `base-field-mapper.tsx` - Generic field mapping selector
- `base-form-section.tsx` - Generic form section wrapper

#### Shared UI Components
- `Checkbox` - For nullable fields selection
- `Dialog` - For modal dialogs
- `Button`, `Label`, `Select` - Standard UI elements

#### Purpose-Specific Components
- `nullable-fields-section.tsx` - Marks fields as nullable/skippable
  - Uses `BaseFormSection` for consistency
  - Uses `Checkbox` component for standard styling
  - Can be reused across other forms

---

## Benefits of This Architecture

### ✅ No Logic Duplication
- Attendee filtering logic exists in ONE place: `AttendeeService`
- Both `/attendee` and `/email-distributor` pages use identical logic
- Changes to filtering automatically apply to both pages

### ✅ Single Responsibility
- `AttendeeService` - Attendee data operations
- `EmailDistributionService` - Distribution workflow
- `EmailDistributorController` - HTTP requests only
- Each service has one clear purpose

### ✅ Easy Maintenance
- Filtering rules updated once, applied everywhere
- Adding new filter operators updates one method: `AttendeeService::filterRows()`
- Verification operations (email/purchase) centralized in `AttendeeService`

### ✅ Testability
- `AttendeeService` can be tested independently
- `EmailDistributionService` can be tested without attendee concerns
- Controllers are thin and easy to test

### ✅ Scalability
- Adding new attendee-related features (export, bulk actions) adds to `AttendeeService`
- Adding new distribution features (scheduling, templates) adds to `EmailDistributionService`
- Clear separation makes new features easy to integrate

---

## Future Improvements

### Potential Refactoring
1. **EventService** - Move `getUpcomingEvents()` to dedicated service
2. **TemplateService** - Handle email templates separately
3. **VerificationService** - Consolidate all verification operations
4. **FilterService** - Extract advanced filtering logic

### Current TODOs
- [ ] Implement `EmailDistributionService::getEmailTemplates()` when MailTemplate model exists
- [ ] Consider moving event retrieval to dedicated EventService
- [ ] Implement advanced filtering operators

---

## Code Examples

### Using AttendeeService Directly

```php
// In any controller or service
$attendees = $this->attendeeService->getAttendeeData(
    $event,
    'Sheet1',
    false  // Apply filters
);

// Same service, different unfiltered flag
$allAttendees = $this->attendeeService->getAttendeeData(
    $event,
    'Sheet1',
    true   // No filtering
);
```

### Filtering Configuration

Filters are defined in `Event::attendee_filter_config` and applied by `AttendeeService::filterRows()`:

```php
$filterConfig = [
    ['column' => 'Status', 'operator' => 'equals', 'value' => 'Confirmed'],
    ['column' => 'Paid', 'operator' => 'is_checked'],
];

$filtered = $this->attendeeService->filterRows($rows, $filterConfig);
```

---

## Files Modified

### Backend
- `app/Http/Controllers/EmailDistributorController.php` - Refactored to delegate to services
- `app/Services/EmailDistributionService.php` - Removed duplicate attendee logic
- `routes/web.php` - Added `/email-distributor/attendees-all/{event}` route

### Frontend
- `resources/js/hooks/use-email-distribution.ts` - Added filtered/unfiltered data fetch
- `resources/js/pages/email-distributor.tsx` - Added name formatting, filter detection
- `resources/js/components/email-distributor/data-source-preview.tsx` - Added filtered UI labels
- `resources/js/components/email-distributor/nullable-fields-section.tsx` - NEW component

---

## Verification

All changes have been verified through:
- ✅ Successful build completion
- ✅ No TypeScript errors
- ✅ No PHP errors
- ✅ Proper service delegation confirmed
- ✅ No logic duplication between pages
