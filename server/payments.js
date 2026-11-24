export async function processImmediatePayment({ amountCents, provider, result = "success" }) {
  if (provider === "mock" && result === "failure") {
    return { status: "failed", reference: null };
  }
  if (!Number.isInteger(amountCents) || amountCents < 1) {
    return { status: "failed", reference: null };
  }
  return { status: "paid", reference: `mock_${Date.now()}_${amountCents}` };
}
