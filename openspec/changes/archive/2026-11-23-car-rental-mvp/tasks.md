# Tasks

## 1. Project Foundation

- [x] 1.1 Choose the application stack and create the web project structure; verify the app starts locally and a health check responds
- [x] 1.2 Configure environment-based settings for base currency, cancellation policy, authentication secrets, and payment provider; verify configuration validation fails for missing required values
- [x] 1.3 Create the initial database schema and migrations for accounts, vehicles, inventory periods, reservations, payments, and refunds; verify migrations run on a clean database

## 2. Account and Authentication

- [x] 2.1 Implement account registration and login with secure credential handling; verify duplicate and invalid credentials are rejected
- [x] 2.2 Implement logout and protected-route authorization; verify unauthenticated users cannot create or view reservations
- [x] 2.3 Implement administrator role assignment and authorization; verify customer and anonymous roles receive denied access for administrative actions

## 3. Vehicle Catalog

- [x] 3.1 Implement vehicle, location, price, and availability models; verify seed data can be queried and disabled vehicles are excluded
- [x] 3.2 Build search and filtering for location, dates, category, and passenger capacity; verify overlapping and invalid periods return no or clearly rejected results
- [x] 3.3 Build vehicle detail and unavailable-state presentation; verify stale catalog entries revalidate availability before reservation

## 4. Reservation Core

- [x] 4.1 Implement atomic availability checks and overlapping-period reservation creation; verify concurrent confirmations create only one reservation for the same period
- [x] 4.2 Implement owner-only reservation view and modification; verify cross-account and unauthorized modification attempts are denied
- [x] 4.3 Implement pickup-payment reservations; verify confirmation creates payment pending and the amount remains payable
- [x] 4.4 Implement immediate-payment integration through an abstraction; verify success confirms the reservation and failure leaves it unconfirmed

## 5. Cancellation and Refunds

- [x] 5.1 Implement configurable cancellation policy snapshots; verify the applicable free-cancellation or partial/no-refund rule is shown before cancellation
- [x] 5.2 Implement reservation cancellation and eligible refund state; verify free, late, and pickup-payment cancellations update the reservation correctly
- [x] 5.3 Implement refund reconciliation records; verify provider or manual refunds can be tracked as pending or completed

## 6. Fleet Administration

- [x] 6.1 Build administrator vehicle create and edit flows; verify valid data is persisted and invalid data is rejected
- [x] 6.2 Build inventory blocking and vehicle disable flows; verify new searches exclude blocked periods and existing reservations remain intact
- [x] 6.3 Build pricing updates and operational reservation visibility; verify future search prices change and sensitive fields remain protected

## 7. Web Experience

- [x] 7.1 Build registration, login, and logout interfaces; verify primary account flows work end-to-end
- [x] 7.2 Build catalog, detail, and reservation confirmation interfaces; verify users receive clear unavailable and payment-failure states
- [x] 7.3 Build reservation management and cancellation interfaces; verify owners see status and policy outcomes accurately
- [x] 7.4 Build the administrator fleet interface; verify administrators can manage vehicles, prices, inventory, and view reservations

## 8. Integration Verification

- [x] 8.1 Add end-to-end tests for account-required reservation, immediate payment, pickup payment, and availability race; verify each scenario passes
- [x] 8.2 Add end-to-end tests for free and late cancellation; verify status and refund outcomes match the configured policy
- [x] 8.3 Add authorization and privacy tests across customer and administrator flows; verify data isolation and role restrictions
- [x] 8.4 Run the complete test suite and local smoke check; verify migrations, application startup, core flows, and expected documentation are complete
