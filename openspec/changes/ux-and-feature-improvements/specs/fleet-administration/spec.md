# Spec Delta

## MODIFIED Requirements

### Requirement: Vehicle management
The system SHALL allow administrators to view all vehicles (including disabled ones) and create, edit, disable, and restore vehicles with human-readable pricing.

#### Scenario: Add vehicle
- **WHEN** an administrator provides valid vehicle and daily pricing information in base currency units
- **THEN** the system adds the vehicle to the configured inventory

#### Scenario: Edit vehicle details
- **WHEN** an administrator updates a vehicle's name, category, capacity, location, description, or daily rate via the admin form
- **THEN** the system persists the changes without requiring raw cent values or browser prompts

#### Scenario: Disable vehicle
- **WHEN** an administrator disables a vehicle
- **THEN** the system prevents new reservations while preserving existing reservations

#### Scenario: Restore and list disabled vehicles
- **WHEN** an administrator views the fleet after disabling a vehicle
- **THEN** the disabled vehicle remains visible in the administrator list and can be restored to active status

### Requirement: Inventory and pricing
The system SHALL let administrators control rental prices in primary currency units and create, view, and remove availability blocks.

#### Scenario: Update price
- **WHEN** an administrator changes a vehicle price in primary currency units
- **THEN** future searches use the updated applicable price

#### Scenario: Block inventory
- **WHEN** an administrator blocks a vehicle for a period
- **THEN** search and reservation flows exclude that vehicle during the blocked period and the admin is warned if active reservations already overlap that period

#### Scenario: List and remove inventory blocks
- **WHEN** an administrator views or deletes an inventory block
- **THEN** the system lists active blocks with vehicle and reason and removes deleted blocks so the vehicle becomes searchable again

### Requirement: Reservation visibility
The system SHALL give administrators operational visibility into reservations with status filtering and refund state.

#### Scenario: Review reservations
- **WHEN** an administrator reviews the fleet
- **THEN** the system lists reservations with status, vehicle, customer, dates, total price, and payment/refund state

#### Scenario: Filter operational reservations
- **WHEN** an administrator filters reservations by status or payment state
- **THEN** the system narrows the operational list accordingly

#### Scenario: Sensitive data protection
- **WHEN** an administrator views operational reservation data
- **THEN** the system exposes only fields required for fleet operations
