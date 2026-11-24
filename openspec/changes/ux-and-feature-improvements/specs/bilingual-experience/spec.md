# Spec Delta

## Purpose

Permitir que los usuarios operen AutoGo completamente en español o inglés, con preferencia persistente y formato coherente de moneda, fechas y mensajes.

## ADDED Requirements

### Requirement: Language switching
The system SHALL allow users to switch the interface language between Spanish (`es`) and English (`en`) and SHALL persist the selected preference across page reloads.

#### Scenario: Switch language from header
- **WHEN** a user selects English or Spanish in the language switcher
- **THEN** the system updates navigation, forms, buttons, statuses, and feedback messages to the chosen language immediately

#### Scenario: Persist language preference
- **WHEN** a user reloads the browser after selecting a language
- **THEN** the system restores the previously selected language automatically

### Requirement: Localized feedback and validation
The system SHALL present validation errors, server error responses, and operational status labels in the active interface language.

#### Scenario: Localized server error
- **WHEN** an API request fails with a structured error code while Spanish is active
- **THEN** the UI displays the corresponding Spanish explanation rather than raw untranslated technical text

#### Scenario: Localized status badges
- **WHEN** reservations or payments are displayed in customer or admin views
- **THEN** statuses such as confirmed, cancelled, pending, and paid are rendered in the active language

### Requirement: Consistent currency and date formatting
The system SHALL format monetary amounts in the configured base currency and render rental timestamps in a human-readable locale format.

#### Scenario: Currency formatting
- **WHEN** daily rates, reservation totals, or refunds are displayed
- **THEN** the system formats them clearly with currency context (e.g., MXN) rather than raw cents
