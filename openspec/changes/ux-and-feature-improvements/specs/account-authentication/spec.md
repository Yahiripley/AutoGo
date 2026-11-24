# Spec Delta

## MODIFIED Requirements

### Requirement: Authenticated access
The system SHALL require authentication before a user can create or manage a reservation, persist authenticated sessions across server restarts, and display the active account identity in the interface.

#### Scenario: Unauthenticated reservation attempt
- **WHEN** an unauthenticated visitor attempts to start or confirm a reservation
- **THEN** the system redirects or prompts the visitor to authenticate and resumes the reservation flow after login

#### Scenario: Session logout
- **WHEN** an authenticated user logs out
- **THEN** the system ends the session, invalidates the stored session token, and prevents subsequent access to protected actions

#### Scenario: Session survives server restart
- **WHEN** an authenticated user reloads or makes a request after the backend server restarts
- **THEN** the system preserves the active session until explicit logout or expiration

#### Scenario: Visible active user identity
- **WHEN** a user is signed in
- **THEN** the header displays the user's name and role badge when the user is an administrator

## ADDED Requirements

### Requirement: Administrator account bootstrap
The system SHALL ensure an initial administrator account can be provisioned via configuration or non-production bootstrap so administrative features can be accessed without manual database edits.

#### Scenario: Configured administrator bootstrap
- **WHEN** administrator bootstrap credentials are configured and no matching admin exists
- **THEN** the system creates the administrator account with a hashed password on startup
