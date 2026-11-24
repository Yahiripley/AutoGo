export function readConfig(env = process.env) {
  const required = ["AUTOGO_SESSION_SECRET", "AUTOGO_PAYMENT_PROVIDER"];
  const missing = required.filter((name) => !String(env[name] || "").trim());
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(", ")}`);
  }

  const freeCancellationHours = Number(env.AUTOGO_FREE_CANCELLATION_HOURS ?? 48);
  const partialRefundPercent = Number(env.AUTOGO_PARTIAL_REFUND_PERCENT ?? 50);
  const sessionTtlDays = Number(env.AUTOGO_SESSION_TTL_DAYS ?? 7);
  if (!Number.isFinite(freeCancellationHours) || freeCancellationHours < 0) {
    throw new Error("AUTOGO_FREE_CANCELLATION_HOURS must be a non-negative number.");
  }
  if (!Number.isFinite(partialRefundPercent) || partialRefundPercent < 0 || partialRefundPercent > 100) {
    throw new Error("AUTOGO_PARTIAL_REFUND_PERCENT must be between 0 and 100.");
  }
  if (!Number.isFinite(sessionTtlDays) || sessionTtlDays <= 0) {
    throw new Error("AUTOGO_SESSION_TTL_DAYS must be a positive number.");
  }

  const isProduction = env.NODE_ENV === "production";
  const adminEmail = String(env.AUTOGO_ADMIN_EMAIL || (!isProduction ? "admin@autogo.local" : "")).trim().toLowerCase();
  const adminPassword = String(env.AUTOGO_ADMIN_PASSWORD || (!isProduction ? "Admin123!" : ""));
  const adminName = String(env.AUTOGO_ADMIN_NAME || "AutoGo Admin").trim();

  return {
    sessionSecret: env.AUTOGO_SESSION_SECRET,
    currency: env.AUTOGO_BASE_CURRENCY || "MXN",
    freeCancellationHours,
    partialRefundPercent,
    paymentProvider: env.AUTOGO_PAYMENT_PROVIDER,
    sessionTtlDays,
    adminEmail,
    adminPassword,
    adminName,
    isDevDemoAdmin: !isProduction && !env.AUTOGO_ADMIN_EMAIL && Boolean(adminEmail && adminPassword),
  };
}
