# Email Distributor Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React/TypeScript)                 │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌──────────────────────────────────────────────────────┐
│  │     email-distributor.tsx (Page Component)           │
│  │  ┌────────────────────────────────────────────────┐  │
│  │  │  useEmailDistribution Hook                    │  │
│  │  │  ├─ Fetches /email-distributor/attendees     │  │
│  │  │  ├─ Fetches /email-distributor/attendees-all │  │
│  │  │  ├─ Manages state: attendeeData, isFiltered  │  │
│  │  │  └─ Orchestrates preview generation          │  │
│  │  └────────────────────────────────────────────────┘  │
│  │                                                      │
│  │  Renders Components:                                │
│  │  ├─ EmailComposer (email body editor)              │
│  │  ├─ FieldMappingSection (field selectors)          │
│  │  │  └─ NullableFieldsSection (checkboxes)         │
│  │  ├─ DataSourcePreview (attendee table)             │
│  │  │  └─ Shows "Filtered Data Source" or equivalent │
│  │  └─ EmailPreview (generated email preview)         │
│  └──────────────────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
         ↓ HTTP Requests                    ↓ HTTP Requests
         ↓                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Laravel/PHP)                      │
├─────────────────────────────────────────────────────────────────┤
│
│  ┌──────────────────────────────────────┐
│  │  EmailDistributorController          │
│  │  ├─ index()                          │
│  │  │  └─ Returns events & templates    │
│  │  ├─ getAttendees()                   │
│  │  │  └─ Delegates to AttendeeService  │
│  │  └─ getAllAttendees()                │
│  │     └─ Delegates to AttendeeService  │
│  └──────────────────────────────────────┘
│         ↓ Uses                  ↓ Uses
│         ↓                       ↓
│  ┌────────────────────────────────────────┐
│  │      AttendeeService (Centralized)     │
│  │  Shared by BOTH pages:                 │
│  │  ├─ getAttendeeData()                  │
│  │  │  ├─ Handles filtering logic         │
│  │  │  ├─ Manages caching                 │
│  │  │  └─ Calls GoogleSheetsService       │
│  │  ├─ filterRows()                       │
│  │  │  └─ Applies filter configuration    │
│  │  ├─ validatePurchases()                │
│  │  └─ verifyEmails()                     │
│  └────────────────────────────────────────┘
│         ↑ Also Used By
│         │
│  ┌──────────────────────────────────────┐
│  │  EventAttendeeController              │
│  │  (Attendee Management Page)           │
│  │  ├─ Uses same AttendeeService         │
│  │  └─ No duplication                    │
│  └──────────────────────────────────────┘
│         ↓ Uses
│         ↓
│  ┌────────────────────────────────────────┐
│  │  GoogleSheetsService                   │
│  │  ├─ getSheetData()                     │
│  │  ├─ getSheetNames()                    │
│  │  └─ Sheet operations                   │
│  └────────────────────────────────────────┘
│
│  ┌────────────────────────────────────────┐
│  │  EmailDistributionService              │
│  │  (Distribution Logic Only)             │
│  │  ├─ getUpcomingEvents()                │
│  │  ├─ processDistribution()              │
│  │  ├─ processTicketGeneration()          │
│  │  └─ needsQrCode()                      │
│  │                                        │
│  │  Dependencies:                         │
│  │  ├─ QrCodeGenerationService            │
│  │  ├─ EmailQueueService                  │
│  │  └─ AttendeeService (for future use)   │
│  └────────────────────────────────────────┘
│
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Attendee Fetching

```
Frontend Component
        │
        │ Hook Effect: selectedEventId changes
        │
        ├─────────────────────────┬──────────────────────────┐
        ↓                         ↓
   GET /email-distributor/    GET /email-distributor/
     attendees/{event}        attendees-all/{event}
     (Filtered)               (Unfiltered)
        │                         │
        ├─────────────────────────┤
        ↓
   EmailDistributorController
        │
        ├─────────────────────────┬──────────────────────────┐
        ↓                         ↓
   getAttendees()          getAllAttendees()
        │                         │
        ├─────────────────────────┤
        ↓
   AttendeeService::getAttendeeData(
       $event,
       $sheetName,
       $unfiltered = false    OR    $unfiltered = true
   )
        │
        ├─────────────────────────┬──────────────────────────┐
        ↓                         ↓
   Cache Miss                Cache Miss
        │                         │
        ├─────────────────────────┤
        ↓
   GoogleSheetsService::getSheetData()
   (Fetch raw data from Google Sheets)
        │
        ├─────────────────────────┬──────────────────────────┐
        ↓                         ↓
   When $unfiltered=false    When $unfiltered=true
   Apply filters:            Skip filtering:
   - Get filter config       - Return as-is
   - Call filterRows()       - Caches for comparison
   - Return filtered         - Used to detect active filters
        │                         │
        ├─────────────────────────┤
        ↓
   Return to Controller
        │
        ├─────────────────────────┬──────────────────────────┐
        ↓                         ↓
   JSON Response             JSON Response
        │                         │
        ├─────────────────────────┤
        ↓
   Frontend Hook receives both datasets
        │
        ├─ Parse filtered data → setAttendeeData()
        ├─ Parse unfiltered data → setAllAttendeeData()
        └─ Compare counts → setIsFiltered(filtered < unfiltered)
        │
        ↓
   Component re-renders with filtered data
   and "Filtered Data Source" label (if filtering active)
```

