# Spec Delta

## MODIFIED Requirements

### Requirement: Vehicle search
The system SHALL return vehicles available for the requested pickup location and rental period using case-insensitive partial location matching, suggested pickup locations, and sensible default rental dates.

#### Scenario: Available vehicles
- **WHEN** a user searches valid dates and a supported location
- **THEN** the system lists vehicles that are available for every requested day

#### Scenario: Case-insensitive partial location match
- **WHEN** a user searches a partial or lowercase location such as "monterrey" or "monte"
- **THEN** the system returns matching active vehicles in that location

#### Scenario: Invalid rental period
- **WHEN** the return date is earlier than or equal to the pickup date
- **THEN** the system rejects the search and explains the date requirement

#### Scenario: Default and preset search dates
- **WHEN** a user opens the vehicle catalog for the first time
- **THEN** the search bar pre-populates a valid upcoming pickup and return period and offers quick duration presets

### Requirement: Vehicle filtering
The system SHALL allow users to filter and sort catalog results by vehicle characteristics and price.

#### Scenario: Filter by category
- **WHEN** a user selects a vehicle category
- **THEN** the system lists only vehicles in that category that match the search period

#### Scenario: Filter by capacity
- **WHEN** a user specifies a minimum passenger capacity
- **THEN** the system excludes vehicles below that capacity

#### Scenario: Sort catalog results
- **WHEN** a user chooses a sort order such as lowest price, highest price, or capacity
- **THEN** the system reorders the matching vehicles accordingly

### Requirement: Vehicle details
The system SHALL show clear vehicle details, calculated rental totals, and live availability before a reservation begins.

#### Scenario: Detail view
- **WHEN** a user opens a vehicle from search results
- **THEN** the system shows specifications, description, rental terms, visual representation, daily rate, and calculated total price for the selected dates

#### Scenario: Edit dates inside vehicle detail
- **WHEN** a user adjusts pickup or return dates inside the vehicle detail view
- **THEN** the system recalculates the rental duration and total price before confirmation

#### Scenario: Vehicle unavailable
- **WHEN** a vehicle becomes unavailable before its detail page is used
- **THEN** the system indicates that it cannot be reserved and offers current alternatives
