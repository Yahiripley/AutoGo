# Spec Delta

## Purpose

Permitir a usuarios autenticados reservar vehículos y administrar el ciclo completo de confirmación, pago y cancelación.

## ADDED Requirements

### Requirement: Reservation confirmation
The system SHALL revalidate availability before confirming a reservation and SHALL create it atomically.

#### Scenario: Vehicle remains available
- **WHEN** an authenticated user confirms a vehicle that is still available
- **THEN** the system reserves the vehicle for the requested period and confirms the reservation

#### Scenario: Vehicle becomes unavailable
- **WHEN** availability changes before final confirmation
- **THEN** the system does not create the reservation and clearly tells the user to choose another vehicle

### Requirement: Payment choice
The system SHALL offer immediate payment and payment at pickup for a valid reservation.

#### Scenario: Immediate payment
- **WHEN** the user chooses immediate payment and completes payment successfully
- **THEN** the system records a confirmed reservation and payment

#### Scenario: Payment at pickup
- **WHEN** the user chooses payment at pickup
- **THEN** the system records the reservation as confirmed with payment pending

#### Scenario: Failed immediate payment
- **WHEN** immediate payment fails
- **THEN** the system does not confirm the reservation and explains how to retry or change payment method

### Requirement: Reservation management
The system SHALL allow the owner to view and modify eligible upcoming reservations.

#### Scenario: View own reservation
- **WHEN** an authenticated user opens its reservation details
- **THEN** the system shows status, vehicle, period, location, price, and payment state

#### Scenario: Modify eligible reservation
- **WHEN** the owner changes dates or vehicle and the replacement is available
- **THEN** the system updates the reservation and recalculates the price

#### Scenario: Prevent unauthorized modification
- **WHEN** a user attempts to modify a reservation owned by another account
- **THEN** the system denies the action

### Requirement: Cancellation and refund
The system SHALL apply a configurable cancellation policy and SHALL issue the corresponding refund.

#### Scenario: Free cancellation window
- **WHEN** the owner cancels within the configured free-cancellation window
- **THEN** the system cancels the reservation and refunds the eligible amount fully

#### Scenario: Late cancellation
- **WHEN** the owner cancels outside the configured free-cancellation window
- **THEN** the system applies the configured partial refund or no-refund rule and reports the amount

#### Scenario: Pickup payment cancellation
- **WHEN** an owner cancels a reservation with payment pending
- **THEN** the system cancels it without charging for the rental
