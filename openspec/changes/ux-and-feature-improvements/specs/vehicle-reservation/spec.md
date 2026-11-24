# Spec Delta

## MODIFIED Requirements

### Requirement: Reservation confirmation
The system SHALL show the calculated total price and applicable cancellation policy summary prior to confirmation, revalidate availability, and create the reservation atomically.

#### Scenario: Vehicle remains available
- **WHEN** an authenticated user confirms a vehicle that is still available
- **THEN** the system reserves the vehicle for the requested period and confirms the reservation

#### Scenario: Total and policy preview before booking
- **WHEN** a user reviews a vehicle in the confirmation modal for a valid date range
- **THEN** the system displays the number of rental days, total price, and free-cancellation window before confirmation

#### Scenario: Vehicle becomes unavailable
- **WHEN** availability changes before final confirmation
- **THEN** the system does not create the reservation and clearly tells the user to choose another vehicle

### Requirement: Payment choice
The system SHALL offer immediate payment and payment at pickup for a valid reservation, and SHALL allow in-place recovery when immediate payment fails.

#### Scenario: Immediate payment
- **WHEN** the user chooses immediate payment and completes payment successfully
- **THEN** the system records a confirmed reservation and payment

#### Scenario: Payment at pickup
- **WHEN** the user chooses payment at pickup
- **THEN** the system records the reservation as confirmed with payment pending

#### Scenario: Failed immediate payment
- **WHEN** immediate payment fails
- **THEN** the system does not confirm the reservation, keeps the reservation form open with the user's selections, and lets the user retry immediate payment or switch to payment at pickup

### Requirement: Reservation management
The system SHALL allow the owner to view full details and modify eligible upcoming reservations directly from the interface.

#### Scenario: View own reservation
- **WHEN** an authenticated user opens its reservation details
- **THEN** the system shows status, vehicle, period, pickup location, total price, payment method, and payment/refund state

#### Scenario: Modify eligible reservation
- **WHEN** the owner changes dates or vehicle from the reservation management UI and the replacement is available
- **THEN** the system updates the reservation and recalculates the price

#### Scenario: Prevent unauthorized modification
- **WHEN** a user attempts to modify a reservation owned by another account
- **THEN** the system denies the action

### Requirement: Cancellation and refund
The system SHALL preview the applicable cancellation policy and refund amount prior to cancellation, apply the configurable cancellation policy, and issue the corresponding refund.

#### Scenario: Cancellation confirmation preview
- **WHEN** an owner clicks cancel on an active reservation
- **THEN** the system displays a confirmation dialog showing the applied policy tier and exact estimated refund amount before cancelling

#### Scenario: Free cancellation window
- **WHEN** the owner cancels within the configured free-cancellation window
- **THEN** the system cancels the reservation and refunds the eligible amount fully

#### Scenario: Late cancellation
- **WHEN** the owner cancels outside the configured free-cancellation window
- **THEN** the system applies the configured partial refund or no-refund rule and reports the amount

#### Scenario: Pickup payment cancellation
- **WHEN** an owner cancels a reservation with payment pending
- **THEN** the system cancels it without charging for the rental
