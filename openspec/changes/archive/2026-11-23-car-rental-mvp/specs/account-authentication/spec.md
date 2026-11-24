# Spec Delta

## Purpose

Permitir que clientes crean cuentas, inicia una sesión segura y acceden únicamente a sus propias reservas.

## ADDED Requirements

### Requirement: Account registration
The system SHALL allow a visitor to register an account with a unique email address and a password that satisfies the configured security policy.

#### Scenario: Successful registration
- **WHEN** a visitor submits valid account details
- **THEN** the system creates the account and starts an authenticated session

#### Scenario: Duplicate email
- **WHEN** a visitor registers with an email already assigned to an account
- **THEN** the system rejects the registration without revealing account data

### Requirement: Authenticated access
The system SHALL require authentication before a user can create or manage a reservation.

#### Scenario: Unauthenticated reservation attempt
- **WHEN** an unauthenticated visitor attempts to start or confirm a reservation
- **THEN** the system redirects or prompts the visitor to authenticate

#### Scenario: Session logout
- **WHEN** an authenticated user logs out
- **THEN** the system ends the session and prevents subsequent access to protected actions

### Requirement: Account-owned data
The system SHALL restrict reservation records to the account that owns them.

#### Scenario: Owner access
- **WHEN** a registered user requests a reservation it owns
- **THEN** the system returns that reservation

#### Scenario: Other account access
- **WHEN** a registered user requests a reservation owned by another account
- **THEN** the system denies access
