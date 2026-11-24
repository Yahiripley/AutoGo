import test from "node:test";
import assert from "node:assert/strict";
import { processImmediatePayment } from "../server/payments.js";

test("mock immediate payment succeeds for a valid amount", async () => {
  const payment = await processImmediatePayment({
    amountCents: 170000,
    provider: "mock",
    result: "success"
  });
  assert.equal(payment.status, "paid");
  assert.ok(payment.reference.startsWith("mock_"));
});

test("mock immediate payment failure leaves no paid result", async () => {
  const payment = await processImmediatePayment({
    amountCents: 170000,
    provider: "mock",
    result: "failure"
  });
  assert.equal(payment.status, "failed");
  assert.equal(payment.reference, null);
});
