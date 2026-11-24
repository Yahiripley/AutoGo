# fleet-administration Specification

## Purpose

Permitir a administradores mantener el catálogo operativo con vehículos, precios, disponibilidad e inventario coherentes.

## Requirements

### Requirement: Administrative authorization
The system SHALL restrict fleet administration to accounts assigned an administrator role.

#### Scenario: Administrator access
- **WHEN** an administrator opens fleet management
- **THEN** the system allows authorized vehicle and inventory actions

#### Scenario: Customer access attempt
- **WHEN** a customer without the administrator role attempts an administrative action
- **THEN** the system denies access

### Requirement: Vehicle management
The system SHALL allow administrators to create, edit, disable, and restore vehicles.

#### Scenario: Add vehicle
- **WHEN** an administrator provides valid vehicle and pricing information
- **THEN** the system adds the vehicle to the configured inventory

#### Scenario: Disable vehicle
- **WHEN** an administrator disables a vehicle
- **THEN** the system prevents new reservations while preserving existing reservations

### Requirement: Inventory and pricing
The system SHALL let administrators control rental prices and availability periods.

#### Scenario: Update price
- **WHEN** an administrator changes a vehicle price or scheduled rate
- **THEN** future searches use the updated applicable price

#### Scenario: Block inventory
- **WHEN** an administrator blocks a vehicle for a period
- **THEN** search and reservation flows exclude that vehicle during the blocked period

### Requirement: Reservation visibility
The system SHALL give administrators operational visibility into reservations.

#### Scenario: Review reservations
- **WHEN** an administrator reviews the fleet
- **THEN** the system lists reservations with status, vehicle, customer, dates, and payment state

#### Scenario: Sensitive data protection
- **WHEN** an administrator views operational reservation data
- **THEN** the system exposes only fields required for fleet operations
