# Design

## Context

See proposal.md for motivation and scope. The repository is currently a greenfield OpenSpec project with no application implementation or existing service conventions.

The design must cover four bounded areas: authenticated customer accounts, vehicle discovery, transactional reservations, and fleet administration. Availability and pricing are shared across customer and operational flows.

## Goals / Non-Goals

**Goals:**

- Keep availability validation consistent between search and confirmation.
- Ensure one vehicle period cannot be sold twice.
- Separate customer actions from fleet administration.
- Support payment immediately or at pickup without making the payment provider a core data-model dependency.
- Leave cancellation policy values configurable instead of hard-coding one market policy.

**Non-Goals:**

- Real-time collaboration or multi-region synchronization.
- Connected car telemetry or physical pickup automation.
- Advanced fraud detection or chargeback operations.
- International taxes and localization beyond a configurable base currency.

## Decisions

- **Use authenticated account state for all protected operations.**
  - Reservation ownership, payment state, and cancellation authorization rely on the authenticated account.
  - Alternative: anonymous reservations with later account linking. Rejected because the confirmed scope requires accounts and account-owned records.

- **Use a transactional reservation hold during final confirmation.**
  - Search may be approximate, but confirmation must recheck availability and reserve the period in one atomic transaction.
  - The selected period is represented independently from vehicle master data so inventory blocks and existing reservations can be evaluated deterministically.
  - Alternative: check availability without locking and create later. Rejected because it can accept overlapping reservations.

- **Separate catalog read models from fleet writes.**
  - Customer searches read active vehicles and availability; administrators change vehicle, price, and inventory records through protected operations.
  - Alternative: direct dashboard writes to catalog tables. Rejected because it makes authorization and validation inconsistent.

- **Model payment as a reservation state, not as a reservation status itself.**
  - A reservation can be confirmed while payment is pending for pickup.
  - Immediate payment records success or failure as a separate payment transaction.
  - Alternative: require payment status to determine reservation validity. Rejected because valid reservations without prepayment are an explicit MVP requirement.

- **Use configurable cancellation rules.**
  - Store the free-cancellation window and refund percentages or amounts by policy, with the date of cancellation determining the applied rule.
  - Alternative: fixed refund percentages in UI code. Rejected because policy changes would require deployments and would be hard to audit.

- **Use role-based authorization for administration.**
  - Customer and administrator roles share account records but receive different permissions.
  - Alternative: a separate administrator login system. Rejected for the MVP because it adds identity duplication and migration cost.

## Risks / Trade-offs

- **Concurrent confirmations** -> Revalidate availability and enforce overlapping-period uniqueness inside the database transaction.
- **Payment provider outage** -> Keep pickup payment as a fallback and mark immediate-payment attempts retryable without confirming the reservation.
- **Incorrect cancellation policy configuration** -> Store effective policy snapshots on the reservation and show the applied rule before cancellation.
- **Stale catalog results** -> Revalidate on detail and confirmation, and clearly report sold-out periods.
- **Refund timing varies by provider** -> Persist the refund request and reconciliation state instead of assuming instant settlement.

## Migration Plan

No migration is needed for an existing application. Initial deployment should establish the account, catalog, reservation, payment, policy, and inventory schemas before exposing public reservation actions.

Rollback should disable reservation creation and payment paths, preserve account and reservation records, and retain administrator read access for reconciliation.

## Open Questions

- Supported cities and pickup locations.
- Authentication provider or local credential mechanism.
- Payment provider and supported card or wallet methods.
- Base currency and default cancellation-policy values.
