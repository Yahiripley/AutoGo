# vehicle-catalog Specification

## Purpose

Permitir a los usuarios descubrir vehículos elegibles mediante ubicación, fechas y filtros de características.

## Requirements

### Requirement: Vehicle search
The system SHALL return vehicles available for the requested pickup location and rental period.

#### Scenario: Available vehicles
- **WHEN** a user searches valid dates and a supported location
- **THEN** the system lists vehicles that are available for every requested day

#### Scenario: Invalid rental period
- **WHEN** the return date is earlier than or equal to the pickup date
- **THEN** the system rejects the search and explains the date requirement

### Requirement: Vehicle filtering
The system SHALL allow users to filter catalog results by vehicle characteristics.

#### Scenario: Filter by category
- **WHEN** a user selects a vehicle category
- **THEN** the system lists only vehicles in that category that match the search period

#### Scenario: Filter by capacity
- **WHEN** a user specifies a minimum passenger capacity
- **THEN** the system excludes vehicles below that capacity

### Requirement: Vehicle details
The system SHALL show clear vehicle details before a reservation begins.

#### Scenario: Detail view
- **WHEN** a user opens a vehicle from search results
- **THEN** the system shows specifications, rental terms, images, and the applicable price

#### Scenario: Vehicle unavailable
- **WHEN** a vehicle becomes unavailable before its detail page is used
- **THEN** the system indicates that it cannot be reserved and offers current alternatives
