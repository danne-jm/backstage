# Email Distributor - Architecture Documentation

## Overview
The Email Distributor is a refactored version of the original `/ticketing` feature with improved architecture focusing on separation of concerns, componentization, and maintainability.

## Backend Architecture

### Layer Separation

#### Controllers (Presentation Layer)
- **EmailDistributorController**: Handles page rendering and attendee data fetching
- **DistributionController**: Manages email distribution requests

#### Form Requests (Validation Layer)
- **DistributeEmailsRequest**: Centralizes validation logic for email distribution

#### Services (Business Logic Layer)
Each service has a single responsibility:

- **EmailDistributionService**: Orchestrates the email distribution process
  - Fetches upcoming events
  - Retrieves attendees from Google Sheets
  - Coordinates ticket generation and email queueing

- **QrCodeGenerationService**: Handles QR code and ticket creation
  - Generates unique ticket codes
  - Creates ticket database records
  - Generates QR code images

- **EmailQueueService**: Manages email queuing
  - Embeds QR codes into email bodies
  - Creates mail log entries
  - Dispatches emails to queue

- **EmailFormattingService**: Formats email HTML
  - Applies inline CSS resets
  - Ensures email client compatibility

- **GoogleSheetsService**: Integrates with Google Sheets API
  - Fetches attendee data
  - (Currently a stub - needs implementation)

### Benefits of Backend Architecture
1. **Single Responsibility**: Each service/controller has one clear purpose
2. **Testability**: Services can be unit tested independently
3. **Maintainability**: Changes to one aspect don't affect others
4. **Dependency Injection**: Services are injected, making them easy to mock/replace

## Frontend Architecture

### Base Components (Reusable Foundations)
These provide common functionality that other components extend:

1. **BaseFormSection**: Consistent styling for form sections
2. **BaseFieldMapper**: Reusable dropdown for field mapping
3. **BaseDataPreview**: Generic table component for displaying data

### Feature Components (Specific Functionality)

#### Email Composition
- **EmailComposer**: Combines subject and body editing
- **RichTextEditor**: HTML editing with formatting toolbar
- **TemplateSelector**: Email template dropdown

#### Data Management
- **EventSelector**: Event selection dropdown
- **FieldMappingSection**: Maps data columns to recipient fields
- **DataSourcePreview**: Shows attendee data preview
- **RecipientSummary**: Domain analysis and typo detection

#### Distribution
- **DistributionDialog**: Confirmation/error dialog
- **EmailPreview**: Shows generated emails (HTML or JSON)

### State Management
**useEmailDistribution** hook centralizes all state logic:
- Event and template selection
- Attendee data loading
- Field mapping
- Email composition
- Preview generation
- Distribution process

### Benefits of Frontend Architecture
1. **Componentization**: Small, focused components
2. **Reusability**: Base components can be used elsewhere
3. **Separation of Concerns**: UI, logic, and data are separated
4. **Type Safety**: TypeScript interfaces for all props
5. **Maintainability**: Easy to locate and modify specific features

## Key Improvements Over Original

### 1. Backend Separation
**Original**: Single DistributionService with multiple responsibilities
**New**: 5 focused services, each with single responsibility

### 2. Component Hierarchy
**Original**: Monolithic 1666-line component
**New**: 15+ small, focused components

### 3. State Management
**Original**: 30+ useState calls in one component
**New**: Custom hook encapsulates all state

### 4. Error Handling
**Original**: Basic error messages
**New**: Structured error handling with detailed validation errors

### 5. Type Safety
**Original**: Minimal TypeScript usage
**New**: Full TypeScript with interfaces for all components

## Email Workflow

1. **User selects event** → Fetches attendees from Google Sheets
2. **System auto-maps fields** → First name, last name, email
3. **User composes email** → Subject, body, template selection
4. **User generates preview** → Personalizes emails for all recipients
5. **User confirms distribution** → Validation and queuing
6. **Background jobs process** → QR generation, email sending
7. **Mail logs created** → Track delivery status

## Flexibility Features

### Template System
- Support for multiple email templates
- Template variables: `{{event_name}}`, `{{event_date}}`, `{{body}}`
- User content injection via `{{body}}` placeholder

### Field Placeholders
- Any column from data source can be used as `{{column_name}}`
- Auto-replacement in email body

### QR Code Support
- Automatic ticket generation for emails with `{{qr}}` placeholder
- Unique ticket codes with event metadata
- Base64-encoded QR images embedded in emails

### Domain Validation
- Automatic detection of suspicious email domains
- Visual warnings for potential typos
- Domain usage statistics

## Extension Points

### Adding New Email Types
1. Add service method in `EmailDistributionService`
2. Create new component for UI
3. Update `useEmailDistribution` hook

### Adding New Data Sources
1. Implement new service (e.g., `ExcelImportService`)
2. Update `EmailDistributionService` to support new source
3. Add UI component for source selection

### Adding Email Features
1. Create new formatting method in `EmailFormattingService`
2. Add UI controls in `EmailComposer` or `RichTextEditor`
3. Update preview generation in hook

## Testing Strategy

### Backend Testing
- Unit test each service independently
- Mock dependencies using interfaces
- Test validation rules in FormRequest
- Integration tests for full distribution flow

### Frontend Testing
- Test base components in isolation
- Test feature components with mocked hooks
- Test hook logic with mocked API calls
- E2E tests for full user workflow

## Future Enhancements

1. **Real-time Preview**: Live preview as user types
2. **Attachment Support**: Allow file attachments
3. **Scheduling**: Queue emails for future sending
4. **A/B Testing**: Send different variants
5. **Analytics**: Track open rates, click rates
6. **Bulk Import**: Upload CSV files directly
7. **Template Builder**: Visual template editor

## File Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── EmailDistributorController.php
│   │   └── DistributionController.php
│   └── Requests/
│       └── DistributeEmailsRequest.php
└── Services/
    ├── EmailDistributionService.php
    ├── QrCodeGenerationService.php
    ├── EmailQueueService.php
    ├── EmailFormattingService.php
    └── GoogleSheetsService.php

resources/js/
├── components/
│   └── email-distributor/
│       ├── base-form-section.tsx
│       ├── base-field-mapper.tsx
│       ├── base-data-preview.tsx
│       ├── email-composer.tsx
│       ├── rich-text-editor.tsx
│       ├── template-selector.tsx
│       ├── event-selector.tsx
│       ├── field-mapping-section.tsx
│       ├── data-source-preview.tsx
│       ├── recipient-summary.tsx
│       ├── distribution-dialog.tsx
│       └── email-preview.tsx
├── hooks/
│   └── use-email-distribution.ts
└── pages/
    └── email-distributor.tsx
```