## Service Responsibilities

### AttendeeService (Single Source of Truth for Attendees)
```
├─ Data Source Operations
│  └─ getAttendeeData(Event, sheetName, unfiltered)
│     ├─ Manages caching
│     ├─ Delegates to GoogleSheetsService for raw data
│     ├─ Applies filtering when unfiltered=false
│     └─ Returns processed attendee data
│
├─ Filtering Operations
│  └─ filterRows(rows, filterConfig)
│     ├─ Parses filter configuration
│     ├─ Applies each filter rule (equals, contains, is_checked, etc.)
│     └─ Returns filtered rows
│
├─ Validation Operations
│  ├─ validatePurchases(Event)
│  │  ├─ Checks purchase identifiers against online_sales
│  │  ├─ Updates Google Sheets with validation status
│  │  └─ Formats colored cells
│  │
│  └─ verifyEmails(Event)
│     ├─ Verifies email domains
│     ├─ Updates Google Sheets with verification status
│     └─ Formats colored cells
│
└─ Used by
   ├─ EventAttendeeController (attendee management page)
   ├─ EmailDistributorController (email distribution page)
   └─ Any other future attendee-related feature
```

### EmailDistributionService (Focused on Distribution Workflow)
```
├─ Event Data
│  └─ getUpcomingEvents(days)
│     └─ Returns events within date range (note: TODO - move to EventService)
│
├─ Template Data
│  └─ getEmailTemplates()
│     └─ Returns available email templates (TODO - implement)
│
├─ Distribution Workflow
│  └─ processDistribution(recipients, sender)
│     ├─ Calls processTicketGeneration()
│     ├─ Queues emails via EmailQueueService
│     └─ Returns distribution summary
│
├─ Ticket Generation
│  ├─ processTicketGeneration(recipients, sender, &ticketsCreated)
│  │  ├─ Iterates over recipients
│  │  ├─ Checks if email needs QR (needsQrCode)
│  │  ├─ Generates QR ticket via QrCodeGenerationService
│  │  └─ Updates recipient with ticket data
│  │
│  └─ needsQrCode(recipient)
│     └─ Checks if email body contains {{qr}} placeholder
│
└─ Uses
   ├─ QrCodeGenerationService (for QR code tickets)
   ├─ EmailQueueService (for email queuing)
   └─ AttendeeService (potentially for future enhancements)
```

## Request/Response Examples

### GET /email-distributor/attendees/{eventId}
**Purpose**: Fetch filtered attendees

**Request**:
```
GET /email-distributor/attendees/123
```

**Response**:
```json
{
  "success": true,
  "rows": [
    ["First Name", "Last Name", "Email"],
    ["John", "Doe", "john@example.com"],
    ["Jane", "Smith", "jane@example.com"]
  ]
}
```

### GET /email-distributor/attendees-all/{eventId}
**Purpose**: Fetch all unfiltered attendees (for filter detection)

**Request**:
```
GET /email-distributor/attendees-all/123
```

**Response**:
```json
{
  "success": true,
  "rows": [
    ["First Name", "Last Name", "Email"],
    ["John", "Doe", "john@example.com"],
    ["Jane", "Smith", "jane@example.com"],
    ["Bob", "Johnson", "bob@example.com"]
  ]
}
```

**Frontend Logic**: If rows count differs, `isFiltered = true`

## Key Design Principles Applied

✅ **DRY (Don't Repeat Yourself)**
- All attendee logic centralized in AttendeeService
- Both pages use identical filtering

✅ **Single Responsibility**
- AttendeeService: Attendee operations only
- EmailDistributionService: Distribution workflow only
- Controllers: HTTP requests only

✅ **Separation of Concerns**
- Frontend: UI rendering and state management
- Controllers: HTTP request/response handling
- Services: Business logic
- Google Sheets Service: External API integration

✅ **Testability**
- Each service can be tested independently
- Mock services easily
- Controllers are thin and easy to test

✅ **Maintainability**
- Changes to filtering logic affect both pages automatically
- New features add to services, not duplicated code
- Clear, well-documented responsibilities
